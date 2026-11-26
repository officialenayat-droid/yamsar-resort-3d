/**
 * The Yamsar Resort booking & admin API (Hono). Runtime-neutral:
 *   server/node.ts                  – Node + SQLite (local dev, single server)
 *   supabase/functions/api/index.ts – Supabase Edge (Deno) + Postgres (production)
 */
import { Hono, type Context, type MiddlewareHandler } from 'hono'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { availability, getConfig, seed, type Store } from './store.ts'
import { checkPassword, initAuth, issueToken, setPassword, verifyToken } from './auth.ts'
import { mailStatus, notifyNewBooking, notifyStatusChange, parseRecipients, sendTestEmail } from './mailer.ts'
import { addDaysISO, parseDay, quote, todayIST } from '../shared/pricing.ts'
import type { Booking, BookingStatus, CabinId } from '../shared/types.ts'
import { CABIN_IDS } from '../shared/types.ts'

// ───────────── validation ─────────────
const day = z.string().refine((s) => !Number.isNaN(parseDay(s)), 'Invalid date')
const cabin = z.enum(CABIN_IDS as [CabinId, ...CabinId[]])
const text = (max: number) => z.string().trim().max(max)
const STATUSES = ['pending', 'confirmed', 'cancelled', 'checked_in', 'completed'] as const

const BookingBody = z.object({
  cabin,
  checkIn: day,
  checkOut: day,
  adults: z.number().int().min(1).max(12),
  children: z.number().int().min(0).max(8),
  addons: z.array(z.string().max(40)).max(20).default([]),
  name: text(80).min(2, 'Please add the lead guest’s name.'),
  phone: text(24).regex(/^\+?[\d\s()-]{7,}$/, 'Please add a valid phone number.'),
  email: z.union([z.literal(''), z.email('Please check the email address.')]).optional().default(''),
  notes: text(600).optional().default(''),
})
const money = z.number().int().min(0).max(10_000_000)
const Season = z.object({ id: text(40).min(1), name: text(60), from: day, to: day, rate: money })
const Stay = z.object({
  id: cabin,
  name: text(80).min(1),
  short: text(40).min(1),
  tagline: text(240),
  rate: money,
  weekendRate: money.nullable(),
  seasons: z.array(Season).max(50),
  sleeps: z.number().int().min(1).max(20),
  size: text(30),
  view: text(80),
  features: z.array(text(120)).max(20),
  units: z.number().int().min(0).max(100),
  active: z.boolean(),
})
const Addon = z.object({
  id: text(40).regex(/^[a-z0-9-]+$/, 'IDs use lowercase letters, numbers and dashes'),
  name: text(100).min(1),
  note: text(240),
  price: money,
  per: z.enum(['adult', 'guest', 'stay', 'night']),
  active: z.boolean(),
})
const emailList = text(500).refine(
  (v) => v.trim() === '' || v.split(/[,;\s]+/).filter(Boolean).every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
  'Check the notification email addresses (separate them with commas).',
)
const SettingsBody = z.object({
  resortName: text(80).min(1),
  tagline: text(240),
  phone: text(30),
  whatsapp: text(20).regex(/^\d*$/, 'WhatsApp number: digits only, with country code (e.g. 917889504310)'),
  email: z.union([z.literal(''), z.email()]),
  address: text(200),
  instagram: z.union([z.literal(''), z.url()]),
  facebook: z.union([z.literal(''), z.url()]),
  checkInTime: text(20),
  checkOutTime: text(20),
  petsAllowed: z.boolean(),
  breakfastIncluded: z.boolean(),
  policies: text(2000),
  bookingMode: z.enum(['instant', 'request']),
  minNights: z.number().int().min(1).max(30),
  maxNights: z.number().int().min(1).max(365),
  maxAdvanceDays: z.number().int().min(1).max(1000),
  extraGuestFee: money,
  maxExtraGuests: z.number().int().min(0).max(10),
  gst: z.object({
    roomThreshold: z.number().int().min(0),
    roomLowRate: z.number().min(0).max(50),
    roomHighRate: z.number().min(0).max(50),
    addonRate: z.number().min(0).max(50),
  }),
  confirmationNote: text(400),
  notifyEmails: emailList,
  emailGuests: z.boolean(),
})

class HttpError extends Error {
  status: number
  extra?: Record<string, unknown>
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
  const r = schema.safeParse(raw)
  if (r.success) return r.data
  const issue = r.error.issues[0]
  throw new HttpError(400, issue?.message ?? 'Invalid request', { field: issue?.path.join('.') })
}

const newRef = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'YMS-' + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join('')
}

/** Best-effort client IP (platforms set x-forwarded-for). */
const clientIp = (c: Context) => c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'local'

/** In-memory fixed-window limiter (per instance; serverless instances each keep their own window). */
function rateLimit(max: number, windowMs: number): MiddlewareHandler {
  const hits = new Map<string, { n: number; reset: number }>()
  return async (c, next) => {
    const key = clientIp(c)
    const now = Date.now()
    const h = hits.get(key)
    if (!h || now > h.reset) hits.set(key, { n: 1, reset: now + windowMs })
    else if (++h.n > max) return c.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429)
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k)
    await next()
  }
}

export function createApp(store: Store) {
  // seed config + admin password once per instance (idempotent)
  let ready: Promise<void> | null = null
  const ensureReady = () => (ready ??= (async () => {
    await seed(store)
    await initAuth(store)
  })().catch((e) => {
    ready = null
    throw e
  }))

  const app = new Hono()

  app.use('/api/*', async (c, next) => {
    await ensureReady()
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    if (!c.res.headers.has('Cache-Control')) c.header('Cache-Control', 'no-store')
  })

  app.onError((err, c) => {
    if (err instanceof HttpError) return c.json({ error: err.message, ...err.extra }, err.status as 400)
    console.error(err)
    return c.json({ error: 'Something went wrong on our side.' }, 500)
  })

  // ───────────── public ─────────────
  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/config', async (c) => {
    const cfg = await getConfig(store)
    const { notifyEmails: _hidden, ...settings } = cfg.settings // staff alert addresses are private
    void _hidden
    return c.json({ ...cfg, settings })
  })

  app.get('/api/availability', async (c) => {
    const checkIn = c.req.query('checkIn') ?? ''
    const checkOut = c.req.query('checkOut') ?? ''
    if (Number.isNaN(parseDay(checkIn)) || Number.isNaN(parseDay(checkOut)) || checkOut <= checkIn) throw new HttpError(400, 'Invalid dates')
    return c.json(await availability(store, checkIn, checkOut))
  })

  app.post('/api/bookings', rateLimit(8, 10 * 60_000), async (c) => {
    const b = await body(c, BookingBody)
    const cfg = await getConfig(store)
    const q = quote(b, cfg, todayIST())
    if (q.errors.length) throw new HttpError(400, q.errors[0])
    const stay = cfg.stays.find((s) => s.id === b.cabin)!
    const booking = await store.exclusive(b.cabin, async (tx) => {
      const left = (await availability(tx, b.checkIn, b.checkOut))[b.cabin]
      if (left < 1) throw new HttpError(409, `Sorry, ${stay.name} is fully booked for those dates. Please try other dates or another room.`)
      const now = new Date().toISOString()
      const nb: Booking = {
        ref: newRef(),
        createdAt: now,
        updatedAt: now,
        status: cfg.settings.bookingMode === 'instant' ? 'confirmed' : 'pending',
        cabin: stay.id,
        stayName: stay.name,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: q.nights,
        adults: b.adults,
        children: b.children,
        addons: b.addons,
        name: b.name,
        phone: b.phone,
        email: b.email ?? '',
        notes: b.notes ?? '',
        adminNotes: '',
        quote: q,
        total: q.total,
        source: 'website',
      }
      await tx.insertBooking(nb)
      return nb
    })
    notifyNewBooking(booking, cfg)
    console.log(`[booking] ${booking.ref} ${booking.status} ${stay.name} ${booking.checkIn}→${booking.checkOut} ₹${booking.total}`)
    const { ref, status, stayName, checkIn, checkOut, nights, adults, children, addons, name, total } = booking
    return c.json({ ref, status, stayName, checkIn, checkOut, nights, adults, children, addons, name, quote: booking.quote, total }, 201)
  })

  // ───────────── admin ─────────────
  app.post('/api/admin/login', rateLimit(6, 5 * 60_000), async (c) => {
    const { password } = await body(c, z.object({ password: z.string().max(200) }))
    if (!(await checkPassword(store, password))) throw new HttpError(401, 'That password didn’t match.')
    return c.json({ token: await issueToken(store) })
  })

  const admin = new Hono()
  admin.use('*', async (c, next) => {
    const h = c.req.header('authorization')
    if (!(await verifyToken(store, h?.startsWith('Bearer ') ? h.slice(7) : undefined))) return c.json({ error: 'Please sign in again.' }, 401)
    await next()
  })

  admin.get('/summary', async (c) => {
    const today = todayIST()
    const all = await store.listBookings({})
    const live = all.filter((b) => b.status !== 'cancelled')
    const month = today.slice(0, 7)
    return c.json({
      today,
      pending: all.filter((b) => b.status === 'pending').length,
      arrivalsToday: live.filter((b) => b.checkIn === today).length,
      inHouse: live.filter((b) => b.checkIn <= today && today < b.checkOut).length,
      upcoming: live.filter((b) => b.checkIn > today).length,
      revenueThisMonth: live.filter((b) => b.checkIn.startsWith(month)).reduce((a, b) => a + b.total, 0),
      tonight: await availability(store, today, addDaysISO(today, 1)),
    })
  })

  admin.get('/bookings', async (c) => {
    const q = c.req.query()
    return c.json(await store.listBookings({ status: q.status || undefined, from: q.from || undefined, to: q.to || undefined, q: q.q || undefined }))
  })

  admin.get('/bookings.csv', async (c) => {
    const rows = await store.listBookings({})
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = ['Reference', 'Status', 'Room', 'Check-in', 'Check-out', 'Nights', 'Adults', 'Children', 'Add-ons', 'Guest', 'Phone', 'Email', 'Guest notes', 'Admin notes', 'Subtotal', 'GST', 'Total', 'Created']
    const lines = rows.map((b) =>
      [b.ref, b.status, b.stayName, b.checkIn, b.checkOut, b.nights, b.adults, b.children, b.addons.join(' | '), b.name, b.phone, b.email, b.notes, b.adminNotes, b.quote.subtotal, b.quote.tax, b.total, b.createdAt].map(esc).join(','),
    )
    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="yamsar-bookings-${todayIST()}.csv"`)
    return c.body('﻿' + [head.map(esc).join(','), ...lines].join('\r\n'))
  })

  admin.patch('/bookings/:ref', async (c) => {
    const patch = await body(c, z.object({ status: z.enum(STATUSES).optional(), adminNotes: text(2000).optional() }))
    const current = await store.getBooking(c.req.param('ref'))
    if (!current) throw new HttpError(404, 'Booking not found')
    const update = async (s: Store) => {
      // re-activating a cancelled booking must not overbook
      if (current.status === 'cancelled' && patch.status && patch.status !== 'cancelled') {
        if ((await availability(s, current.checkIn, current.checkOut, current.ref))[current.cabin] < 1) throw new HttpError(409, 'That room is no longer free for these dates.')
      }
      return s.updateBooking(current.ref, patch as { status?: BookingStatus; adminNotes?: string })
    }
    const updated = patch.status ? await store.exclusive(current.cabin, update) : await update(store)
    if (updated && patch.status && patch.status !== current.status) notifyStatusChange(updated, await getConfig(store))
    return c.json(updated)
  })

  admin.get('/config', async (c) => c.json(await getConfig(store)))

  admin.put('/stays', async (c) => {
    const stays = await body(c, z.array(Stay).length(3))
    for (const s of stays) if (s.seasons.some((x) => x.to < x.from)) throw new HttpError(400, `${s.name}: a season ends before it starts.`)
    if (new Set(stays.map((s) => s.id)).size !== 3) throw new HttpError(400, 'Each room type must appear once.')
    await store.setKV('stays', stays)
    return c.json(await getConfig(store))
  })

  admin.put('/addons', async (c) => {
    const addons = await body(c, z.array(Addon).max(30))
    if (new Set(addons.map((a) => a.id)).size !== addons.length) throw new HttpError(400, 'Each experience needs a unique ID.')
    await store.setKV('addons', addons)
    return c.json(await getConfig(store))
  })

  admin.put('/settings', async (c) => {
    const s = await body(c, SettingsBody)
    if (s.minNights > s.maxNights) throw new HttpError(400, 'Minimum nights can’t be more than maximum nights.')
    await store.setKV('settings', s)
    return c.json(await getConfig(store))
  })

  admin.get('/blocks', async (c) => c.json(await store.listBlocks()))
  admin.post('/blocks', async (c) => {
    const b = await body(c, z.object({ cabin, from: day, to: day, units: z.number().int().min(1).max(100), reason: text(200) }))
    if (b.to <= b.from) throw new HttpError(400, 'The end date must be after the start date.')
    await store.addBlock(b)
    return c.json(await store.listBlocks(), 201)
  })
  admin.delete('/blocks/:id', async (c) => {
    await store.deleteBlock(Number(c.req.param('id')))
    return c.json(await store.listBlocks())
  })

  admin.get('/email/status', (c) => c.json(mailStatus()))
  admin.post('/email/test', rateLimit(5, 5 * 60_000), async (c) => {
    const cfg = await getConfig(store)
    try {
      await sendTestEmail(parseRecipients(cfg.settings.notifyEmails), cfg)
    } catch (e) {
      throw new HttpError(400, (e as Error).message)
    }
    return c.json({ ok: true, ...mailStatus() })
  })

  admin.post('/password', async (c) => {
    const b = await body(c, z.object({ current: z.string(), next: z.string().min(10, 'Use at least 10 characters.').max(200) }))
    if (!(await checkPassword(store, b.current))) throw new HttpError(401, 'Your current password didn’t match.')
    await setPassword(store, b.next)
    return c.json({ token: await issueToken(store) })
  })

  app.route('/api/admin', admin)
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))
  return app
}

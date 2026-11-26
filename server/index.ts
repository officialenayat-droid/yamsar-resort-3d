/**
 * The Yamsar Resort — booking & admin API.
 *   npm run api   (dev, auto-restart)   ·   npm start   (production)
 * Serves /api/* and, in production, the built site from ./dist.
 */
import './env.ts'
import express, { type NextFunction, type Request, type Response } from 'express'
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { z } from 'zod'
import { addBlock, availability, deleteBlock, getBooking, getConfig, insertBooking, listBlocks, listBookings, setKV, updateBooking } from './db.ts'
import { mailStatus, notifyNewBooking, notifyStatusChange, parseRecipients, sendTestEmail } from './mailer.ts'
import { checkPassword, initAuth, issueToken, rateLimit, requireAdmin, setPassword } from './auth.ts'
import { parseDay, quote, todayIST } from '../shared/pricing.ts'
import type { Booking, BookingStatus } from '../shared/types.ts'
import { CABIN_IDS } from '../shared/types.ts'

initAuth()

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false)
app.use(express.json({ limit: '100kb' }))
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// ───────────── validation ─────────────
const day = z.string().refine((s) => !Number.isNaN(parseDay(s)), 'Invalid date')
const cabin = z.enum(CABIN_IDS as [string, ...string[]])
const text = (max: number) => z.string().trim().max(max)

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

const Season = z.object({ id: text(40).min(1), name: text(60), from: day, to: day, rate: z.number().int().min(0).max(10_000_000) })
const Stay = z.object({
  id: cabin,
  name: text(80).min(1),
  short: text(40).min(1),
  tagline: text(240),
  rate: z.number().int().min(0).max(10_000_000),
  weekendRate: z.number().int().min(0).max(10_000_000).nullable(),
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
  price: z.number().int().min(0).max(10_000_000),
  per: z.enum(['adult', 'guest', 'stay', 'night']),
  active: z.boolean(),
})
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
  extraGuestFee: z.number().int().min(0).max(1_000_000),
  maxExtraGuests: z.number().int().min(0).max(10),
  gst: z.object({
    roomThreshold: z.number().int().min(0),
    roomLowRate: z.number().min(0).max(50),
    roomHighRate: z.number().min(0).max(50),
    addonRate: z.number().min(0).max(50),
  }),
  confirmationNote: text(400),
  notifyEmails: text(500).refine((v) => v.trim() === '' || v.split(/[,;\s]+/).filter(Boolean).every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)), 'Check the notification email addresses (separate them with commas).'),
  emailGuests: z.boolean(),
})
const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'checked_in', 'completed']

function parse<T>(schema: z.ZodType<T>, body: unknown, res: Response): T | null {
  const r = schema.safeParse(body)
  if (r.success) return r.data
  const issue = r.error.issues[0]
  res.status(400).json({ error: issue?.message ?? 'Invalid request', field: issue?.path.join('.') })
  return null
}

const newRef = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(6)
  return 'YMS-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

// ───────────── public API ─────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const cfg = getConfig()
  // staff alert addresses are private
  const { notifyEmails: _hidden, ...settings } = cfg.settings
  void _hidden
  res.json({ ...cfg, settings })
})

app.get('/api/availability', (req, res) => {
  const checkIn = String(req.query.checkIn ?? '')
  const checkOut = String(req.query.checkOut ?? '')
  if (Number.isNaN(parseDay(checkIn)) || Number.isNaN(parseDay(checkOut)) || checkOut <= checkIn) {
    res.status(400).json({ error: 'Invalid dates' })
    return
  }
  res.json(availability(checkIn, checkOut))
})

app.post('/api/bookings', rateLimit(8, 10 * 60_000), (req, res) => {
  const body = parse(BookingBody, req.body, res)
  if (!body) return
  const cfg = getConfig()
  const q = quote(body as Parameters<typeof quote>[0], cfg, todayIST())
  if (q.errors.length) {
    res.status(400).json({ error: q.errors[0] })
    return
  }
  // node:sqlite is synchronous, so check-then-insert can't interleave with another request
  const left = availability(body.checkIn, body.checkOut)[body.cabin as keyof ReturnType<typeof availability>]
  const stay = cfg.stays.find((s) => s.id === body.cabin)!
  if (left < 1) {
    res.status(409).json({ error: `Sorry, ${stay.name} is fully booked for those dates. Please try other dates or another room.` })
    return
  }
  const now = new Date().toISOString()
  const booking: Booking = {
    ref: newRef(),
    createdAt: now,
    updatedAt: now,
    status: cfg.settings.bookingMode === 'instant' ? 'confirmed' : 'pending',
    cabin: stay.id,
    stayName: stay.name,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    nights: q.nights,
    adults: body.adults,
    children: body.children,
    addons: body.addons,
    name: body.name,
    phone: body.phone,
    email: body.email ?? '',
    notes: body.notes ?? '',
    adminNotes: '',
    quote: q,
    total: q.total,
    source: 'website',
  }
  insertBooking(booking)
  notifyNewBooking(booking, cfg)
  console.log(`[booking] ${booking.ref} ${booking.status} ${stay.name} ${booking.checkIn}→${booking.checkOut} ₹${booking.total}`)
  res.status(201).json({
    ref: booking.ref,
    status: booking.status,
    stayName: booking.stayName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    adults: booking.adults,
    children: booking.children,
    addons: booking.addons,
    name: booking.name,
    quote: booking.quote,
    total: booking.total,
  })
})

// ───────────── admin API ─────────────
app.post('/api/admin/login', rateLimit(6, 5 * 60_000), (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!checkPassword(password)) {
    res.status(401).json({ error: 'That password didn’t match.' })
    return
  }
  res.json({ token: issueToken() })
})

const admin = express.Router()
admin.use(requireAdmin)

admin.get('/summary', (_req, res) => {
  const today = todayIST()
  const all = listBookings({})
  const live = all.filter((b) => b.status !== 'cancelled')
  const month = today.slice(0, 7)
  res.json({
    today,
    pending: all.filter((b) => b.status === 'pending').length,
    arrivalsToday: live.filter((b) => b.checkIn === today).length,
    inHouse: live.filter((b) => b.checkIn <= today && today < b.checkOut).length,
    upcoming: live.filter((b) => b.checkIn > today).length,
    revenueThisMonth: live.filter((b) => b.checkIn.startsWith(month)).reduce((a, b) => a + b.total, 0),
    tonight: availability(today, new Date(parseDay(today) + 86400000).toISOString().slice(0, 10)),
  })
})

admin.get('/bookings', (req, res) => {
  const q = req.query
  res.json(listBookings({ status: q.status ? String(q.status) : undefined, from: q.from ? String(q.from) : undefined, to: q.to ? String(q.to) : undefined, q: q.q ? String(q.q) : undefined }))
})

admin.get('/bookings.csv', (_req, res) => {
  const rows = listBookings({})
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Reference', 'Status', 'Room', 'Check-in', 'Check-out', 'Nights', 'Adults', 'Children', 'Add-ons', 'Guest', 'Phone', 'Email', 'Guest notes', 'Admin notes', 'Subtotal', 'GST', 'Total', 'Created']
  const lines = rows.map((b) =>
    [b.ref, b.status, b.stayName, b.checkIn, b.checkOut, b.nights, b.adults, b.children, b.addons.join(' | '), b.name, b.phone, b.email, b.notes, b.adminNotes, b.quote.subtotal, b.quote.tax, b.total, b.createdAt].map(esc).join(','),
  )
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="yamsar-bookings-${todayIST()}.csv"`)
  res.send('﻿' + [head.map(esc).join(','), ...lines].join('\r\n'))
})

admin.patch('/bookings/:ref', (req, res) => {
  const body = parse(z.object({ status: z.enum(STATUSES as [string, ...string[]]).optional(), adminNotes: text(2000).optional() }), req.body, res)
  if (!body) return
  const current = getBooking(String(req.params.ref))
  if (!current) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }
  // re-activating a cancelled booking must not overbook
  if (current.status === 'cancelled' && body.status && body.status !== 'cancelled') {
    if (availability(current.checkIn, current.checkOut, current.ref)[current.cabin] < 1) {
      res.status(409).json({ error: 'That room is no longer free for these dates.' })
      return
    }
  }
  const updated = updateBooking(current.ref, body as { status?: BookingStatus; adminNotes?: string })
  if (updated && body.status && body.status !== current.status) notifyStatusChange(updated, getConfig())
  res.json(updated)
})

admin.get('/config', (_req, res) => {
  res.json(getConfig())
})
admin.put('/stays', (req, res) => {
  const stays = parse(z.array(Stay).length(3), req.body, res)
  if (!stays) return
  for (const s of stays) {
    if (s.seasons.some((x) => x.to < x.from)) {
      res.status(400).json({ error: `${s.name}: a season ends before it starts.` })
      return
    }
  }
  setKV('stays', stays)
  res.json(getConfig())
})
admin.put('/addons', (req, res) => {
  const addons = parse(z.array(Addon).max(30), req.body, res)
  if (!addons) return
  if (new Set(addons.map((a) => a.id)).size !== addons.length) {
    res.status(400).json({ error: 'Each experience needs a unique ID.' })
    return
  }
  setKV('addons', addons)
  res.json(getConfig())
})
admin.put('/settings', (req, res) => {
  const s = parse(SettingsBody, req.body, res)
  if (!s) return
  if (s.minNights > s.maxNights) {
    res.status(400).json({ error: 'Minimum nights can’t be more than maximum nights.' })
    return
  }
  setKV('settings', s)
  res.json(getConfig())
})

admin.get('/blocks', (_req, res) => {
  res.json(listBlocks())
})
admin.post('/blocks', (req, res) => {
  const b = parse(z.object({ cabin, from: day, to: day, units: z.number().int().min(1).max(100), reason: text(200) }), req.body, res)
  if (!b) return
  if (b.to <= b.from) {
    res.status(400).json({ error: 'The end date must be after the start date.' })
    return
  }
  addBlock(b as Parameters<typeof addBlock>[0])
  res.status(201).json(listBlocks())
})
admin.delete('/blocks/:id', (req, res) => {
  deleteBlock(Number(req.params.id))
  res.json(listBlocks())
})

admin.get('/email/status', (_req, res) => {
  res.json(mailStatus())
})
admin.post('/email/test', rateLimit(5, 5 * 60_000), async (_req, res) => {
  const cfg = getConfig()
  try {
    await sendTestEmail(parseRecipients(cfg.settings.notifyEmails), cfg)
    res.json({ ok: true, ...mailStatus() })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

admin.post('/password', (req, res) => {
  const b = parse(z.object({ current: z.string(), next: z.string().min(10, 'Use at least 10 characters.').max(200) }), req.body, res)
  if (!b) return
  if (!checkPassword(b.current)) {
    res.status(401).json({ error: 'Your current password didn’t match.' })
    return
  }
  setPassword(b.next)
  res.json({ token: issueToken() })
})

app.use('/api/admin', admin)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ───────────── static site (production) ─────────────
const dist = resolve('dist')
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get(/^\/(?!api\/|assets\/).*/, (_req, res) => {
    res.sendFile(resolve(dist, 'index.html'))
  })
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next
  console.error(err)
  res.status(err instanceof SyntaxError ? 400 : 500).json({ error: err instanceof SyntaxError ? 'Invalid JSON' : 'Something went wrong on our side.' })
})

const PORT = Number(process.env.PORT ?? 8787)
app.listen(PORT, () => console.log(`Yamsar booking API on http://localhost:${PORT}${existsSync(dist) ? ' (serving ./dist)' : ''}`))

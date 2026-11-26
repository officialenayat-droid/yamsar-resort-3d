import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, Download, Loader2, MessageCircle, Minus, Plus, Ticket, X } from 'lucide-react'
import { actions, useStore } from '../state/store'
import { useConfig, useConfigStatus } from '../state/config'
import { addDaysISO, inr, parseDay, quote, todayIST } from '../../shared/pricing.ts'
import type { Availability, CabinId, Quote, BookingStatus } from '../../shared/types.ts'
import { audio } from '../audio/AudioEngine'
import { Crest } from '../svg/Illustrations'

const fmtDate = (s: string) => new Date(parseDay(s)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

interface Pass {
  ref: string
  status: BookingStatus
  stayName: string
  name: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  addons: string[]
  quote: Quote
  total: number
}

export function BookingDrawer() {
  const { open, cabin: initialCabin } = useStore((s) => s.booking)
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="booking" className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => actions.closeBooking()} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Reserve your stay"
            className="paper absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <BookingForm key={initialCabin} initialCabin={initialCabin} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-xs text-ink/55">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-cedar/30 bg-white text-pine disabled:opacity-30 btn-pop"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Fewer ${label}`}
        >
          <Minus size={15} />
        </button>
        <span className="w-5 text-center font-display text-lg">{value}</span>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-cedar/30 bg-white text-pine disabled:opacity-30 btn-pop"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More ${label}`}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

const inputCls = 'rounded-2xl border border-cedar/20 bg-white/80 px-4 py-3 text-sm outline-none focus:border-glacier'

function BookingForm({ initialCabin }: { initialCabin: CabinId }) {
  const cfg = useConfig()
  const configStatus = useConfigStatus()
  const { settings } = cfg
  const today = useMemo(() => todayIST(), [])
  const bookable = cfg.stays.filter((s) => s.active)
  const [checkIn, setCheckIn] = useState(() => addDaysISO(today, 21))
  const [checkOut, setCheckOut] = useState(() => addDaysISO(today, 21 + Math.max(2, settings.minNights)))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [cabin, setCabin] = useState<CabinId>(bookable.some((s) => s.id === initialCabin) ? initialCabin : (bookable[0]?.id ?? initialCabin))
  const [addons, setAddons] = useState<string[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [pass, setPass] = useState<Pass | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [avail, setAvail] = useState<Availability | null>(null)

  const stay = cfg.stays.find((s) => s.id === cabin)!
  const activeAddons = cfg.addons.filter((a) => a.active)
  const q = useMemo(() => quote({ cabin, checkIn, checkOut, adults, children, addons }, cfg, today), [cabin, checkIn, checkOut, adults, children, addons, cfg, today])
  const guests = adults + children
  const extraGuests = Math.max(0, guests - stay.sleeps)

  // live availability for the chosen dates
  useEffect(() => {
    setAvail(null)
    if (checkOut <= checkIn || configStatus !== 'live') return
    const ctl = new AbortController()
    const t = window.setTimeout(() => {
      fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((a: Availability | null) => setAvail(a))
        .catch(() => {})
    }, 250)
    return () => {
      ctl.abort()
      window.clearTimeout(t)
    }
  }, [checkIn, checkOut, configStatus])

  const soldOut = avail ? avail[cabin] < 1 : false

  const confirm = async () => {
    if (q.errors.length) return setError(q.errors[0])
    if (soldOut) return setError(`${stay.name} is fully booked for those dates.`)
    if (name.trim().length < 2) return setError('Please add the lead guest’s name.')
    if (!/^\+?[\d\s()-]{7,}$/.test(phone.trim())) return setError('Please add a valid phone number.')
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cabin, checkIn, checkOut, adults, children, addons, name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We couldn’t place that booking. Please try again.')
        if (res.status === 409) setAvail((a) => (a ? { ...a, [cabin]: 0 } : a))
        audio.fail()
        return
      }
      setPass(data as Pass)
      audio.stamp()
      window.setTimeout(() => audio.success(), 250)
    } catch {
      setError(`We couldn’t reach our booking system. Please call ${settings.phone} or WhatsApp us and we’ll book you in.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (pass) return <BookingPass pass={pass} onBack={() => setPass(null)} />

  return (
    <>
      <header className="flex items-center justify-between border-b border-cedar/15 px-6 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-glacier">Book direct with the resort</p>
          <h2 className="font-display text-2xl font-semibold text-pine">Reserve your stay</h2>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-pine btn-pop" onClick={() => actions.closeBooking()} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {configStatus === 'offline' && (
          <p className="rounded-2xl bg-saffron/10 px-4 py-3 text-sm text-cedar">
            Our booking system is offline right now. Prices shown may be out of date. Call <a className="font-semibold underline" href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a> to book.
          </p>
        )}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-pine">
            <CalendarDays size={16} /> Dates
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border border-cedar/20 bg-white/80 px-3 py-2">
              <span className="block text-[11px] uppercase tracking-wider text-ink/55">Check-in · from {settings.checkInTime}</span>
              <input
                type="date"
                className="w-full bg-transparent text-sm font-medium outline-none"
                value={checkIn}
                min={today}
                max={addDaysISO(today, settings.maxAdvanceDays)}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  setCheckIn(v)
                  if (v >= checkOut) setCheckOut(addDaysISO(v, Math.max(2, settings.minNights)))
                }}
              />
            </label>
            <label className="rounded-2xl border border-cedar/20 bg-white/80 px-3 py-2">
              <span className="block text-[11px] uppercase tracking-wider text-ink/55">Check-out · by {settings.checkOutTime}</span>
              <input type="date" className="w-full bg-transparent text-sm font-medium outline-none" value={checkOut} min={addDaysISO(checkIn, 1)} onChange={(e) => e.target.value && setCheckOut(e.target.value)} />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink/55">
            {q.nights} night{q.nights === 1 ? '' : 's'} · Sonamarg is at its greenest May–September; winter stays are snowbound and magical.
          </p>
        </section>

        <section className="rounded-2xl border border-cedar/15 bg-white/60 px-4 py-1">
          <Counter label="Adults" sub="Ages 13+" value={adults} min={1} max={8} onChange={setAdults} />
          <div className="h-px bg-cedar/10" />
          <Counter label="Children" sub="Ages 2–12" value={children} min={0} max={4} onChange={setChildren} />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-pine">Choose your room</h3>
          <div className="space-y-2">
            {bookable.map((s) => {
              const left = avail?.[s.id]
              const full = left !== undefined && left < 1
              return (
                <button
                  key={s.id}
                  onClick={() => setCabin(s.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-colors ${cabin === s.id ? 'border-saffron bg-saffron/5' : 'border-cedar/15 bg-white/70 hover:border-cedar/35'} ${full ? 'opacity-60' : ''}`}
                  aria-pressed={cabin === s.id}
                >
                  <div>
                    <div className="text-sm font-semibold text-ink">{s.name}</div>
                    <div className="text-xs text-ink/55">
                      Sleeps {s.sleeps} · {s.size}
                      {left !== undefined && (
                        <span className={`ml-2 font-semibold ${full ? 'text-[#b23a1a]' : left === 1 ? 'text-saffron' : 'text-glacier'}`}>
                          {full ? 'Fully booked' : left === 1 ? 'Last room' : `${left} available`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base font-semibold text-pine">{inr(s.rate)}</div>
                    <div className="text-[11px] text-ink/50">/ night</div>
                  </div>
                </button>
              )
            })}
          </div>
          {extraGuests > 0 && extraGuests <= settings.maxExtraGuests && (
            <p className="mt-2 rounded-xl bg-saffron/10 px-3 py-2 text-xs text-cedar">
              {guests} guests is more than this room sleeps ({stay.sleeps}). We’ll add extra bedding at {inr(settings.extraGuestFee)} per guest per night.
            </p>
          )}
        </section>

        {activeAddons.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-pine">Add experiences</h3>
            <div className="space-y-2">
              {activeAddons.map((a) => {
                const on = addons.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => setAddons((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${on ? 'border-glacier bg-glacier/5' : 'border-cedar/15 bg-white/70'}`}
                    aria-pressed={on}
                  >
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-glacier bg-glacier text-white' : 'border-cedar/30'}`}>
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-ink">{a.name}</span>
                      <span className="block text-xs text-ink/55">{a.note}</span>
                    </span>
                    <span className="text-right text-sm font-semibold text-pine">
                      {inr(a.price)}
                      <span className="block text-[11px] font-normal text-ink/50">/{a.per}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-pine">Lead guest</h3>
          <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <input className={inputCls} placeholder="Phone / WhatsApp (e.g. +91 98xxx xxxxx)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
          <input className={inputCls} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" type="email" />
          <textarea className={`${inputCls} min-h-20 resize-y`} placeholder="Anything we should know? Arrival time, dietary needs, travelling with a pet… (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={600} />
        </section>

        {settings.policies && <p className="text-xs leading-relaxed text-ink/55">{settings.policies}</p>}
      </div>

      <footer className="border-t border-cedar/15 bg-parchment-deep/80 px-6 py-4">
        <div className="mb-3 space-y-1 text-xs text-ink/70">
          {q.lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-4">
              <span className="truncate">{l.label}</span>
              <span>{inr(l.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/55">Total incl. GST</div>
            <motion.div key={q.total} initial={{ scale: 1.15, color: '#D96B27' }} animate={{ scale: 1, color: '#1C352D' }} className="origin-left font-display text-2xl font-semibold">
              {inr(q.total)}
            </motion.div>
          </div>
          <button className="btn-primary btn-pop inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60" onClick={confirm} disabled={submitting || soldOut}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {soldOut ? 'Fully booked' : settings.bookingMode === 'instant' ? 'Confirm booking' : 'Request booking'}
          </button>
        </div>
        {(error || (q.errors[0] && !error)) && <p className="mt-2 text-xs font-medium text-[#b23a1a]">{error || q.errors[0]}</p>}
        <p className="mt-2 text-[11px] text-ink/50">No payment is taken online. {settings.bookingMode === 'request' ? 'We confirm every request personally.' : ''}</p>
      </footer>
    </>
  )
}

function PseudoQR({ seed }: { seed: string }) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells: [number, number][] = []
  for (let y = 0; y < 21; y++)
    for (let x = 0; x < 21; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
      if (finder) continue
      h = (h * 1103515245 + 12345) >>> 0
      if ((h >>> 16) & 1) cells.push([x, y])
    }
  const finder = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#1C352D" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#1C352D" />
    </g>
  )
  return (
    <svg viewBox="-1 -1 23 23" className="h-24 w-24" aria-label="Booking pass pattern">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1C352D" />
      ))}
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
    </svg>
  )
}

function BookingPass({ pass, onBack }: { pass: Pass; onBack: () => void }) {
  const { settings, addons } = useConfig()
  const addonNames = addons.filter((a) => pass.addons.includes(a.id)).map((a) => a.name)
  const confirmed = pass.status === 'confirmed'
  const waText = encodeURIComponent(`Hello ${settings.resortName}! My booking reference is ${pass.ref} (${pass.stayName}, ${fmtDate(pass.checkIn)} – ${fmtDate(pass.checkOut)}).`)

  const downloadIcs = () => {
    const d = (s: string) => s.replace(/-/g, '')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Yamsar Resort//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${pass.ref}@yamsarresort`,
      `DTSTART;VALUE=DATE:${d(pass.checkIn)}`,
      `DTEND;VALUE=DATE:${d(pass.checkOut)}`,
      `SUMMARY:${confirmed ? '' : '(Requested) '}Stay at ${settings.resortName}: ${pass.stayName}`,
      `LOCATION:${settings.address.replace(/,/g, '\\,')}`,
      `DESCRIPTION:Booking ${pass.ref} for ${pass.name}. ${settings.phone}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `yamsar-${pass.ref}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-pine">
          <Ticket size={22} className="text-saffron" /> {confirmed ? 'Booking confirmed' : 'Request received'}
        </h2>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-pine btn-pop" onClick={() => actions.closeBooking()} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        <motion.div
          initial={{ y: 40, rotate: -4, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="overflow-hidden rounded-3xl bg-pine text-parchment shadow-2xl"
        >
          <div className="flex items-center gap-4 p-5">
            <Crest size={64} />
            <div>
              <div className={`text-[11px] uppercase tracking-[0.25em] ${confirmed ? 'text-saffron' : 'text-[#f3c79a]'}`}>{confirmed ? 'Confirmed' : 'Awaiting confirmation'}</div>
              <div className="font-display text-xl font-semibold">{pass.stayName}</div>
              <div className="text-xs text-parchment/70">{settings.resortName} · Kullan, Sonamarg</div>
            </div>
          </div>
          <div className="relative border-t-2 border-dashed border-parchment/25">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-parchment" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-parchment" />
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 text-sm">
            <Field k="Guest" v={pass.name} />
            <Field k="Reference" v={pass.ref} />
            <Field k="Check-in" v={`${fmtDate(pass.checkIn)} · ${settings.checkInTime}`} />
            <Field k="Check-out" v={`${fmtDate(pass.checkOut)} · ${settings.checkOutTime}`} />
            <Field k="Guests" v={`${pass.adults} adult${pass.adults > 1 ? 's' : ''}${pass.children ? `, ${pass.children} child${pass.children > 1 ? 'ren' : ''}` : ''}`} />
            <Field k="Nights" v={String(pass.nights)} />
            {addonNames.length > 0 && (
              <div className="col-span-2">
                <Field k="Experiences" v={addonNames.join(' · ')} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 bg-parchment p-5 text-ink">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink/55">Total incl. GST</div>
              <div className="font-display text-2xl font-semibold text-pine">{inr(pass.total)}</div>
              <div className="mt-1 text-xs text-ink/60">Pay at the resort · show this pass at check-in</div>
            </div>
            <PseudoQR seed={pass.ref} />
          </div>
        </motion.div>
        {!confirmed && settings.confirmationNote && <p className="mt-4 rounded-2xl bg-glacier/10 px-4 py-3 text-sm text-pine">{settings.confirmationNote}</p>}
        <details className="mt-4 rounded-2xl border border-cedar/15 bg-white/60 px-4 py-3 text-xs text-ink/70">
          <summary className="cursor-pointer text-sm font-semibold text-pine">Price breakdown</summary>
          <div className="mt-2 space-y-1">
            {pass.quote.lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-4">
                <span>{l.label}</span>
                <span>{inr(l.amount)}</span>
              </div>
            ))}
          </div>
        </details>
        <div className="mt-5 grid gap-3">
          <button className="btn-primary btn-pop inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold" onClick={downloadIcs}>
            <Download size={16} /> Add to calendar
          </button>
          {settings.whatsapp && (
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-glacier/40 bg-white/70 px-6 py-3 text-sm font-semibold text-glacier btn-pop"
              href={`https://wa.me/${settings.whatsapp}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Message the resort on WhatsApp
            </a>
          )}
          <button className="rounded-full px-6 py-2 text-sm font-semibold text-cedar/80 underline-offset-4 hover:underline" onClick={onBack}>
            Make another booking
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-parchment/55">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  )
}

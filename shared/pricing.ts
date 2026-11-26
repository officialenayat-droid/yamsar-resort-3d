import type { BookingInput, PublicConfig, Quote, QuoteLine, StayConfig } from './types.ts'

const DAY = 86400000

/** Parse YYYY-MM-DD as a UTC midnight timestamp (NaN if malformed). */
export function parseDay(s: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN
  const [y, m, d] = s.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d)
  const back = new Date(t)
  return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? t : NaN
}
export const fmtDay = (t: number) => new Date(t).toISOString().slice(0, 10)
export const addDaysISO = (s: string, n: number) => fmtDay(parseDay(s) + n * DAY)

/** Every night of a stay: [checkIn, checkOut) */
export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const a = parseDay(checkIn)
  const b = parseDay(checkOut)
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return []
  const out: string[] = []
  for (let t = a; t < b && out.length < 400; t += DAY) out.push(fmtDay(t))
  return out
}

/** Nightly rate: seasonal rate wins, then weekend (Fri/Sat night) rate, then base. */
export function rateForNight(stay: StayConfig, date: string): number {
  const season = stay.seasons.find((s) => s.from <= date && date <= s.to)
  if (season) return season.rate
  const dow = new Date(parseDay(date)).getUTCDay()
  if (stay.weekendRate && (dow === 5 || dow === 6)) return stay.weekendRate
  return stay.rate
}

export const roundRupee = (n: number) => Math.round(n)

/**
 * Price a stay. Used live in the browser AND authoritatively on the server,
 * so totals always match. `today` is YYYY-MM-DD in the resort's timezone.
 */
export function quote(input: Omit<BookingInput, 'name' | 'phone' | 'email' | 'notes'>, cfg: PublicConfig, today: string): Quote {
  const errors: string[] = []
  const s = cfg.settings
  const stay = cfg.stays.find((x) => x.id === input.cabin)
  const nightsList = nightsBetween(input.checkIn, input.checkOut)
  const nights = nightsList.length
  const empty: Quote = { nights, nightly: [], lines: [], subtotal: 0, tax: 0, total: 0, errors }

  if (!stay) {
    errors.push('Please choose a room.')
    return empty
  }
  if (!stay.active) errors.push(`${stay.name} is not open for booking right now.`)
  if (Number.isNaN(parseDay(input.checkIn)) || Number.isNaN(parseDay(input.checkOut))) errors.push('Please choose valid dates.')
  else if (nights < 1) errors.push('Check-out must be at least one night after check-in.')
  if (input.checkIn < today) errors.push('Check-in can’t be in the past.')
  if (nights > 0 && nights < s.minNights) errors.push(`The minimum stay is ${s.minNights} nights.`)
  if (nights > s.maxNights) errors.push(`For stays longer than ${s.maxNights} nights, please contact us directly.`)
  if (input.checkIn > addDaysISO(today, s.maxAdvanceDays)) errors.push(`We take bookings up to ${s.maxAdvanceDays} days ahead.`)
  if (input.adults < 1) errors.push('At least one adult is required.')
  const guests = input.adults + input.children
  const extraGuests = Math.max(0, guests - stay.sleeps)
  if (extraGuests > s.maxExtraGuests)
    errors.push(`${stay.name} sleeps ${stay.sleeps}${s.maxExtraGuests ? ` (+${s.maxExtraGuests} with extra bedding)` : ''}. Please choose a larger room or book two.`)

  const nightly = nightsList.map((date) => ({ date, rate: rateForNight(stay, date) }))
  const lines: QuoteLine[] = []
  const roomTotal = nightly.reduce((a, n) => a + n.rate, 0)
  const uniform = nightly.every((n) => n.rate === nightly[0]?.rate)
  lines.push({
    kind: 'room',
    label: uniform && nights ? `${stay.name} · ${nights} night${nights === 1 ? '' : 's'} × ₹${nightly[0].rate.toLocaleString('en-IN')}` : `${stay.name} · ${nights} night${nights === 1 ? '' : 's'}`,
    amount: roomTotal,
  })
  const extraTotal = extraGuests * s.extraGuestFee * nights
  if (extraGuests && s.extraGuestFee) lines.push({ kind: 'extra', label: `Extra bedding · ${extraGuests} guest${extraGuests > 1 ? 's' : ''} × ${nights} night${nights === 1 ? '' : 's'}`, amount: extraTotal })

  let addonTotal = 0
  for (const id of input.addons) {
    const a = cfg.addons.find((x) => x.id === id)
    if (!a || !a.active) {
      errors.push('One of the selected experiences is no longer available.')
      continue
    }
    const qty = a.per === 'adult' ? input.adults : a.per === 'guest' ? guests : a.per === 'night' ? nights : 1
    const amount = a.price * qty
    addonTotal += amount
    lines.push({ kind: 'addon', label: `${a.name}${qty > 1 ? ` × ${qty}` : ''}`, amount })
  }

  // GST: room slab decided per night by that night's tariff (incl. extra bedding)
  const g = s.gst
  const perNightExtra = extraGuests * s.extraGuestFee
  const roomTax: Record<string, number> = {}
  for (const n of nightly) {
    const tariff = n.rate + perNightExtra
    const pct = tariff <= g.roomThreshold ? g.roomLowRate : g.roomHighRate
    roomTax[pct] = (roomTax[pct] ?? 0) + (tariff * pct) / 100
  }
  let tax = 0
  for (const [pct, amt] of Object.entries(roomTax)) {
    if (Number(pct) === 0) continue
    const v = roundRupee(amt)
    tax += v
    lines.push({ kind: 'tax', label: `GST on room (${pct}%)`, amount: v })
  }
  if (addonTotal && g.addonRate) {
    const v = roundRupee((addonTotal * g.addonRate) / 100)
    tax += v
    lines.push({ kind: 'tax', label: `GST on experiences (${g.addonRate}%)`, amount: v })
  }

  const subtotal = roomTotal + extraTotal + addonTotal
  return { nights, nightly, lines, subtotal, tax, total: subtotal + tax, errors }
}

/** Today's date in India (the resort's timezone) as YYYY-MM-DD. */
export function todayIST(now = Date.now()): string {
  return fmtDay(now + 5.5 * 3600000)
}

export const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

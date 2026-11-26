/**
 * Email notifications over SMTP (nodemailer).
 * SMTP credentials live ONLY in environment variables (.env), never in the database.
 * Sending is fire-and-forget: a mail failure never blocks or fails a booking.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import process from 'node:process'
import { inr, parseDay } from '../shared/pricing.ts'
import type { Booking, PublicConfig } from '../shared/types.ts'

interface MailStatus {
  configured: boolean
  host: string
  from: string
  lastSentAt: string | null
  lastError: string | null
}

const env = () => ({
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: (process.env.SMTP_SECURE ?? (Number(process.env.SMTP_PORT ?? 465) === 465 ? 'true' : 'false')) === 'true',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  siteUrl: (process.env.SITE_URL ?? '').replace(/\/+$/, ''),
})

let transporter: Transporter | null = null
const status: MailStatus = { configured: false, host: '', from: '', lastSentAt: null, lastError: null }

function getTransporter(): Transporter | null {
  const e = env()
  status.configured = Boolean(e.host && e.from)
  status.host = e.host
  status.from = e.from
  if (!status.configured) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: e.host,
      port: e.port,
      secure: e.secure,
      auth: e.user ? { user: e.user, pass: e.pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    })
  }
  return transporter
}

export function mailStatus(): MailStatus {
  getTransporter()
  return { ...status }
}

export const parseRecipients = (list: string) =>
  list
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))

async function send(to: string[], subject: string, html: string, text: string, replyTo?: string) {
  const t = getTransporter()
  if (!t || to.length === 0) return false
  try {
    await t.sendMail({ from: env().from, to, subject, html, text, replyTo })
    status.lastSentAt = new Date().toISOString()
    status.lastError = null
    return true
  } catch (err) {
    status.lastError = `${new Date().toISOString()}: ${(err as Error).message}`
    console.error('[mail] failed:', (err as Error).message)
    throw err
  }
}

/** Run without awaiting; errors are logged and surfaced in the admin status. */
const background = (p: Promise<unknown>) => {
  const safe = p.catch(() => {})
  // on serverless/edge runtimes, keep the worker alive until the email is sent
  const rt = (globalThis as unknown as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime
  rt?.waitUntil(safe)
}

// ───────────────────────── templates ─────────────────────────
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const fmtDate = (s: string) => new Date(parseDay(s)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const guestsText = (b: Booking) => `${b.adults} adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}`
const waLink = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? '91' + d : d}`
}

function layout(cfg: PublicConfig, heading: string, intro: string, body: string) {
  const s = cfg.settings
  return `<!doctype html><html><body style="margin:0;background:#F4EFE6;font-family:Helvetica,Arial,sans-serif;color:#2B241F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF7EF;border:1px solid #e3d8c6;border-radius:16px;overflow:hidden">
<tr><td style="background:#1C352D;padding:22px 28px;color:#F4EFE6">
<div style="font-family:Georgia,serif;font-size:20px;font-weight:bold">${esc(s.resortName)}</div>
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f3c79a;margin-top:4px">Kullan · Sonamarg</div>
</td></tr>
<tr><td style="padding:26px 28px">
<h1 style="font-family:Georgia,serif;font-size:22px;color:#1C352D;margin:0 0 8px">${heading}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#4a403a">${intro}</p>
${body}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3d8c6;font-size:12px;color:#7a6e66;line-height:1.6">
${esc(s.resortName)} · ${esc(s.address)}<br>${esc(s.phone)}${s.email ? ` · ${esc(s.email)}` : ''}
</td></tr></table></td></tr></table></body></html>`
}

function detailsTable(b: Booking, cfg: PublicConfig) {
  const addonNames = b.addons.map((id) => cfg.addons.find((a) => a.id === id)?.name ?? id)
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#7a6e66;font-size:13px;width:38%;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;font-weight:bold">${v}</td></tr>`
  const lines = b.quote.lines
    .map((l) => `<tr><td style="padding:3px 0;font-size:13px;color:#4a403a">${esc(l.label)}</td><td align="right" style="padding:3px 0;font-size:13px">${inr(l.amount)}</td></tr>`)
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
${row('Reference', esc(b.ref))}
${row('Room', esc(b.stayName))}
${row('Check-in', `${fmtDate(b.checkIn)} · from ${esc(cfg.settings.checkInTime)}`)}
${row('Check-out', `${fmtDate(b.checkOut)} · by ${esc(cfg.settings.checkOutTime)}`)}
${row('Nights', String(b.nights))}
${row('Guests', guestsText(b))}
${addonNames.length ? row('Experiences', esc(addonNames.join(', '))) : ''}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;border-radius:10px;padding:12px 14px">
${lines}
<tr><td style="padding-top:8px;border-top:1px solid #e3d8c6;font-weight:bold">Total incl. GST</td><td align="right" style="padding-top:8px;border-top:1px solid #e3d8c6;font-weight:bold;font-size:16px;color:#1C352D">${inr(b.total)}</td></tr>
</table>`
}

function detailsText(b: Booking, cfg: PublicConfig) {
  const addonNames = b.addons.map((id) => cfg.addons.find((a) => a.id === id)?.name ?? id)
  return [
    `Reference: ${b.ref}`,
    `Room: ${b.stayName}`,
    `Check-in: ${fmtDate(b.checkIn)} (from ${cfg.settings.checkInTime})`,
    `Check-out: ${fmtDate(b.checkOut)} (by ${cfg.settings.checkOutTime})`,
    `Nights: ${b.nights}`,
    `Guests: ${guestsText(b)}`,
    addonNames.length ? `Experiences: ${addonNames.join(', ')}` : '',
    '',
    ...b.quote.lines.map((l) => `${l.label}: ${inr(l.amount)}`),
    `Total incl. GST: ${inr(b.total)}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

const button = (href: string, label: string, bg = '#D96B27') =>
  `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:999px;margin:4px 6px 4px 0">${esc(label)}</a>`

// ───────────────────────── public API ─────────────────────────
/** New booking: alert the resort, and send the guest a receipt. */
export function notifyNewBooking(b: Booking, cfg: PublicConfig) {
  const s = cfg.settings
  const staff = parseRecipients(s.notifyEmails)
  const pending = b.status === 'pending'

  if (staff.length) {
    const site = env().siteUrl
    const actions = [site ? button(`${site}/admin#bookings`, pending ? 'Review & confirm' : 'Open admin', '#1C352D') : '', button(waLink(b.phone), 'WhatsApp guest', '#2B7A78')].join('')
    const guestBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e3d8c6;border-radius:10px;padding:12px 14px">
<tr><td style="font-size:14px;line-height:1.6"><b>${esc(b.name)}</b><br>📞 <a href="tel:${esc(b.phone.replace(/\s/g, ''))}" style="color:#2B7A78">${esc(b.phone)}</a>${b.email ? `<br>✉️ <a href="mailto:${esc(b.email)}" style="color:#2B7A78">${esc(b.email)}</a>` : ''}${b.notes ? `<br><i style="color:#6E473B">“${esc(b.notes)}”</i>` : ''}</td></tr></table>`
    background(
      send(
        staff,
        `${pending ? '🔔 New booking request' : '✅ New booking'}: ${b.name}, ${b.stayName}, ${fmtDate(b.checkIn)} (${b.ref})`,
        layout(cfg, pending ? 'New booking request' : 'New confirmed booking', pending ? 'A guest has requested a stay. Please confirm it from the admin dashboard and let them know.' : 'A guest has booked a stay through the website.', guestBlock + detailsTable(b, cfg) + `<div style="margin-top:18px">${actions}</div>`),
        `${pending ? 'New booking request' : 'New confirmed booking'}\n\nGuest: ${b.name}\nPhone: ${b.phone}\n${b.email ? `Email: ${b.email}\n` : ''}${b.notes ? `Notes: ${b.notes}\n` : ''}\n${detailsText(b, cfg)}\n${site ? `\nAdmin: ${site}/admin#bookings` : ''}`,
        b.email || undefined,
      ),
    )
  }

  if (s.emailGuests && b.email) {
    const heading = pending ? 'We’ve received your booking request' : 'Your stay is confirmed'
    const intro = pending
      ? `Thank you, ${esc(b.name)}! ${esc(s.confirmationNote)}`
      : `Thank you, ${esc(b.name)}! We look forward to welcoming you to Kullan. Please show your reference at check-in.`
    background(
      send(
        [b.email],
        `${pending ? 'Booking request received' : 'Booking confirmed'}: ${s.resortName} (${b.ref})`,
        layout(cfg, heading, intro, detailsTable(b, cfg) + guestFooter(cfg)),
        `${heading}\n\n${pending ? s.confirmationNote : 'We look forward to welcoming you.'}\n\n${detailsText(b, cfg)}\n\nPayment is made at the resort.\n${s.policies}`,
        s.email || undefined,
      ),
    )
  }
}

function guestFooter(cfg: PublicConfig) {
  const s = cfg.settings
  return `<p style="font-size:13px;color:#4a403a;line-height:1.6;margin:18px 0 0">Payment is made at the resort. ${esc(s.policies)}</p>
<div style="margin-top:16px">${s.whatsapp ? button(`https://wa.me/${s.whatsapp}`, 'WhatsApp the resort', '#2B7A78') : ''}${s.phone ? button(`tel:${s.phone.replace(/\s/g, '')}`, `Call ${s.phone}`, '#1C352D') : ''}</div>`
}

/** Booking confirmed or cancelled from the admin: tell the guest. */
export function notifyStatusChange(b: Booking, cfg: PublicConfig) {
  const s = cfg.settings
  if (!s.emailGuests || !b.email) return
  if (b.status === 'confirmed') {
    background(
      send(
        [b.email],
        `Booking confirmed: ${s.resortName} (${b.ref})`,
        layout(cfg, 'Your stay is confirmed 🎉', `Good news, ${esc(b.name)}! Your booking is confirmed. We look forward to welcoming you to Kullan.`, detailsTable(b, cfg) + guestFooter(cfg)),
        `Your stay is confirmed\n\n${detailsText(b, cfg)}\n\nPayment is made at the resort.\n${s.policies}`,
        s.email || undefined,
      ),
    )
  } else if (b.status === 'cancelled') {
    background(
      send(
        [b.email],
        `Booking cancelled: ${s.resortName} (${b.ref})`,
        layout(cfg, 'Your booking has been cancelled', `Hello ${esc(b.name)}, your booking ${esc(b.ref)} for the ${esc(b.stayName)} (${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}) has been cancelled. If this is unexpected, please get in touch and we’ll help.`, guestFooter(cfg)),
        `Your booking ${b.ref} (${b.stayName}, ${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}) has been cancelled. If this is unexpected, please contact us: ${s.phone} ${s.email}`,
        s.email || undefined,
      ),
    )
  }
}

/** Admin "send test email" button. Awaited, so the admin sees success or the SMTP error. */
export async function sendTestEmail(to: string[], cfg: PublicConfig) {
  if (!getTransporter()) throw new Error('Email isn’t set up on the server yet. Add the SMTP_* settings to .env and restart.')
  if (!to.length) throw new Error('Add at least one notification email first.')
  await send(
    to,
    `Test email from ${cfg.settings.resortName}`,
    layout(cfg, 'Email notifications are working ✓', 'This is a test from your booking dashboard. New booking alerts will arrive at this address.', ''),
    'Email notifications are working. New booking alerts will arrive at this address.',
  )
}

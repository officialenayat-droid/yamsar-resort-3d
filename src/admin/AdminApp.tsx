import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BedDouble,
  CalendarX2,
  Check,
  ClipboardList,
  Download,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Crest } from '../svg/Illustrations'
import { Mail, Send } from 'lucide-react'
import { addDaysISO, inr, nightsBetween, parseDay, rateForNight, todayIST } from '../../shared/pricing.ts'
import type { AddonConfig, Availability, Block, Booking, BookingStatus, CabinId, PublicConfig, Settings, StayConfig } from '../../shared/types.ts'

// ───────────────────────── API client ─────────────────────────
const TOKEN_KEY = 'yamsar-admin-token'
const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const writeToken = (t: string | null) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode — token lives in memory only */
  }
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function useApi(token: string | null, onExpired: () => void) {
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const res = await fetch(`/api/admin${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
      })
      if (res.status === 401) {
        onExpired()
        throw new ApiError('Session expired. Please sign in again.', 401)
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status)
      return data as T
    },
    [token, onExpired],
  )
}
type Api = ReturnType<typeof useApi>

// ───────────────────────── small UI kit ─────────────────────────
const input = 'w-full rounded-xl border border-cedar/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-glacier focus:ring-2 focus:ring-glacier/15'
const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50'
const btnPrimary = `${btn} bg-pine text-parchment hover:bg-pine-soft`
const btnGhost = `${btn} border border-cedar/25 bg-white text-pine hover:bg-parchment-deep`

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-ink/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink/50">{hint}</span>}
    </label>
  )
}

function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-cedar/15 bg-white/85 p-5 shadow-[0_10px_30px_-20px_rgba(43,36,31,0.4)] sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-semibold text-pine">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm text-ink">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-glacier' : 'bg-ink/20'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

const num = (v: string) => (v === '' ? 0 : Math.max(0, Math.round(Number(v)) || 0))

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-saffron/15 text-[#a8501b]',
  confirmed: 'bg-glacier/15 text-glacier',
  checked_in: 'bg-pine/15 text-pine',
  completed: 'bg-ink/10 text-ink/70',
  cancelled: 'bg-[#b23a1a]/10 text-[#b23a1a] line-through',
}
const STATUS_LABEL: Record<BookingStatus, string> = { pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked in', completed: 'Completed', cancelled: 'Cancelled' }
const fmt = (s: string) => new Date(parseDay(s)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

// ───────────────────────── app shell ─────────────────────────
type Tab = 'overview' | 'bookings' | 'rooms' | 'experiences' | 'blocks' | 'settings'
const TABS: { id: Tab; label: string; icon: typeof BedDouble }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: ClipboardList },
  { id: 'rooms', label: 'Rooms & rates', icon: BedDouble },
  { id: 'experiences', label: 'Experiences', icon: Sparkles },
  { id: 'blocks', label: 'Blocked dates', icon: CalendarX2 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(readToken)
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || 'overview')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [config, setConfig] = useState<PublicConfig | null>(null)

  useEffect(() => {
    document.title = 'Admin · The Yamsar Resort'
  }, [])
  useEffect(() => {
    history.replaceState(null, '', `#${tab}`)
  }, [tab])

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
    setConfig(null)
  }, [])
  const api = useApi(token, logout)
  const notify = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    if (!token) return
    api<PublicConfig>('/config')
      .then(setConfig)
      .catch((e: Error) => notify(e.message, false))
  }, [token, api, notify])

  if (!token)
    return (
      <Login
        onLogin={(t) => {
          writeToken(t)
          setToken(t)
        }}
      />
    )

  return (
    <div className="paper min-h-screen">
      <header className="sticky top-0 z-30 border-b border-cedar/15 bg-parchment/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Crest size={40} />
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold text-pine">{config?.settings.resortName ?? 'The Yamsar Resort'}</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-cedar">Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className={btnGhost}>
              <ExternalLink size={15} /> <span className="hidden sm:inline">View site</span>
            </a>
            <button className={btnGhost} onClick={logout}>
              <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-pine text-parchment' : 'text-pine hover:bg-pine/10'}`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {!config ? (
          <div className="grid place-items-center py-24 text-cedar">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'overview' && <Overview api={api} config={config} goBookings={() => setTab('bookings')} notify={notify} />}
            {tab === 'bookings' && <Bookings api={api} config={config} notify={notify} />}
            {tab === 'rooms' && <Rooms api={api} config={config} onSaved={setConfig} notify={notify} />}
            {tab === 'experiences' && <Experiences api={api} config={config} onSaved={setConfig} notify={notify} />}
            {tab === 'blocks' && <Blocks api={api} config={config} notify={notify} />}
            {tab === 'settings' && <SettingsPanel api={api} config={config} onSaved={setConfig} notify={notify} onToken={(t) => (writeToken(t), setToken(t))} />}
          </>
        )}
      </main>

      {toast && (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4" role="status">
          <div className={`rounded-full px-5 py-3 text-sm font-semibold shadow-xl ${toast.ok ? 'bg-pine text-parchment' : 'bg-[#b23a1a] text-white'}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Sign-in failed')
      onLogin(data.token)
    } catch (err) {
      setError(err instanceof TypeError ? 'Can’t reach the booking server. Is it running?' : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="paper paper-vignette grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="storycard w-full max-w-sm rounded-3xl p-8 text-center">
        <Crest size={110} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-pine">Resort admin</h1>
        <p className="mt-1 text-sm text-ink/60">Bookings, rooms, rates and settings</p>
        <input type="password" className={`${input} mt-6 text-center`} placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
        {error && <p className="mt-2 text-sm text-[#b23a1a]">{error}</p>}
        <button className={`${btnPrimary} mt-4 w-full py-3`} disabled={busy || !password}>
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </button>
      </form>
    </div>
  )
}

// ───────────────────────── overview ─────────────────────────
interface Summary {
  today: string
  pending: number
  arrivalsToday: number
  inHouse: number
  upcoming: number
  revenueThisMonth: number
  tonight: Availability
}

function Overview({ api, config, goBookings, notify }: { api: Api; config: PublicConfig; goBookings: () => void; notify: (m: string, ok?: boolean) => void }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [pending, setPending] = useState<Booking[]>([])
  const load = useCallback(() => {
    api<Summary>('/summary').then(setSummary).catch(() => {})
    api<Booking[]>('/bookings?status=pending').then(setPending).catch(() => {})
  }, [api])
  useEffect(load, [load])

  const stats = summary
    ? [
        { k: 'Awaiting confirmation', v: summary.pending, accent: summary.pending > 0 },
        { k: 'Arriving today', v: summary.arrivalsToday },
        { k: 'Guests in house', v: summary.inHouse },
        { k: 'Upcoming stays', v: summary.upcoming },
        { k: 'Booked this month', v: inr(summary.revenueThisMonth) },
      ]
    : []

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className={`rounded-2xl border p-4 ${s.accent ? 'border-saffron/40 bg-saffron/10' : 'border-cedar/15 bg-white/85'}`}>
            <div className="font-display text-2xl font-semibold text-pine">{s.v}</div>
            <div className="text-xs text-ink/60">{s.k}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <Card title="Needs your attention" actions={<button className={btnGhost} onClick={goBookings}>All bookings</button>}>
          {pending.length === 0 ? (
            <p className="text-sm text-ink/60">No pending requests. 🎉</p>
          ) : (
            <div className="space-y-3">
              {pending.map((b) => (
                <BookingRow key={b.ref} b={b} api={api} config={config} notify={notify} onChange={load} />
              ))}
            </div>
          )}
        </Card>
        <Card title="Rooms free tonight">
          <ul className="space-y-3">
            {config.stays.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-semibold text-pine">
                  {summary ? summary.tonight[s.id] : '–'} / {s.units}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink/50">Booking mode: {config.settings.bookingMode === 'instant' ? 'instant confirmation' : 'requests you confirm here'}.</p>
        </Card>
      </div>
    </>
  )
}

// ───────────────────────── bookings ─────────────────────────
function guestWhatsApp(b: Booking, s: Settings) {
  const digits = b.phone.replace(/[^\d]/g, '')
  const to = digits.length === 10 ? `91${digits}` : digits
  const msg =
    b.status === 'cancelled'
      ? `Hello ${b.name}, this is ${s.resortName}. Your booking ${b.ref} has been cancelled. Please reply if you have any questions.`
      : `Hello ${b.name}! This is ${s.resortName}. Your stay in our ${b.stayName} from ${fmt(b.checkIn)} to ${fmt(b.checkOut)} (ref ${b.ref}) is confirmed. Total ${inr(b.total)} incl. GST. Check-in is from ${s.checkInTime}. We look forward to welcoming you to Kullan!`
  return `https://wa.me/${to}?text=${encodeURIComponent(msg)}`
}

function BookingRow({ b, api, config, notify, onChange }: { b: Booking; api: Api; config: PublicConfig; notify: (m: string, ok?: boolean) => void; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(b.adminNotes)
  const [busy, setBusy] = useState(false)
  const addonNames = b.addons.map((id) => config.addons.find((a) => a.id === id)?.name ?? id)

  const patch = async (body: { status?: BookingStatus; adminNotes?: string }, msg: string) => {
    setBusy(true)
    try {
      await api(`/bookings/${b.ref}`, { method: 'PATCH', body: JSON.stringify(body) })
      notify(msg)
      onChange()
    } catch (e) {
      notify((e as Error).message, false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-cedar/15 bg-white">
      <button className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
        <span className="font-semibold text-ink">{b.name}</span>
        <span className="text-sm text-ink/60">{b.stayName}</span>
        <span className="text-sm text-ink/60">
          {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights}n · {b.adults + b.children} guests
        </span>
        <span className="ml-auto font-display font-semibold text-pine">{inr(b.total)}</span>
      </button>
      {open && (
        <div className="grid gap-5 border-t border-cedar/10 px-4 py-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="font-mono text-xs text-ink/50">
              {b.ref} · booked {new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <div className="flex flex-wrap gap-2">
              <a className={btnGhost} href={`tel:${b.phone.replace(/\s/g, '')}`}>
                <Phone size={14} /> {b.phone}
              </a>
              <a className={`${btnGhost} text-glacier`} href={guestWhatsApp(b, config.settings)} target="_blank" rel="noreferrer">
                <MessageCircle size={14} /> WhatsApp guest
              </a>
            </div>
            {b.email && <div>✉️ {b.email}</div>}
            <div>
              {b.adults} adult{b.adults > 1 ? 's' : ''}
              {b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}
            </div>
            {addonNames.length > 0 && <div>Experiences: {addonNames.join(', ')}</div>}
            {b.notes && <div className="rounded-xl bg-parchment-deep/60 p-3 italic">“{b.notes}”</div>}
            <div className="space-y-0.5 rounded-xl bg-parchment/70 p-3 text-xs text-ink/70">
              {b.quote.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3">
                  <span>{l.label}</span>
                  <span>{inr(l.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-cedar/15 pt-1 font-semibold text-ink">
                <span>Total</span>
                <span>{inr(b.total)}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {b.status === 'pending' && (
                <button className={btnPrimary} disabled={busy} onClick={() => patch({ status: 'confirmed' }, `Confirmed ${b.ref}. Send the guest a WhatsApp!`)}>
                  <Check size={15} /> Confirm
                </button>
              )}
              {b.status === 'confirmed' && (
                <button className={btnPrimary} disabled={busy} onClick={() => patch({ status: 'checked_in' }, 'Checked in')}>
                  Check in
                </button>
              )}
              {b.status === 'checked_in' && (
                <button className={btnPrimary} disabled={busy} onClick={() => patch({ status: 'completed' }, 'Marked as completed')}>
                  Check out
                </button>
              )}
              {b.status === 'cancelled' ? (
                <button className={btnGhost} disabled={busy} onClick={() => patch({ status: 'pending' }, 'Booking restored as pending')}>
                  Restore
                </button>
              ) : (
                b.status !== 'completed' && (
                  <button
                    className={`${btnGhost} text-[#b23a1a]`}
                    disabled={busy}
                    onClick={() => window.confirm(`Cancel booking ${b.ref} for ${b.name}?`) && patch({ status: 'cancelled' }, 'Booking cancelled. The room is free again.')}
                  >
                    <X size={15} /> Cancel booking
                  </button>
                )
              )}
            </div>
            <Field label="Private notes (only staff see these)">
              <textarea className={`${input} min-h-24`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Advance received, arrival time, special requests…" />
            </Field>
            <button className={btnGhost} disabled={busy || notes === b.adminNotes} onClick={() => patch({ adminNotes: notes }, 'Notes saved')}>
              <Save size={14} /> Save notes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bookings({ api, config, notify }: { api: Api; config: PublicConfig; notify: (m: string, ok?: boolean) => void }) {
  const [status, setStatus] = useState('')
  const [when, setWhen] = useState<'upcoming' | 'all' | 'past'>('upcoming')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Booking[] | null>(null)
  const today = todayIST()

  const load = useCallback(() => {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (q.trim()) p.set('q', q.trim())
    if (when === 'upcoming') p.set('from', today)
    if (when === 'past') p.set('to', today)
    api<Booking[]>(`/bookings?${p}`)
      .then((r) => setRows(when === 'past' ? r.reverse() : r))
      .catch((e: Error) => notify(e.message, false))
  }, [api, status, q, when, today, notify])
  useEffect(() => {
    const t = window.setTimeout(load, 200)
    return () => window.clearTimeout(t)
  }, [load])

  const exportCsv = async () => {
    try {
      const res = await fetch('/api/admin/bookings.csv', { headers: { authorization: `Bearer ${readToken() ?? ''}` } })
      if (!res.ok) throw new Error('Export failed')
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = `yamsar-bookings-${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      notify((e as Error).message, false)
    }
  }

  return (
    <Card
      title="Bookings"
      actions={
        <button className={btnGhost} onClick={exportCsv}>
          <Download size={15} /> Export CSV
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className={`${input} pl-9`} placeholder="Search name, phone, email or reference" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${input} w-auto`} value={when} onChange={(e) => setWhen(e.target.value as typeof when)} aria-label="Date range">
          <option value="upcoming">Current & upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
        <select className={`${input} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {!rows ? (
        <Loader2 className="mx-auto animate-spin text-cedar" />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/60">No bookings match.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((b) => (
            <BookingRow key={b.ref + b.updatedAt} b={b} api={api} config={config} notify={notify} onChange={load} />
          ))}
        </div>
      )}
    </Card>
  )
}

// ───────────────────────── rooms & rates ─────────────────────────
function Rooms({ api, config, onSaved, notify }: { api: Api; config: PublicConfig; onSaved: (c: PublicConfig) => void; notify: (m: string, ok?: boolean) => void }) {
  const [stays, setStays] = useState<StayConfig[]>(() => structuredClone(config.stays))
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(stays) !== JSON.stringify(config.stays)
  const set = (id: CabinId, patch: Partial<StayConfig>) => setStays((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const save = async () => {
    setBusy(true)
    try {
      const clean = stays.map((x) => ({ ...x, features: x.features.map((f) => f.trim()).filter(Boolean) }))
      const c = await api<PublicConfig>('/stays', { method: 'PUT', body: JSON.stringify(clean) })
      onSaved(c)
      setStays(structuredClone(c.stays))
      notify('Rooms & rates saved. The website shows them right away.')
    } catch (e) {
      notify((e as Error).message, false)
    } finally {
      setBusy(false)
    }
  }

  const SLOT: Record<CabinId, string> = { aframe: 'A-frame cabin in the 3D valley', riverfront: 'Heritage house in the 3D valley', glacier: 'Tall timber house in the 3D valley' }

  return (
    <>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setStays(structuredClone(config.stays))} />
      {stays.map((s) => (
        <Card
          key={s.id}
          title={s.name || 'Untitled room'}
          actions={<Toggle checked={s.active} onChange={(v) => set(s.id, { active: v })} label={s.active ? 'Open for booking' : 'Hidden from booking'} />}
        >
          <p className="-mt-2 mb-4 text-xs text-ink/50">{SLOT[s.id]}</p>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Room name" className="md:col-span-2">
              <input className={input} value={s.name} onChange={(e) => set(s.id, { name: e.target.value })} />
            </Field>
            <Field label="Short label" hint="Shown on the 3D map pin">
              <input className={input} value={s.short} onChange={(e) => set(s.id, { short: e.target.value })} />
            </Field>
            <Field label="Rooms of this type" hint="How many can be booked per night">
              <input className={input} type="number" min={0} value={s.units} onChange={(e) => set(s.id, { units: num(e.target.value) })} />
            </Field>
            <Field label="Description" className="md:col-span-4">
              <input className={input} value={s.tagline} onChange={(e) => set(s.id, { tagline: e.target.value })} />
            </Field>
            <Field label="Nightly rate (₹)">
              <input className={input} type="number" min={0} step={100} value={s.rate} onChange={(e) => set(s.id, { rate: num(e.target.value) })} />
            </Field>
            <Field label="Fri & Sat rate (₹)" hint="Leave empty to use the nightly rate">
              <input className={input} type="number" min={0} step={100} value={s.weekendRate ?? ''} onChange={(e) => set(s.id, { weekendRate: e.target.value === '' ? null : num(e.target.value) })} />
            </Field>
            <Field label="Sleeps">
              <input className={input} type="number" min={1} value={s.sleeps} onChange={(e) => set(s.id, { sleeps: Math.max(1, num(e.target.value)) })} />
            </Field>
            <Field label="Size">
              <input className={input} value={s.size} onChange={(e) => set(s.id, { size: e.target.value })} />
            </Field>
            <Field label="View">
              <input className={input} value={s.view} onChange={(e) => set(s.id, { view: e.target.value })} />
            </Field>
            <Field label="Features (one per line)" className="md:col-span-3">
              <textarea
                className={`${input} min-h-28`}
                value={s.features.join('\n')}
                onChange={(e) => set(s.id, { features: e.target.value.split('\n').map((x) => x.trimStart()).filter((x, i, arr) => x || i === arr.length - 1) })}
              />
            </Field>
          </div>
          <Seasons stay={s} onChange={(seasons) => set(s.id, { seasons })} />
        </Card>
      ))}
    </>
  )
}

function Seasons({ stay, onChange }: { stay: StayConfig; onChange: (s: StayConfig['seasons']) => void }) {
  const today = todayIST()
  const preview = useMemo(() => nightsBetween(today, addDaysISO(today, 14)).map((d) => ({ d, r: rateForNight(stay, d) })), [stay, today])
  return (
    <div className="mt-6 rounded-2xl bg-parchment/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-pine">Seasonal rates</h3>
          <p className="text-[11px] text-ink/50">Override the nightly rate between two dates (both nights included). Seasons beat weekend rates.</p>
        </div>
        <button
          className={btnGhost}
          onClick={() => onChange([...stay.seasons, { id: crypto.randomUUID().slice(0, 8), name: 'Peak season', from: today, to: addDaysISO(today, 30), rate: stay.rate }])}
        >
          <Plus size={14} /> Add season
        </button>
      </div>
      {stay.seasons.length === 0 && <p className="text-xs text-ink/50">No seasonal rates.</p>}
      <div className="space-y-2">
        {stay.seasons.map((x, i) => {
          const upd = (p: Partial<typeof x>) => onChange(stay.seasons.map((y, j) => (j === i ? { ...y, ...p } : y)))
          return (
            <div key={x.id} className="grid items-end gap-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
              <Field label="Name">
                <input className={input} value={x.name} onChange={(e) => upd({ name: e.target.value })} />
              </Field>
              <Field label="From night">
                <input className={input} type="date" value={x.from} onChange={(e) => upd({ from: e.target.value })} />
              </Field>
              <Field label="To night">
                <input className={input} type="date" value={x.to} min={x.from} onChange={(e) => upd({ to: e.target.value })} />
              </Field>
              <Field label="Rate (₹)">
                <input className={input} type="number" min={0} step={100} value={x.rate} onChange={(e) => upd({ rate: num(e.target.value) })} />
              </Field>
              <button className={`${btnGhost} text-[#b23a1a]`} onClick={() => onChange(stay.seasons.filter((_, j) => j !== i))} aria-label="Remove season">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="mt-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink/50">Next 14 nights</div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {preview.map(({ d, r }) => {
            const dt = new Date(parseDay(d))
            return (
              <div key={d} className={`min-w-14 rounded-lg px-2 py-1.5 text-center text-[11px] ${r !== stay.rate ? 'bg-saffron/15 text-[#a8501b]' : 'bg-white text-ink/70'}`}>
                <div>{dt.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })}</div>
                <div className="font-semibold">{dt.getUTCDate()}</div>
                <div>₹{(r / 1000).toFixed(r % 1000 ? 1 : 0)}k</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SaveBar({ dirty, busy, onSave, onReset }: { dirty: boolean; busy: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div className={`sticky top-[108px] z-20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition ${dirty ? 'bg-saffron/15 shadow-lg backdrop-blur' : 'bg-transparent'}`}>
      <span className="text-sm text-ink/70">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
      <div className="flex gap-2">
        {dirty && (
          <button className={btnGhost} onClick={onReset} disabled={busy}>
            Discard
          </button>
        )}
        <button className={btnPrimary} onClick={onSave} disabled={!dirty || busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
        </button>
      </div>
    </div>
  )
}

// ───────────────────────── experiences ─────────────────────────
function Experiences({ api, config, onSaved, notify }: { api: Api; config: PublicConfig; onSaved: (c: PublicConfig) => void; notify: (m: string, ok?: boolean) => void }) {
  const [list, setList] = useState<AddonConfig[]>(() => structuredClone(config.addons))
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(list) !== JSON.stringify(config.addons)
  const upd = (i: number, p: Partial<AddonConfig>) => setList((l) => l.map((a, j) => (j === i ? { ...a, ...p } : a)))
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'experience'

  const save = async () => {
    setBusy(true)
    try {
      const c = await api<PublicConfig>('/addons', { method: 'PUT', body: JSON.stringify(list) })
      onSaved(c)
      setList(structuredClone(c.addons))
      notify('Experiences saved')
    } catch (e) {
      notify((e as Error).message, false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setList(structuredClone(config.addons))} />
      <Card
        title="Experiences & add-ons"
        actions={
          <button
            className={btnGhost}
            onClick={() => {
              let id = 'new-experience'
              let n = 2
              while (list.some((a) => a.id === id)) id = `new-experience-${n++}`
              setList((l) => [...l, { id, name: 'New experience', note: '', price: 1000, per: 'guest', active: true }])
            }}
          >
            <Plus size={14} /> Add experience
          </button>
        }
      >
        <p className="-mt-2 mb-4 text-xs text-ink/50">Guests can add these when booking. Prices are before GST.</p>
        <div className="space-y-4">
          {list.map((a, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-cedar/15 bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
              <Field label="Name">
                <input
                  className={input}
                  value={a.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const isNew = !config.addons.some((x) => x.id === a.id)
                    upd(i, isNew ? { name, id: slug(name) } : { name })
                  }}
                />
              </Field>
              <Field label="Price (₹)">
                <input className={input} type="number" min={0} step={100} value={a.price} onChange={(e) => upd(i, { price: num(e.target.value) })} />
              </Field>
              <Field label="Charged per">
                <select className={input} value={a.per} onChange={(e) => upd(i, { per: e.target.value as AddonConfig['per'] })}>
                  <option value="adult">Adult</option>
                  <option value="guest">Guest (adults + children)</option>
                  <option value="night">Night</option>
                  <option value="stay">Stay (once)</option>
                </select>
              </Field>
              <div className="flex items-end gap-3">
                <Toggle checked={a.active} onChange={(v) => upd(i, { active: v })} label="Live" />
                <button className={`${btnGhost} text-[#b23a1a]`} onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label={`Remove ${a.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Short description" className="md:col-span-4">
                <input className={input} value={a.note} onChange={(e) => upd(i, { note: e.target.value })} />
              </Field>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

// ───────────────────────── blocked dates ─────────────────────────
function Blocks({ api, config, notify }: { api: Api; config: PublicConfig; notify: (m: string, ok?: boolean) => void }) {
  const today = todayIST()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [form, setForm] = useState({ cabin: config.stays[0].id as CabinId, from: today, to: addDaysISO(today, 1), units: 1, reason: '' })
  useEffect(() => {
    api<Block[]>('/blocks').then(setBlocks).catch(() => {})
  }, [api])
  const stayName = (id: CabinId) => config.stays.find((s) => s.id === id)?.name ?? id

  const add = async () => {
    try {
      setBlocks(await api<Block[]>('/blocks', { method: 'POST', body: JSON.stringify(form) }))
      notify('Dates blocked')
      setForm((f) => ({ ...f, reason: '' }))
    } catch (e) {
      notify((e as Error).message, false)
    }
  }
  const remove = async (id: number) => {
    try {
      setBlocks(await api<Block[]>(`/blocks/${id}`, { method: 'DELETE' }))
      notify('Block removed')
    } catch (e) {
      notify((e as Error).message, false)
    }
  }
  const max = config.stays.find((s) => s.id === form.cabin)?.units ?? 1

  return (
    <>
      <Card title="Block dates">
        <p className="-mt-2 mb-4 text-sm text-ink/60">Close rooms for maintenance, private use, or bookings taken by phone or on other sites, so the website never double-books.</p>
        <div className="grid items-end gap-3 md:grid-cols-[1.4fr_1fr_1fr_0.6fr_1.4fr_auto]">
          <Field label="Room">
            <select className={input} value={form.cabin} onChange={(e) => setForm({ ...form, cabin: e.target.value as CabinId, units: 1 })}>
              {config.stays.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="First night">
            <input className={input} type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value, to: e.target.value >= form.to ? addDaysISO(e.target.value, 1) : form.to })} />
          </Field>
          <Field label="Until (morning of)">
            <input className={input} type="date" min={addDaysISO(form.from, 1)} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </Field>
          <Field label="Rooms">
            <input className={input} type="number" min={1} max={max} value={form.units} onChange={(e) => setForm({ ...form, units: Math.min(max, Math.max(1, num(e.target.value))) })} />
          </Field>
          <Field label="Reason">
            <input className={input} placeholder="e.g. Booking.com guest, repairs" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <button className={btnPrimary} onClick={add}>
            <Plus size={15} /> Block
          </button>
        </div>
      </Card>
      <Card title="Current blocks">
        {blocks.length === 0 ? (
          <p className="text-sm text-ink/60">Nothing blocked.</p>
        ) : (
          <ul className="divide-y divide-cedar/10">
            {blocks.map((b) => (
              <li key={b.id} className={`flex flex-wrap items-center gap-3 py-3 text-sm ${b.to <= today ? 'opacity-50' : ''}`}>
                <span className="font-semibold">{stayName(b.cabin)}</span>
                <span className="text-ink/60">
                  {fmt(b.from)} → {fmt(b.to)} · {b.units} room{b.units > 1 ? 's' : ''}
                </span>
                {b.reason && <span className="text-ink/60">· {b.reason}</span>}
                <button className={`${btnGhost} ml-auto text-[#b23a1a]`} onClick={() => remove(b.id)}>
                  <Trash2 size={14} /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

// ───────────────────────── settings ─────────────────────────
function SettingsPanel({
  api,
  config,
  onSaved,
  notify,
  onToken,
}: {
  api: Api
  config: PublicConfig
  onSaved: (c: PublicConfig) => void
  notify: (m: string, ok?: boolean) => void
  onToken: (t: string) => void
}) {
  const [s, setS] = useState<Settings>(() => structuredClone(config.settings))
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(s) !== JSON.stringify(config.settings)
  const set = (p: Partial<Settings>) => setS((x) => ({ ...x, ...p }))
  const gst = (p: Partial<Settings['gst']>) => setS((x) => ({ ...x, gst: { ...x.gst, ...p } }))
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })

  const save = async () => {
    setBusy(true)
    try {
      const c = await api<PublicConfig>('/settings', { method: 'PUT', body: JSON.stringify(s) })
      onSaved(c)
      setS(structuredClone(c.settings))
      notify('Settings saved')
    } catch (e) {
      notify((e as Error).message, false)
    } finally {
      setBusy(false)
    }
  }
  const changePw = async () => {
    if (pw.next !== pw.confirm) return notify('The new passwords don’t match.', false)
    try {
      const r = await api<{ token: string }>('/password', { method: 'POST', body: JSON.stringify({ current: pw.current, next: pw.next }) })
      onToken(r.token)
      setPw({ current: '', next: '', confirm: '' })
      notify('Password changed. Other devices have been signed out.')
    } catch (e) {
      notify((e as Error).message, false)
    }
  }
  const t = (k: keyof Settings, label: string, hint?: string, cls = '') => (
    <Field label={label} hint={hint} className={cls}>
      <input className={input} value={s[k] as string} onChange={(e) => set({ [k]: e.target.value } as Partial<Settings>)} />
    </Field>
  )
  const n = (val: number, on: (v: number) => void, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={input} type="number" min={0} value={val} onChange={(e) => on(Number(e.target.value) || 0)} />
    </Field>
  )

  return (
    <>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setS(structuredClone(config.settings))} />
      <Card title="Booking rules">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {(['request', 'instant'] as const).map((m) => (
            <button
              key={m}
              onClick={() => set({ bookingMode: m })}
              className={`rounded-2xl border-2 p-4 text-left transition ${s.bookingMode === m ? 'border-glacier bg-glacier/5' : 'border-cedar/15 bg-white'}`}
              aria-pressed={s.bookingMode === m}
            >
              <div className="font-semibold text-pine">{m === 'request' ? 'Booking requests' : 'Instant confirmation'}</div>
              <div className="text-xs text-ink/60">
                {m === 'request' ? 'Guests send a request; you confirm it here, then WhatsApp them.' : 'Bookings are confirmed immediately if a room is free.'}
              </div>
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {n(s.minNights, (v) => set({ minNights: Math.max(1, v) }), 'Minimum nights')}
          {n(s.maxNights, (v) => set({ maxNights: Math.max(1, v) }), 'Maximum nights')}
          {n(s.maxAdvanceDays, (v) => set({ maxAdvanceDays: Math.max(1, v) }), 'Book up to (days ahead)')}
          {n(s.extraGuestFee, (v) => set({ extraGuestFee: v }), 'Extra bedding (₹/guest/night)')}
          {n(s.maxExtraGuests, (v) => set({ maxExtraGuests: v }), 'Max extra guests per room', 'Beyond the room’s “sleeps”')}
          {t('checkInTime', 'Check-in time')}
          {t('checkOutTime', 'Check-out time')}
          <div className="flex flex-col justify-end gap-2 pb-1">
            <Toggle checked={s.petsAllowed} onChange={(v) => set({ petsAllowed: v })} label="Pets allowed" />
            <Toggle checked={s.breakfastIncluded} onChange={(v) => set({ breakfastIncluded: v })} label="Breakfast included" />
          </div>
          <Field label="Policies shown at booking" className="md:col-span-4">
            <textarea className={`${input} min-h-20`} value={s.policies} onChange={(e) => set({ policies: e.target.value })} />
          </Field>
          <Field label="Message shown after a booking request" className="md:col-span-4">
            <input className={input} value={s.confirmationNote} onChange={(e) => set({ confirmationNote: e.target.value })} />
          </Field>
        </div>
      </Card>
      <Card title="GST">
        <p className="-mt-2 mb-4 text-xs text-ink/50">
          Room GST is decided per night by that night’s tariff. Defaults follow the rates in force from 22 Sep 2025 (5% up to ₹7,500, 18% above). Please confirm with your accountant.
        </p>
        <div className="grid gap-4 md:grid-cols-4">
          {n(s.gst.roomThreshold, (v) => gst({ roomThreshold: v }), 'Slab threshold (₹/night)')}
          {n(s.gst.roomLowRate, (v) => gst({ roomLowRate: v }), 'GST at or below (%)')}
          {n(s.gst.roomHighRate, (v) => gst({ roomHighRate: v }), 'GST above (%)')}
          {n(s.gst.addonRate, (v) => gst({ addonRate: v }), 'GST on experiences (%)')}
        </div>
      </Card>
      <EmailCard api={api} settings={s} set={set} dirty={dirty} notify={notify} />
      <Card title="Resort details">
        <div className="grid gap-4 md:grid-cols-2">
          {t('resortName', 'Resort name')}
          {t('phone', 'Phone (shown on site)')}
          {t('whatsapp', 'WhatsApp number', 'Digits only with country code, e.g. 917889504310')}
          {t('email', 'Email')}
          {t('address', 'Address', undefined, 'md:col-span-2')}
          {t('tagline', 'Tagline', undefined, 'md:col-span-2')}
          {t('instagram', 'Instagram URL')}
          {t('facebook', 'Facebook URL')}
        </div>
      </Card>
      <Card title="Admin password">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="Current password">
            <input className={input} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="New password" hint="At least 10 characters">
            <input className={input} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Repeat new password">
            <input className={input} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <button className={btnPrimary} disabled={!pw.current || pw.next.length < 10} onClick={changePw}>
            Change
          </button>
        </div>
      </Card>
    </>
  )
}

// ───────────────────────── email notifications ─────────────────────────
interface MailStatus {
  configured: boolean
  host: string
  from: string
  lastSentAt: string | null
  lastError: string | null
}

function EmailCard({ api, settings, set, dirty, notify }: { api: Api; settings: Settings; set: (p: Partial<Settings>) => void; dirty: boolean; notify: (m: string, ok?: boolean) => void }) {
  const [st, setSt] = useState<MailStatus | null>(null)
  const [sending, setSending] = useState(false)
  const refresh = useCallback(() => {
    api<MailStatus>('/email/status').then(setSt).catch(() => {})
  }, [api])
  useEffect(refresh, [refresh])

  const test = async () => {
    setSending(true)
    try {
      await api('/email/test', { method: 'POST' })
      notify('Test email sent. Check the inbox (and the spam folder).')
    } catch (e) {
      notify((e as Error).message, false)
    } finally {
      setSending(false)
      refresh()
    }
  }

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Mail size={18} /> Email notifications
        </span>
      }
      actions={
        st && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.configured ? 'bg-glacier/15 text-glacier' : 'bg-saffron/15 text-[#a8501b]'}`}>
            {st.configured ? `Sending from ${st.from}` : 'Not set up on the server'}
          </span>
        )
      }
    >
      {st && !st.configured && (
        <p className="mb-4 rounded-xl bg-saffron/10 px-4 py-3 text-sm text-cedar">
          To send emails, add your mail account to the server’s <code className="rounded bg-white px-1">.env</code> file (SMTP_HOST, SMTP_USER, SMTP_PASS. For Gmail, use an App
          Password) and restart it. The settings below are saved either way.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Field label="Send new-booking alerts to" hint="One or more addresses, separated by commas">
          <input className={input} value={settings.notifyEmails} onChange={(e) => set({ notifyEmails: e.target.value })} placeholder="yamsarresort@gmail.com, manager@example.com" />
        </Field>
        <div className="flex items-end pb-1">
          <Toggle checked={settings.emailGuests} onChange={(v) => set({ emailGuests: v })} label="Email guests too" />
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/50">
        Guests who leave an email get a receipt when they book, and another email when you confirm or cancel their booking.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className={btnGhost} onClick={test} disabled={sending || dirty || !st?.configured} title={dirty ? 'Save your changes first' : undefined}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send test email
        </button>
        {dirty && <span className="text-xs text-ink/50">Save changes before sending a test.</span>}
        {st?.lastSentAt && <span className="text-xs text-ink/50">Last sent {new Date(st.lastSentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
      </div>
      {st?.lastError && <p className="mt-3 rounded-xl bg-[#b23a1a]/10 px-4 py-2 text-xs text-[#b23a1a]">Last error: {st.lastError}</p>}
    </Card>
  )
}

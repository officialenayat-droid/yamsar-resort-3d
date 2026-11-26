import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DEFAULT_CONFIG } from '../shared/defaults.ts'
import { nightsBetween } from '../shared/pricing.ts'
import type { AddonConfig, Availability, Block, Booking, BookingStatus, CabinId, PublicConfig, Settings, StayConfig } from '../shared/types.ts'
import { CABIN_IDS } from '../shared/types.ts'

const DB_PATH = resolve(process.env.DB_PATH ?? 'data/yamsar.db')
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS bookings (
    ref TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL,
    cabin TEXT NOT NULL,
    stay_name TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    nights INTEGER NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER NOT NULL,
    addons TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    admin_notes TEXT NOT NULL DEFAULT '',
    quote TEXT NOT NULL,
    total INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'website'
  );
  CREATE INDEX IF NOT EXISTS bookings_dates ON bookings (cabin, check_in, check_out);
  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cabin TEXT NOT NULL,
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL DEFAULT ''
  );
`)

// ───────────── key/value config ─────────────
export function getKV<T>(key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}
export function setKV(key: string, value: unknown) {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value))
}

// seed on first run
if (!getKV<unknown>('stays', null)) setKV('stays', DEFAULT_CONFIG.stays)
if (!getKV<unknown>('addons', null)) setKV('addons', DEFAULT_CONFIG.addons)
if (!getKV<unknown>('settings', null)) setKV('settings', DEFAULT_CONFIG.settings)

export function getConfig(): PublicConfig {
  // merge with defaults so newly-added settings fields always have a value
  const settings = { ...DEFAULT_CONFIG.settings, ...getKV<Partial<Settings>>('settings', {}) }
  settings.gst = { ...DEFAULT_CONFIG.settings.gst, ...settings.gst }
  const stays = getKV<StayConfig[]>('stays', DEFAULT_CONFIG.stays)
  return {
    stays: CABIN_IDS.map((id) => ({ ...DEFAULT_CONFIG.stays.find((s) => s.id === id)!, ...stays.find((s) => s.id === id) })),
    addons: getKV<AddonConfig[]>('addons', DEFAULT_CONFIG.addons),
    settings,
  }
}

// ───────────── bookings ─────────────
const ACTIVE: BookingStatus[] = ['pending', 'confirmed', 'checked_in']

interface BookingRow {
  ref: string
  created_at: string
  updated_at: string
  status: BookingStatus
  cabin: CabinId
  stay_name: string
  check_in: string
  check_out: string
  nights: number
  adults: number
  children: number
  addons: string
  name: string
  phone: string
  email: string
  notes: string
  admin_notes: string
  quote: string
  total: number
  source: string
}

const toBooking = (r: BookingRow): Booking => ({
  ref: r.ref,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  status: r.status,
  cabin: r.cabin,
  stayName: r.stay_name,
  checkIn: r.check_in,
  checkOut: r.check_out,
  nights: r.nights,
  adults: r.adults,
  children: r.children,
  addons: JSON.parse(r.addons),
  name: r.name,
  phone: r.phone,
  email: r.email,
  notes: r.notes,
  adminNotes: r.admin_notes,
  quote: JSON.parse(r.quote),
  total: r.total,
  source: r.source,
})

export function insertBooking(b: Booking) {
  db.prepare(
    `INSERT INTO bookings (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    b.ref,
    b.createdAt,
    b.updatedAt,
    b.status,
    b.cabin,
    b.stayName,
    b.checkIn,
    b.checkOut,
    b.nights,
    b.adults,
    b.children,
    JSON.stringify(b.addons),
    b.name,
    b.phone,
    b.email,
    b.notes,
    b.adminNotes,
    JSON.stringify(b.quote),
    b.total,
    b.source,
  )
}

export function listBookings(filter: { status?: string; from?: string; to?: string; q?: string }): Booking[] {
  const where: string[] = []
  const args: string[] = []
  if (filter.status) {
    where.push('status = ?')
    args.push(filter.status)
  }
  if (filter.from) {
    where.push('check_out > ?')
    args.push(filter.from)
  }
  if (filter.to) {
    where.push('check_in < ?')
    args.push(filter.to)
  }
  if (filter.q) {
    where.push('(ref LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)')
    const like = `%${filter.q}%`
    args.push(like, like, like, like)
  }
  const sql = `SELECT * FROM bookings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY check_in ASC, created_at ASC LIMIT 1000`
  return (db.prepare(sql).all(...args) as unknown as BookingRow[]).map(toBooking)
}

export function getBooking(ref: string): Booking | null {
  const r = db.prepare('SELECT * FROM bookings WHERE ref = ?').get(ref) as unknown as BookingRow | undefined
  return r ? toBooking(r) : null
}

export function updateBooking(ref: string, patch: { status?: BookingStatus; adminNotes?: string }) {
  const b = getBooking(ref)
  if (!b) return null
  db.prepare('UPDATE bookings SET status = ?, admin_notes = ?, updated_at = ? WHERE ref = ?').run(
    patch.status ?? b.status,
    patch.adminNotes ?? b.adminNotes,
    new Date().toISOString(),
    ref,
  )
  return getBooking(ref)
}

// ───────────── blocks (closed dates / offline bookings) ─────────────
interface BlockRow {
  id: number
  cabin: CabinId
  from_date: string
  to_date: string
  units: number
  reason: string
}
export function listBlocks(): Block[] {
  return (db.prepare('SELECT * FROM blocks ORDER BY from_date').all() as unknown as BlockRow[]).map((r) => ({
    id: r.id,
    cabin: r.cabin,
    from: r.from_date,
    to: r.to_date,
    units: r.units,
    reason: r.reason,
  }))
}
export function addBlock(b: Omit<Block, 'id'>) {
  db.prepare('INSERT INTO blocks (cabin, from_date, to_date, units, reason) VALUES (?, ?, ?, ?, ?)').run(b.cabin, b.from, b.to, b.units, b.reason)
}
export function deleteBlock(id: number) {
  db.prepare('DELETE FROM blocks WHERE id = ?').run(id)
}

// ───────────── availability ─────────────
/** Rooms left for every cabin across [checkIn, checkOut). */
export function availability(checkIn: string, checkOut: string, excludeRef?: string): Availability {
  const cfg = getConfig()
  const nights = nightsBetween(checkIn, checkOut)
  const placeholders = ACTIVE.map(() => '?').join(',')
  const bookings = db
    .prepare(`SELECT ref, cabin, check_in, check_out FROM bookings WHERE status IN (${placeholders}) AND check_in < ? AND check_out > ?`)
    .all(...ACTIVE, checkOut, checkIn) as unknown as { ref: string; cabin: CabinId; check_in: string; check_out: string }[]
  const blocks = db.prepare('SELECT cabin, from_date, to_date, units FROM blocks WHERE from_date < ? AND to_date > ?').all(checkOut, checkIn) as unknown as {
    cabin: CabinId
    from_date: string
    to_date: string
    units: number
  }[]
  const out = {} as Availability
  for (const stay of cfg.stays) {
    let min = stay.units
    for (const d of nights) {
      let used = 0
      for (const b of bookings) if (b.cabin === stay.id && b.ref !== excludeRef && b.check_in <= d && d < b.check_out) used++
      for (const k of blocks) if (k.cabin === stay.id && k.from_date <= d && d < k.to_date) used += k.units
      min = Math.min(min, stay.units - used)
    }
    out[stay.id] = Math.max(0, min)
  }
  return out
}

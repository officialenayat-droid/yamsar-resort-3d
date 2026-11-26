/** SQLite store (Node's built-in node:sqlite). Used for local development and single-server hosting. */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Block, Booking, BookingStatus, CabinId } from '../shared/types.ts'
import { ACTIVE_STATUSES, type BookingFilter, type Store } from './store.ts'

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

export function createSqliteStore(path = process.env.DB_PATH ?? 'data/yamsar.db'): Store {
  const file = resolve(path)
  mkdirSync(dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookings (
      ref TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, status TEXT NOT NULL,
      cabin TEXT NOT NULL, stay_name TEXT NOT NULL, check_in TEXT NOT NULL, check_out TEXT NOT NULL,
      nights INTEGER NOT NULL, adults INTEGER NOT NULL, children INTEGER NOT NULL, addons TEXT NOT NULL,
      name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
      admin_notes TEXT NOT NULL DEFAULT '', quote TEXT NOT NULL, total INTEGER NOT NULL, source TEXT NOT NULL DEFAULT 'website'
    );
    CREATE INDEX IF NOT EXISTS bookings_dates ON bookings (cabin, check_in, check_out);
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, cabin TEXT NOT NULL, from_date TEXT NOT NULL,
      to_date TEXT NOT NULL, units INTEGER NOT NULL DEFAULT 1, reason TEXT NOT NULL DEFAULT ''
    );
  `)

  const getBooking = (ref: string) => {
    const r = db.prepare('SELECT * FROM bookings WHERE ref = ?').get(ref) as unknown as BookingRow | undefined
    return r ? toBooking(r) : null
  }

  const store: Store = {
    async getKV<T>(key: string, fallback: T) {
      const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
      if (!row) return fallback
      try {
        return JSON.parse(row.value) as T
      } catch {
        return fallback
      }
    },
    async setKV(key, value) {
      db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value))
    },
    async insertBooking(b) {
      db.prepare(
        `INSERT INTO bookings (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(b.ref, b.createdAt, b.updatedAt, b.status, b.cabin, b.stayName, b.checkIn, b.checkOut, b.nights, b.adults, b.children, JSON.stringify(b.addons), b.name, b.phone, b.email, b.notes, b.adminNotes, JSON.stringify(b.quote), b.total, b.source)
    },
    async listBookings(f: BookingFilter) {
      const where: string[] = []
      const args: string[] = []
      if (f.status) where.push('status = ?'), args.push(f.status)
      if (f.from) where.push('check_out > ?'), args.push(f.from)
      if (f.to) where.push('check_in < ?'), args.push(f.to)
      if (f.q) {
        where.push('(ref LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)')
        const like = `%${f.q}%`
        args.push(like, like, like, like)
      }
      const sql = `SELECT * FROM bookings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY check_in ASC, created_at ASC LIMIT 1000`
      return (db.prepare(sql).all(...args) as unknown as BookingRow[]).map(toBooking)
    },
    async getBooking(ref) {
      return getBooking(ref)
    },
    async updateBooking(ref, patch) {
      const b = getBooking(ref)
      if (!b) return null
      db.prepare('UPDATE bookings SET status = ?, admin_notes = ?, updated_at = ? WHERE ref = ?').run(patch.status ?? b.status, patch.adminNotes ?? b.adminNotes, new Date().toISOString(), ref)
      return getBooking(ref)
    },
    async listBlocks() {
      return (db.prepare('SELECT * FROM blocks ORDER BY from_date').all() as unknown as { id: number; cabin: CabinId; from_date: string; to_date: string; units: number; reason: string }[]).map(
        (r): Block => ({ id: r.id, cabin: r.cabin, from: r.from_date, to: r.to_date, units: r.units, reason: r.reason }),
      )
    },
    async addBlock(b) {
      db.prepare('INSERT INTO blocks (cabin, from_date, to_date, units, reason) VALUES (?, ?, ?, ?, ?)').run(b.cabin, b.from, b.to, b.units, b.reason)
    },
    async deleteBlock(id) {
      db.prepare('DELETE FROM blocks WHERE id = ?').run(id)
    },
    async activeBookingsBetween(from, to) {
      const ph = ACTIVE_STATUSES.map(() => '?').join(',')
      const rows = db.prepare(`SELECT ref, cabin, check_in, check_out FROM bookings WHERE status IN (${ph}) AND check_in < ? AND check_out > ?`).all(...ACTIVE_STATUSES, to, from) as unknown as {
        ref: string
        cabin: CabinId
        check_in: string
        check_out: string
      }[]
      return rows.map((r) => ({ ref: r.ref, cabin: r.cabin, checkIn: r.check_in, checkOut: r.check_out }))
    },
    async blocksBetween(from, to) {
      const rows = db.prepare('SELECT cabin, from_date, to_date, units FROM blocks WHERE from_date < ? AND to_date > ?').all(to, from) as unknown as { cabin: CabinId; from_date: string; to_date: string; units: number }[]
      return rows.map((r) => ({ cabin: r.cabin, from: r.from_date, to: r.to_date, units: r.units }))
    },
    // single process + synchronous driver: a simple promise queue serialises booking creation
    exclusive: (() => {
      let chain: Promise<unknown> = Promise.resolve()
      return <T,>(_cabin: CabinId, fn: (s: Store) => Promise<T>) => {
        const run = chain.then(() => fn(store))
        chain = run.catch(() => {})
        return run
      }
    })(),
  }
  return store
}

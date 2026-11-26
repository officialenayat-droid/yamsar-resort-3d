/**
 * MySQL / MariaDB store (mysql2). Used on Hostinger, whose Node.js apps reach the
 * plan's MySQL at 127.0.0.1. Tables are created automatically on first start and
 * prefixed `ymr_` so they never collide with WordPress (`wp_`) or anything else.
 */
import mysql from 'mysql2/promise'
import type { Block, Booking, BookingStatus, CabinId } from '../shared/types.ts'
import { ACTIVE_STATUSES, type BookingFilter, type Store } from './store.ts'

type Conn = mysql.Pool | mysql.PoolConnection

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ymr_kv (
     k VARCHAR(64) NOT NULL PRIMARY KEY,
     v LONGTEXT NOT NULL,
     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS ymr_bookings (
     ref VARCHAR(20) NOT NULL PRIMARY KEY,
     created_at VARCHAR(30) NOT NULL,
     updated_at VARCHAR(30) NOT NULL,
     status VARCHAR(16) NOT NULL,
     cabin VARCHAR(16) NOT NULL,
     stay_name VARCHAR(120) NOT NULL,
     check_in DATE NOT NULL,
     check_out DATE NOT NULL,
     nights INT NOT NULL,
     adults INT NOT NULL,
     children INT NOT NULL,
     addons LONGTEXT NOT NULL,
     name VARCHAR(120) NOT NULL,
     phone VARCHAR(40) NOT NULL,
     email VARCHAR(200) NOT NULL DEFAULT '',
     notes TEXT NOT NULL,
     admin_notes TEXT NOT NULL,
     quote LONGTEXT NOT NULL,
     total INT NOT NULL,
     source VARCHAR(30) NOT NULL DEFAULT 'website',
     KEY ymr_bookings_dates (cabin, check_in, check_out),
     KEY ymr_bookings_status (status)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS ymr_blocks (
     id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
     cabin VARCHAR(16) NOT NULL,
     from_date DATE NOT NULL,
     to_date DATE NOT NULL,
     units INT NOT NULL DEFAULT 1,
     reason VARCHAR(200) NOT NULL DEFAULT ''
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

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

const json = <T,>(v: unknown): T => (typeof v === 'string' ? JSON.parse(v) : v) as T

const toBooking = (r: BookingRow): Booking => ({
  ref: r.ref,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  status: r.status,
  cabin: r.cabin,
  stayName: r.stay_name,
  checkIn: r.check_in,
  checkOut: r.check_out,
  nights: Number(r.nights),
  adults: Number(r.adults),
  children: Number(r.children),
  addons: json(r.addons),
  name: r.name,
  phone: r.phone,
  email: r.email,
  notes: r.notes,
  adminNotes: r.admin_notes,
  quote: json(r.quote),
  total: Number(r.total),
  source: r.source,
})

async function rows<T>(db: Conn, sql: string, args: unknown[] = []): Promise<T[]> {
  const [r] = await db.query(sql, args)
  return r as T[]
}

function storeFor(db: Conn, pool: mysql.Pool, ready: () => Promise<void>): Store {
  const getBooking = async (ref: string) => {
    const r = await rows<BookingRow>(db, 'SELECT * FROM ymr_bookings WHERE ref = ?', [ref])
    return r.length ? toBooking(r[0]) : null
  }
  const store: Store = {
    async getKV<T>(key: string, fallback: T) {
      await ready()
      const r = await rows<{ v: string }>(db, 'SELECT v FROM ymr_kv WHERE k = ?', [key])
      if (!r.length) return fallback
      try {
        return JSON.parse(r[0].v) as T
      } catch {
        return fallback
      }
    },
    async setKV(key, value) {
      await ready()
      await db.query('INSERT INTO ymr_kv (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [key, JSON.stringify(value)])
    },
    async insertBooking(b) {
      await db.query(
        `INSERT INTO ymr_bookings (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.ref, b.createdAt, b.updatedAt, b.status, b.cabin, b.stayName, b.checkIn, b.checkOut, b.nights, b.adults, b.children, JSON.stringify(b.addons), b.name, b.phone, b.email, b.notes, b.adminNotes, JSON.stringify(b.quote), b.total, b.source],
      )
    },
    async listBookings(f: BookingFilter) {
      await ready()
      const where: string[] = []
      const args: unknown[] = []
      if (f.status) where.push('status = ?'), args.push(f.status)
      if (f.from) where.push('check_out > ?'), args.push(f.from)
      if (f.to) where.push('check_in < ?'), args.push(f.to)
      if (f.q) {
        where.push('(ref LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)')
        const like = `%${f.q}%`
        args.push(like, like, like, like)
      }
      const r = await rows<BookingRow>(db, `SELECT * FROM ymr_bookings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY check_in ASC, created_at ASC LIMIT 1000`, args)
      return r.map(toBooking)
    },
    getBooking,
    async updateBooking(ref, patch) {
      const b = await getBooking(ref)
      if (!b) return null
      await db.query('UPDATE ymr_bookings SET status = ?, admin_notes = ?, updated_at = ? WHERE ref = ?', [patch.status ?? b.status, patch.adminNotes ?? b.adminNotes, new Date().toISOString(), ref])
      return getBooking(ref)
    },
    async listBlocks() {
      await ready()
      const r = await rows<{ id: number; cabin: CabinId; from_date: string; to_date: string; units: number; reason: string }>(db, 'SELECT * FROM ymr_blocks ORDER BY from_date')
      return r.map((x): Block => ({ id: Number(x.id), cabin: x.cabin, from: x.from_date, to: x.to_date, units: Number(x.units), reason: x.reason }))
    },
    async addBlock(b) {
      await db.query('INSERT INTO ymr_blocks (cabin, from_date, to_date, units, reason) VALUES (?, ?, ?, ?, ?)', [b.cabin, b.from, b.to, b.units, b.reason])
    },
    async deleteBlock(id) {
      await db.query('DELETE FROM ymr_blocks WHERE id = ?', [id])
    },
    async activeBookingsBetween(from, to) {
      await ready()
      const r = await rows<{ ref: string; cabin: CabinId; check_in: string; check_out: string }>(
        db,
        `SELECT ref, cabin, check_in, check_out FROM ymr_bookings WHERE status IN (?) AND check_in < ? AND check_out > ?`,
        [ACTIVE_STATUSES, to, from],
      )
      return r.map((x) => ({ ref: x.ref, cabin: x.cabin, checkIn: x.check_in, checkOut: x.check_out }))
    },
    async blocksBetween(from, to) {
      await ready()
      const r = await rows<{ cabin: CabinId; from_date: string; to_date: string; units: number }>(db, 'SELECT cabin, from_date, to_date, units FROM ymr_blocks WHERE from_date < ? AND to_date > ?', [to, from])
      return r.map((x) => ({ cabin: x.cabin, from: x.from_date, to: x.to_date, units: Number(x.units) }))
    },
    async exclusive<T>(cabin: CabinId, fn: (s: Store) => Promise<T>) {
      await ready()
      // a named lock per room type: concurrent bookings for the same room queue up (across processes too)
      const conn = await pool.getConnection()
      const lock = `yamsar-booking-${cabin}`
      try {
        const [r] = await conn.query('SELECT GET_LOCK(?, 15) AS ok', [lock])
        if (!(r as { ok: number }[])[0]?.ok) throw new Error('Could not acquire booking lock, please try again.')
        return await fn(storeFor(conn, pool, ready))
      } finally {
        await conn.query('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {})
        conn.release()
      }
    },
  }
  return store
}

/** Connection from DATABASE_URL (mysql://…) or DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME. */
export function createMysqlStore(env: Record<string, string | undefined>): Store {
  const common = { dateStrings: true, charset: 'utf8mb4', connectionLimit: 5, waitForConnections: true, enableKeepAlive: true, timezone: 'Z' } as const
  const pool = env.DATABASE_URL?.startsWith('mysql')
    ? mysql.createPool({ uri: env.DATABASE_URL, ...common })
    : mysql.createPool({
        host: env.DB_HOST || '127.0.0.1',
        port: Number(env.DB_PORT || 3306),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        ...common,
      })
  let schema: Promise<void> | null = null
  const ready = () =>
    (schema ??= (async () => {
      for (const s of SCHEMA) await pool.query(s)
    })().catch((e) => {
      schema = null
      throw e
    }))
  return storeFor(pool, pool, ready)
}

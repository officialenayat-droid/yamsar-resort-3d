/** Postgres store (postgres.js). Used by the Supabase Edge Function in production. Schema: supabase/migrations. */
import postgres from 'postgres'
import type { Block, Booking, BookingStatus, CabinId } from '../shared/types.ts'
import { ACTIVE_STATUSES, type BookingFilter, type Store } from './store.ts'

type Sql = postgres.Sql | postgres.TransactionSql

interface BookingRow {
  ref: string
  created_at: Date
  updated_at: Date
  status: BookingStatus
  cabin: CabinId
  stay_name: string
  check_in: string
  check_out: string
  nights: number
  adults: number
  children: number
  addons: string[]
  name: string
  phone: string
  email: string
  notes: string
  admin_notes: string
  quote: Booking['quote']
  total: number
  source: string
}

const toBooking = (r: BookingRow): Booking => ({
  ref: r.ref,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
  status: r.status,
  cabin: r.cabin,
  stayName: r.stay_name,
  checkIn: r.check_in,
  checkOut: r.check_out,
  nights: r.nights,
  adults: r.adults,
  children: r.children,
  addons: r.addons,
  name: r.name,
  phone: r.phone,
  email: r.email,
  notes: r.notes,
  adminNotes: r.admin_notes,
  quote: r.quote,
  total: Number(r.total),
  source: r.source,
})

const BOOKING_COLS = 'ref, created_at, updated_at, status, cabin, stay_name, check_in::text AS check_in, check_out::text AS check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source'

function storeFor(sql: Sql, root: postgres.Sql): Store {
  const s: Store = {
    async getKV<T>(key: string, fallback: T) {
      const rows = await sql`SELECT value FROM website.kv WHERE key = ${key}`
      return rows.length ? (rows[0].value as T) : fallback
    },
    async setKV(key, value) {
      await sql`INSERT INTO website.kv (key, value) VALUES (${key}, ${sql.json(value as postgres.JSONValue)})
                ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`
    },
    async insertBooking(b) {
      await sql`INSERT INTO website.bookings
        (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
        VALUES (${b.ref}, ${b.createdAt}, ${b.updatedAt}, ${b.status}, ${b.cabin}, ${b.stayName}, ${b.checkIn}, ${b.checkOut}, ${b.nights}, ${b.adults}, ${b.children},
                ${sql.json(b.addons)}, ${b.name}, ${b.phone}, ${b.email}, ${b.notes}, ${b.adminNotes}, ${sql.json(b.quote as unknown as postgres.JSONValue)}, ${b.total}, ${b.source})`
    },
    async listBookings(f: BookingFilter) {
      const like = f.q ? `%${f.q}%` : null
      const rows = await sql.unsafe<BookingRow[]>(
        `SELECT ${BOOKING_COLS} FROM website.bookings
         WHERE ($1::text IS NULL OR status = $1)
           AND ($2::date IS NULL OR check_out > $2::date)
           AND ($3::date IS NULL OR check_in < $3::date)
           AND ($4::text IS NULL OR ref ILIKE $4 OR name ILIKE $4 OR phone ILIKE $4 OR email ILIKE $4)
         ORDER BY check_in ASC, created_at ASC LIMIT 1000`,
        [f.status ?? null, f.from ?? null, f.to ?? null, like],
      )
      return rows.map(toBooking)
    },
    async getBooking(ref) {
      const rows = await sql.unsafe<BookingRow[]>(`SELECT ${BOOKING_COLS} FROM website.bookings WHERE ref = $1`, [ref])
      return rows.length ? toBooking(rows[0]) : null
    },
    async updateBooking(ref, patch) {
      const rows = await sql.unsafe<BookingRow[]>(
        `UPDATE website.bookings SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes), updated_at = now()
         WHERE ref = $1 RETURNING ${BOOKING_COLS}`,
        [ref, patch.status ?? null, patch.adminNotes ?? null],
      )
      return rows.length ? toBooking(rows[0]) : null
    },
    async listBlocks() {
      const rows = await sql`SELECT id, cabin, from_date::text AS from_date, to_date::text AS to_date, units, reason FROM website.blocks ORDER BY from_date`
      return rows.map((r): Block => ({ id: Number(r.id), cabin: r.cabin, from: r.from_date, to: r.to_date, units: r.units, reason: r.reason }))
    },
    async addBlock(b) {
      await sql`INSERT INTO website.blocks (cabin, from_date, to_date, units, reason) VALUES (${b.cabin}, ${b.from}, ${b.to}, ${b.units}, ${b.reason})`
    },
    async deleteBlock(id) {
      await sql`DELETE FROM website.blocks WHERE id = ${id}`
    },
    async activeBookingsBetween(from, to) {
      const rows = await sql`SELECT ref, cabin, check_in::text AS check_in, check_out::text AS check_out FROM website.bookings
                             WHERE status IN ${sql(ACTIVE_STATUSES)} AND check_in < ${to}::date AND check_out > ${from}::date`
      return rows.map((r) => ({ ref: r.ref, cabin: r.cabin, checkIn: r.check_in, checkOut: r.check_out }))
    },
    async blocksBetween(from, to) {
      const rows = await sql`SELECT cabin, from_date::text AS from_date, to_date::text AS to_date, units FROM website.blocks
                             WHERE from_date < ${to}::date AND to_date > ${from}::date`
      return rows.map((r) => ({ cabin: r.cabin, from: r.from_date, to: r.to_date, units: r.units }))
    },
    async exclusive<T>(cabin: CabinId, fn: (s: Store) => Promise<T>) {
      // transaction-scoped advisory lock per room type: concurrent bookings for the same room queue up
      return (await root.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(hashtext(${'yamsar-booking-' + cabin}))`
        return fn(storeFor(tx, root))
      })) as T
    },
  }
  return s
}

export function createPostgresStore(url: string): Store {
  // prepare:false is required behind Supabase's transaction-mode pooler
  const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 })
  return storeFor(sql, sql)
}

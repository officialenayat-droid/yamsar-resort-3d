import { createRequire as __cr } from "node:module";
__cr(import.meta.url);
import { t as ACTIVE_STATUSES } from "./store-DMqNC0hO.mjs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
// server/store-sqlite.ts
/** SQLite store (Node's built-in node:sqlite). Used for local development and single-server hosting. */
const toBooking = (r) => ({
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
	source: r.source
});
function createSqliteStore(path = process.env.DB_PATH ?? "data/yamsar.db") {
	const file = resolve(path);
	mkdirSync(dirname(file), { recursive: true });
	const db = new DatabaseSync(file);
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
  `);
	const getBooking = (ref) => {
		const r = db.prepare("SELECT * FROM bookings WHERE ref = ?").get(ref);
		return r ? toBooking(r) : null;
	};
	const store = {
		async getKV(key, fallback) {
			const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(key);
			if (!row) return fallback;
			try {
				return JSON.parse(row.value);
			} catch {
				return fallback;
			}
		},
		async setKV(key, value) {
			db.prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, JSON.stringify(value));
		},
		async insertBooking(b) {
			db.prepare(`INSERT INTO bookings (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(b.ref, b.createdAt, b.updatedAt, b.status, b.cabin, b.stayName, b.checkIn, b.checkOut, b.nights, b.adults, b.children, JSON.stringify(b.addons), b.name, b.phone, b.email, b.notes, b.adminNotes, JSON.stringify(b.quote), b.total, b.source);
		},
		async listBookings(f) {
			const where = [];
			const args = [];
			if (f.status) where.push("status = ?"), args.push(f.status);
			if (f.from) where.push("check_out > ?"), args.push(f.from);
			if (f.to) where.push("check_in < ?"), args.push(f.to);
			if (f.q) {
				where.push("(ref LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)");
				const like = `%${f.q}%`;
				args.push(like, like, like, like);
			}
			const sql = `SELECT * FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY check_in ASC, created_at ASC LIMIT 1000`;
			return db.prepare(sql).all(...args).map(toBooking);
		},
		async getBooking(ref) {
			return getBooking(ref);
		},
		async updateBooking(ref, patch) {
			const b = getBooking(ref);
			if (!b) return null;
			db.prepare("UPDATE bookings SET status = ?, admin_notes = ?, updated_at = ? WHERE ref = ?").run(patch.status ?? b.status, patch.adminNotes ?? b.adminNotes, (/* @__PURE__ */ new Date()).toISOString(), ref);
			return getBooking(ref);
		},
		async listBlocks() {
			return db.prepare("SELECT * FROM blocks ORDER BY from_date").all().map((r) => ({
				id: r.id,
				cabin: r.cabin,
				from: r.from_date,
				to: r.to_date,
				units: r.units,
				reason: r.reason
			}));
		},
		async addBlock(b) {
			db.prepare("INSERT INTO blocks (cabin, from_date, to_date, units, reason) VALUES (?, ?, ?, ?, ?)").run(b.cabin, b.from, b.to, b.units, b.reason);
		},
		async deleteBlock(id) {
			db.prepare("DELETE FROM blocks WHERE id = ?").run(id);
		},
		async activeBookingsBetween(from, to) {
			const ph = ACTIVE_STATUSES.map(() => "?").join(",");
			return db.prepare(`SELECT ref, cabin, check_in, check_out FROM bookings WHERE status IN (${ph}) AND check_in < ? AND check_out > ?`).all(...ACTIVE_STATUSES, to, from).map((r) => ({
				ref: r.ref,
				cabin: r.cabin,
				checkIn: r.check_in,
				checkOut: r.check_out
			}));
		},
		async blocksBetween(from, to) {
			return db.prepare("SELECT cabin, from_date, to_date, units FROM blocks WHERE from_date < ? AND to_date > ?").all(to, from).map((r) => ({
				cabin: r.cabin,
				from: r.from_date,
				to: r.to_date,
				units: r.units
			}));
		},
		exclusive: (() => {
			let chain = Promise.resolve();
			return (_cabin, fn) => {
				const run = chain.then(() => fn(store));
				chain = run.catch(() => {});
				return run;
			};
		})()
	};
	return store;
}
export { createSqliteStore };

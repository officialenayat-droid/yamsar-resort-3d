/**
 * Storage interface used by the API. Two implementations:
 *   store-sqlite.ts   – Node's built-in SQLite (local dev / single-server hosting)
 *   store-postgres.ts – Postgres (Supabase Edge Functions in production)
 */
import { DEFAULT_CONFIG } from '../shared/defaults.ts'
import { nightsBetween } from '../shared/pricing.ts'
import type { AddonConfig, Availability, Block, Booking, BookingStatus, CabinId, PublicConfig, Settings, StayConfig } from '../shared/types.ts'
import { CABIN_IDS } from '../shared/types.ts'

export interface BookingFilter {
  status?: string
  from?: string
  to?: string
  q?: string
}

export interface Store {
  getKV<T>(key: string, fallback: T): Promise<T>
  setKV(key: string, value: unknown): Promise<void>
  insertBooking(b: Booking): Promise<void>
  listBookings(filter: BookingFilter): Promise<Booking[]>
  getBooking(ref: string): Promise<Booking | null>
  updateBooking(ref: string, patch: { status?: BookingStatus; adminNotes?: string }): Promise<Booking | null>
  listBlocks(): Promise<Block[]>
  addBlock(b: Omit<Block, 'id'>): Promise<void>
  deleteBlock(id: number): Promise<void>
  /** active bookings (pending/confirmed/checked_in) overlapping [from, to) */
  activeBookingsBetween(from: string, to: string): Promise<{ ref: string; cabin: CabinId; checkIn: string; checkOut: string }[]>
  blocksBetween(from: string, to: string): Promise<{ cabin: CabinId; from: string; to: string; units: number }[]>
  /** run fn so no other booking for this cabin can be created at the same time */
  exclusive<T>(cabin: CabinId, fn: (store: Store) => Promise<T>): Promise<T>
}

export const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in']

/** Seed config on first run. */
export async function seed(store: Store) {
  if (!(await store.getKV<unknown>('stays', null))) await store.setKV('stays', DEFAULT_CONFIG.stays)
  if (!(await store.getKV<unknown>('addons', null))) await store.setKV('addons', DEFAULT_CONFIG.addons)
  if (!(await store.getKV<unknown>('settings', null))) await store.setKV('settings', DEFAULT_CONFIG.settings)
}

export async function getConfig(store: Store): Promise<PublicConfig> {
  // merge with defaults so newly-added settings fields always have a value
  const [savedSettings, stays, addons] = await Promise.all([
    store.getKV<Partial<Settings>>('settings', {}),
    store.getKV<StayConfig[]>('stays', DEFAULT_CONFIG.stays),
    store.getKV<AddonConfig[]>('addons', DEFAULT_CONFIG.addons),
  ])
  const settings = { ...DEFAULT_CONFIG.settings, ...savedSettings }
  settings.gst = { ...DEFAULT_CONFIG.settings.gst, ...settings.gst }
  return {
    stays: CABIN_IDS.map((id) => ({ ...DEFAULT_CONFIG.stays.find((s) => s.id === id)!, ...stays.find((s) => s.id === id) })),
    addons,
    settings,
  }
}

/** Rooms left for every cabin across [checkIn, checkOut). */
export async function availability(store: Store, checkIn: string, checkOut: string, excludeRef?: string): Promise<Availability> {
  const [cfg, bookings, blocks] = await Promise.all([getConfig(store), store.activeBookingsBetween(checkIn, checkOut), store.blocksBetween(checkIn, checkOut)])
  const nights = nightsBetween(checkIn, checkOut)
  const out = {} as Availability
  for (const stay of cfg.stays) {
    let min = stay.units
    for (const d of nights) {
      let used = 0
      for (const b of bookings) if (b.cabin === stay.id && b.ref !== excludeRef && b.checkIn <= d && d < b.checkOut) used++
      for (const k of blocks) if (k.cabin === stay.id && k.from <= d && d < k.to) used += k.units
      min = Math.min(min, stay.units - used)
    }
    out[stay.id] = Math.max(0, min)
  }
  return out
}

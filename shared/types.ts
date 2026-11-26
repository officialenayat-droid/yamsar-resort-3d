/** Types shared by the website, the admin dashboard and the booking server. */

/** The three cabin "slots" in the 3D valley. Each maps to one room type. */
export type CabinId = 'aframe' | 'riverfront' | 'glacier'
export const CABIN_IDS: CabinId[] = ['aframe', 'riverfront', 'glacier']

export interface Season {
  id: string
  name: string
  /** first night the rate applies (YYYY-MM-DD, inclusive) */
  from: string
  /** last night the rate applies (YYYY-MM-DD, inclusive) */
  to: string
  rate: number
}

export interface StayConfig {
  id: CabinId
  name: string
  short: string
  tagline: string
  /** base nightly rate in INR */
  rate: number
  /** optional Friday/Saturday-night rate */
  weekendRate: number | null
  seasons: Season[]
  sleeps: number
  size: string
  view: string
  features: string[]
  /** how many rooms of this type exist (inventory) */
  units: number
  active: boolean
}

export type AddonPer = 'adult' | 'guest' | 'stay' | 'night'

export interface AddonConfig {
  id: string
  name: string
  note: string
  price: number
  per: AddonPer
  active: boolean
}

export interface GstSettings {
  /** room tariff per night at or below this uses roomLowRate */
  roomThreshold: number
  roomLowRate: number
  roomHighRate: number
  /** GST applied to experiences / add-ons */
  addonRate: number
}

export interface Settings {
  resortName: string
  tagline: string
  phone: string
  whatsapp: string
  email: string
  address: string
  instagram: string
  facebook: string
  checkInTime: string
  checkOutTime: string
  petsAllowed: boolean
  breakfastIncluded: boolean
  policies: string
  /** instant = booking is confirmed immediately; request = resort confirms from the dashboard */
  bookingMode: 'instant' | 'request'
  minNights: number
  maxNights: number
  maxAdvanceDays: number
  extraGuestFee: number
  maxExtraGuests: number
  gst: GstSettings
  confirmationNote: string
  /** comma-separated addresses that get new-booking alerts */
  notifyEmails: string
  /** email guests a receipt, and again when you confirm or cancel */
  emailGuests: boolean
}

export interface PublicConfig {
  stays: StayConfig[]
  addons: AddonConfig[]
  settings: Settings
}

export interface BookingInput {
  cabin: CabinId
  checkIn: string
  checkOut: string
  adults: number
  children: number
  addons: string[]
  name: string
  phone: string
  email?: string
  notes?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'completed'

export interface QuoteLine {
  label: string
  amount: number
  kind: 'room' | 'extra' | 'addon' | 'tax'
}

export interface Quote {
  nights: number
  nightly: { date: string; rate: number }[]
  lines: QuoteLine[]
  subtotal: number
  tax: number
  total: number
  errors: string[]
}

export interface Booking {
  ref: string
  createdAt: string
  updatedAt: string
  status: BookingStatus
  cabin: CabinId
  stayName: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  addons: string[]
  name: string
  phone: string
  email: string
  notes: string
  adminNotes: string
  quote: Quote
  total: number
  source: string
}

export interface Block {
  id: number
  cabin: CabinId
  /** first blocked night (inclusive) */
  from: string
  /** day after the last blocked night (exclusive, like a check-out date) */
  to: string
  units: number
  reason: string
}

/** remaining rooms per cabin for a date range */
export type Availability = Record<CabinId, number>

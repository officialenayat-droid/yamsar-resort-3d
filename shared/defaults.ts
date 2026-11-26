import type { PublicConfig } from './types.ts'

/**
 * Seed content for a fresh database, and the website's offline fallback.
 * Room names, prices, sizes, facilities, check-in/out, pets policy and contact
 * details come from the official site (yamsarresort.in, read Nov 2026).
 * Values marked VERIFY were not stated there — edit them in /admin.
 */
const ROOM_FACILITIES = ['Private balcony', 'Breakfast included', 'Room heating & free Wi-Fi', 'Shower & bathtub, towel warmer', 'Flat-screen TV, kettle & writing desk']

export const DEFAULT_CONFIG: PublicConfig = {
  stays: [
    {
      id: 'aframe',
      name: 'Yamsar Suite',
      short: 'Yamsar Suite',
      tagline: 'Warm wooden interiors, big windows and the mountains filling the view.',
      rate: 15000,
      weekendRate: null,
      seasons: [],
      sleeps: 2, // VERIFY: official site lists a double bed but no capacity
      size: '50 m²',
      view: 'Mountain view',
      features: ['Double bed', ...ROOM_FACILITIES],
      units: 1, // VERIFY: site says 5 rooms in total but not how many of each
      active: true,
    },
    {
      id: 'riverfront',
      name: 'Chinar Premium Suite',
      short: 'Chinar Suite',
      tagline: 'A spacious retreat where indulgence meets Himalayan quiet.',
      rate: 10000,
      weekendRate: null,
      seasons: [],
      sleeps: 4, // VERIFY: official site lists 2 beds but no capacity
      size: '50 m²',
      view: 'Valley & garden view',
      features: ['2 beds', ...ROOM_FACILITIES],
      units: 2, // VERIFY
      active: true,
    },
    {
      id: 'glacier',
      name: 'Alpine Deluxe Room',
      short: 'Alpine Deluxe',
      tagline: 'Comfortable, cosy and close to nature.',
      rate: 7000,
      weekendRate: null,
      seasons: [],
      sleeps: 3, // VERIFY
      size: '50 m²',
      view: 'Mountain view',
      features: ['2 beds', ...ROOM_FACILITIES],
      units: 2, // VERIFY
      active: true,
    },
  ],
  addons: [
    { id: 'trek', name: 'Yamsar & Khaymsar lakes guided trek', note: 'Full-day alpine lake trek with a local guide & packed lunch', price: 3800, per: 'adult', active: true },
    { id: 'wazwan', name: 'Riverside Wazwan dinner', note: 'A traditional multi-course Kashmiri Wazwan', price: 2900, per: 'guest', active: true },
    { id: 'transfer', name: 'Srinagar airport transfer', note: 'Private car, both ways', price: 6500, per: 'stay', active: true },
  ],
  settings: {
    resortName: 'The Yamsar Resort',
    tagline: 'A tranquil haven where luxury meets nature in the heart of Sonamarg.',
    phone: '+91 78895 04310',
    whatsapp: '917889504310',
    email: 'yamsarresort@gmail.com',
    address: 'Kullan, Sonamarg, Jammu & Kashmir 191202',
    instagram: 'https://www.instagram.com/yamsarresort',
    facebook: 'https://www.facebook.com/yamsarresort',
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
    petsAllowed: true,
    breakfastIncluded: true,
    policies: 'Check-in from 2:00 PM, check-out by 11:00 AM. Pets are welcome. Breakfast is included with every room.',
    bookingMode: 'request',
    minNights: 1,
    maxNights: 21,
    maxAdvanceDays: 365,
    extraGuestFee: 2500,
    maxExtraGuests: 1,
    // India GST on hotel stays (from 22 Sep 2025): 5% up to ₹7,500/night, 18% above. VERIFY with your CA.
    gst: { roomThreshold: 7500, roomLowRate: 5, roomHighRate: 18, addonRate: 18 },
    confirmationNote: 'Our team will call or WhatsApp you within a few hours to confirm your stay.',
    notifyEmails: 'yamsarresort@gmail.com',
    emailGuests: true,
  },
}

import { createRequire as __cr } from "node:module";
__cr(import.meta.url);
// shared/defaults.ts
/**
* Seed content for a fresh database, and the website's offline fallback.
* Room names, prices, sizes, facilities, check-in/out, pets policy and contact
* details come from the official site (yamsarresort.in, read Nov 2026).
* Values marked VERIFY were not stated there — edit them in /admin.
*/
const ROOM_FACILITIES = [
	"Private balcony",
	"Breakfast included",
	"Room heating & free Wi-Fi",
	"Shower & bathtub, towel warmer",
	"Flat-screen TV, kettle & writing desk"
];
const DEFAULT_CONFIG = {
	stays: [
		{
			id: "aframe",
			name: "Yamsar Suite",
			short: "Yamsar Suite",
			tagline: "Warm wooden interiors, big windows and the mountains filling the view.",
			rate: 15e3,
			weekendRate: null,
			seasons: [],
			sleeps: 2,
			size: "50 m²",
			view: "Mountain view",
			features: ["Double bed", ...ROOM_FACILITIES],
			units: 1,
			active: true
		},
		{
			id: "riverfront",
			name: "Chinar Premium Suite",
			short: "Chinar Suite",
			tagline: "A spacious retreat where indulgence meets Himalayan quiet.",
			rate: 1e4,
			weekendRate: null,
			seasons: [],
			sleeps: 4,
			size: "50 m²",
			view: "Valley & garden view",
			features: ["2 beds", ...ROOM_FACILITIES],
			units: 2,
			active: true
		},
		{
			id: "glacier",
			name: "Alpine Deluxe Room",
			short: "Alpine Deluxe",
			tagline: "Comfortable, cosy and close to nature.",
			rate: 7e3,
			weekendRate: null,
			seasons: [],
			sleeps: 3,
			size: "50 m²",
			view: "Mountain view",
			features: ["2 beds", ...ROOM_FACILITIES],
			units: 2,
			active: true
		}
	],
	addons: [
		{
			id: "trek",
			name: "Yamsar & Khaymsar lakes guided trek",
			note: "Full-day alpine lake trek with a local guide & packed lunch",
			price: 3800,
			per: "adult",
			active: true
		},
		{
			id: "wazwan",
			name: "Riverside Wazwan dinner",
			note: "A traditional multi-course Kashmiri Wazwan",
			price: 2900,
			per: "guest",
			active: true
		},
		{
			id: "transfer",
			name: "Srinagar airport transfer",
			note: "Private car, both ways",
			price: 6500,
			per: "stay",
			active: true
		}
	],
	settings: {
		resortName: "The Yamsar Resort",
		tagline: "A tranquil haven where luxury meets nature in the heart of Sonamarg.",
		phone: "+91 78895 04310",
		whatsapp: "917889504310",
		email: "yamsarresort@gmail.com",
		address: "Kullan, Sonamarg, Jammu & Kashmir 191202",
		instagram: "https://www.instagram.com/yamsarresort",
		facebook: "https://www.facebook.com/yamsarresort",
		checkInTime: "2:00 PM",
		checkOutTime: "11:00 AM",
		petsAllowed: true,
		breakfastIncluded: true,
		policies: "Check-in from 2:00 PM, check-out by 11:00 AM. Pets are welcome. Breakfast is included with every room.",
		bookingMode: "request",
		minNights: 1,
		maxNights: 21,
		maxAdvanceDays: 365,
		extraGuestFee: 2500,
		maxExtraGuests: 1,
		gst: {
			roomThreshold: 7500,
			roomLowRate: 5,
			roomHighRate: 18,
			addonRate: 18
		},
		confirmationNote: "Our team will call or WhatsApp you within a few hours to confirm your stay.",
		notifyEmails: "yamsarresort@gmail.com",
		emailGuests: true
	}
};
// shared/pricing.ts
const DAY = 864e5;
/** Parse YYYY-MM-DD as a UTC midnight timestamp (NaN if malformed). */
function parseDay(s) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
	const [y, m, d] = s.split("-").map(Number);
	const t = Date.UTC(y, m - 1, d);
	const back = new Date(t);
	return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? t : NaN;
}
const fmtDay = (t) => new Date(t).toISOString().slice(0, 10);
const addDaysISO = (s, n) => fmtDay(parseDay(s) + n * DAY);
/** Every night of a stay: [checkIn, checkOut) */
function nightsBetween(checkIn, checkOut) {
	const a = parseDay(checkIn);
	const b = parseDay(checkOut);
	if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return [];
	const out = [];
	for (let t = a; t < b && out.length < 400; t += DAY) out.push(fmtDay(t));
	return out;
}
/** Nightly rate: seasonal rate wins, then weekend (Fri/Sat night) rate, then base. */
function rateForNight(stay, date) {
	const season = stay.seasons.find((s) => s.from <= date && date <= s.to);
	if (season) return season.rate;
	const dow = new Date(parseDay(date)).getUTCDay();
	if (stay.weekendRate && (dow === 5 || dow === 6)) return stay.weekendRate;
	return stay.rate;
}
const roundRupee = (n) => Math.round(n);
/**
* Price a stay. Used live in the browser AND authoritatively on the server,
* so totals always match. `today` is YYYY-MM-DD in the resort's timezone.
*/
function quote(input, cfg, today) {
	const errors = [];
	const s = cfg.settings;
	const stay = cfg.stays.find((x) => x.id === input.cabin);
	const nightsList = nightsBetween(input.checkIn, input.checkOut);
	const nights = nightsList.length;
	const empty = {
		nights,
		nightly: [],
		lines: [],
		subtotal: 0,
		tax: 0,
		total: 0,
		errors
	};
	if (!stay) {
		errors.push("Please choose a room.");
		return empty;
	}
	if (!stay.active) errors.push(`${stay.name} is not open for booking right now.`);
	if (Number.isNaN(parseDay(input.checkIn)) || Number.isNaN(parseDay(input.checkOut))) errors.push("Please choose valid dates.");
	else if (nights < 1) errors.push("Check-out must be at least one night after check-in.");
	if (input.checkIn < today) errors.push("Check-in can’t be in the past.");
	if (nights > 0 && nights < s.minNights) errors.push(`The minimum stay is ${s.minNights} nights.`);
	if (nights > s.maxNights) errors.push(`For stays longer than ${s.maxNights} nights, please contact us directly.`);
	if (input.checkIn > addDaysISO(today, s.maxAdvanceDays)) errors.push(`We take bookings up to ${s.maxAdvanceDays} days ahead.`);
	if (input.adults < 1) errors.push("At least one adult is required.");
	const guests = input.adults + input.children;
	const extraGuests = Math.max(0, guests - stay.sleeps);
	if (extraGuests > s.maxExtraGuests) errors.push(`${stay.name} sleeps ${stay.sleeps}${s.maxExtraGuests ? ` (+${s.maxExtraGuests} with extra bedding)` : ""}. Please choose a larger room or book two.`);
	const nightly = nightsList.map((date) => ({
		date,
		rate: rateForNight(stay, date)
	}));
	const lines = [];
	const roomTotal = nightly.reduce((a, n) => a + n.rate, 0);
	const uniform = nightly.every((n) => n.rate === nightly[0]?.rate);
	lines.push({
		kind: "room",
		label: uniform && nights ? `${stay.name} · ${nights} night${nights === 1 ? "" : "s"} × ₹${nightly[0].rate.toLocaleString("en-IN")}` : `${stay.name} · ${nights} night${nights === 1 ? "" : "s"}`,
		amount: roomTotal
	});
	const extraTotal = extraGuests * s.extraGuestFee * nights;
	if (extraGuests && s.extraGuestFee) lines.push({
		kind: "extra",
		label: `Extra bedding · ${extraGuests} guest${extraGuests > 1 ? "s" : ""} × ${nights} night${nights === 1 ? "" : "s"}`,
		amount: extraTotal
	});
	let addonTotal = 0;
	for (const id of input.addons) {
		const a = cfg.addons.find((x) => x.id === id);
		if (!a || !a.active) {
			errors.push("One of the selected experiences is no longer available.");
			continue;
		}
		const qty = a.per === "adult" ? input.adults : a.per === "guest" ? guests : a.per === "night" ? nights : 1;
		const amount = a.price * qty;
		addonTotal += amount;
		lines.push({
			kind: "addon",
			label: `${a.name}${qty > 1 ? ` × ${qty}` : ""}`,
			amount
		});
	}
	const g = s.gst;
	const perNightExtra = extraGuests * s.extraGuestFee;
	const roomTax = {};
	for (const n of nightly) {
		const tariff = n.rate + perNightExtra;
		const pct = tariff <= g.roomThreshold ? g.roomLowRate : g.roomHighRate;
		roomTax[pct] = (roomTax[pct] ?? 0) + tariff * pct / 100;
	}
	let tax = 0;
	for (const [pct, amt] of Object.entries(roomTax)) {
		if (Number(pct) === 0) continue;
		const v = roundRupee(amt);
		tax += v;
		lines.push({
			kind: "tax",
			label: `GST on room (${pct}%)`,
			amount: v
		});
	}
	if (addonTotal && g.addonRate) {
		const v = roundRupee(addonTotal * g.addonRate / 100);
		tax += v;
		lines.push({
			kind: "tax",
			label: `GST on experiences (${g.addonRate}%)`,
			amount: v
		});
	}
	const subtotal = roomTotal + extraTotal + addonTotal;
	return {
		nights,
		nightly,
		lines,
		subtotal,
		tax,
		total: subtotal + tax,
		errors
	};
}
/** Today's date in India (the resort's timezone) as YYYY-MM-DD. */
function todayIST(now = Date.now()) {
	return fmtDay(now + 198e5);
}
const inr = (n) => new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0
}).format(n);
// shared/types.ts
const CABIN_IDS = [
	"aframe",
	"riverfront",
	"glacier"
];
// server/store.ts
/**
* Storage interface used by the API. Three implementations:
*   store-mysql.ts    – MySQL / MariaDB (Hostinger, production)
*   store-sqlite.ts   – Node's built-in SQLite (local dev)
*   store-postgres.ts – Postgres (optional, e.g. Supabase)
*/
const ACTIVE_STATUSES = [
	"pending",
	"confirmed",
	"checked_in"
];
/** Seed config on first run. */
async function seed(store) {
	if (!await store.getKV("stays", null)) await store.setKV("stays", DEFAULT_CONFIG.stays);
	if (!await store.getKV("addons", null)) await store.setKV("addons", DEFAULT_CONFIG.addons);
	if (!await store.getKV("settings", null)) await store.setKV("settings", DEFAULT_CONFIG.settings);
}
async function getConfig(store) {
	const [savedSettings, stays, addons] = await Promise.all([
		store.getKV("settings", {}),
		store.getKV("stays", DEFAULT_CONFIG.stays),
		store.getKV("addons", DEFAULT_CONFIG.addons)
	]);
	const settings = {
		...DEFAULT_CONFIG.settings,
		...savedSettings
	};
	settings.gst = {
		...DEFAULT_CONFIG.settings.gst,
		...settings.gst
	};
	return {
		stays: CABIN_IDS.map((id) => ({
			...DEFAULT_CONFIG.stays.find((s) => s.id === id),
			...stays.find((s) => s.id === id)
		})),
		addons,
		settings
	};
}
/** Rooms left for every cabin across [checkIn, checkOut). */
async function availability(store, checkIn, checkOut, excludeRef) {
	const [cfg, bookings, blocks] = await Promise.all([
		getConfig(store),
		store.activeBookingsBetween(checkIn, checkOut),
		store.blocksBetween(checkIn, checkOut)
	]);
	const nights = nightsBetween(checkIn, checkOut);
	const out = {};
	for (const stay of cfg.stays) {
		let min = stay.units;
		for (const d of nights) {
			let used = 0;
			for (const b of bookings) if (b.cabin === stay.id && b.ref !== excludeRef && b.checkIn <= d && d < b.checkOut) used++;
			for (const k of blocks) if (k.cabin === stay.id && k.from <= d && d < k.to) used += k.units;
			min = Math.min(min, stay.units - used);
		}
		out[stay.id] = Math.max(0, min);
	}
	return out;
}
export { CABIN_IDS as a, parseDay as c, seed as i, quote as l, availability as n, addDaysISO as o, getConfig as r, inr as s, ACTIVE_STATUSES as t, todayIST as u };

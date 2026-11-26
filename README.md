# The Yamsar Resort website

The 3D storybook site, plus a small booking server and admin dashboard. It all runs as one Node process.

## Run locally

Needs Node 22.18 or newer. The database uses Node's built-in SQLite, so there's nothing native to install.

```bash
npm install
npm run api      # booking server on :8787 (restarts on change)
npm run dev      # website on :5173 (proxies /api to the server)
```

- Website: http://localhost:5173
- Admin: http://localhost:5173/admin

On first run the server prints a generated admin password. To use your own, set `ADMIN_PASSWORD` in `.env` (copy `.env.example`).

## Production

```bash
npm run build
npm start        # serves the built site, /admin and /api on $PORT (default 8787)
```

Deploy it on any host that runs a long-lived Node process: a VPS, Railway, Render or Fly. It needs a **persistent disk** for `data/yamsar.db`. Back that file up; it holds every booking.

Behind nginx or a platform proxy, set `TRUST_PROXY=1` so rate limiting sees real visitor IPs.

## Email notifications

Set these in `.env` and restart. `.env.example` has the full list.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yamsarresort@gmail.com
SMTP_PASS=<Gmail App Password>
SITE_URL=https://yamsarresort.in
```

For Gmail, turn on 2-Step Verification for the account. Then create an **App Password** at https://myaccount.google.com/apppasswords and use it as `SMTP_PASS`. Your normal Gmail password won't work.

Once set up, emails go out as follows:

- **Staff** get an alert for every new booking. Choose the addresses in Admin → Settings → Email notifications. Hitting Reply goes to the guest.
- **Guests** who give an email get a receipt, then another email when you confirm or cancel. You can switch this off.
- **If sending fails**, the booking still goes through. The error is shown in Admin → Settings, and **Send test email** checks the setup.

## What the admin can change

| Tab | What |
|---|---|
| Overview | Pending requests, arrivals, guests in house, rooms free tonight |
| Bookings | Search and filter, confirm, check in or out, cancel or restore, private notes, call or WhatsApp the guest (pre-filled message), CSV export |
| Rooms & rates | Name, description, nightly rate, Fri/Sat rate, seasonal rates, capacity, number of rooms, features, open/hidden |
| Experiences | Add-ons guests can pick (price per adult, guest, night or stay) |
| Blocked dates | Close rooms for repairs, or for bookings taken by phone or OTA, so the site never double-books |
| Settings | Request vs instant mode, min/max nights, extra-bed fee, GST slabs, check-in/out times, policies, contact details, admin password |

Prices are always recalculated on the server (`shared/pricing.ts`), so a guest can't alter a total.
No payment is taken online. Guests pay at the resort.

## Content sources

Room names, base prices, sizes, facilities, check-in/out times, the pets policy and contact details come from yamsarresort.in.
Guest capacity and the number of rooms per type were **not stated** there. They're marked `VERIFY` in `shared/defaults.ts`. Correct them in the admin.

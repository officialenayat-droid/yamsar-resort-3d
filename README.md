# The Yamsar Resort website

The 3D storybook site, plus a small booking API and admin dashboard. Locally it runs as one Node process; in production it runs on Vercel and Supabase.

## Run locally

Needs Node 22.18 or newer. The database uses Node's built-in SQLite, so there's nothing native to install.

```bash
npm install
npm run api      # booking API on :8787 with local SQLite (restarts on change)
npm run dev      # website on :5173 (proxies /api to the server)
```

- Website: http://localhost:5173
- Admin: http://localhost:5173/admin

On first run the server prints a generated admin password. To use your own, set `ADMIN_PASSWORD` in `.env` (copy `.env.example`).

## Production

The same API code runs in two places:

| | Storage | Entry point |
|---|---|---|
| **Vercel + Supabase** (recommended) | Supabase Postgres (`website` schema) | `supabase/functions/api/index.ts` (Edge Function) |
| Single Node server (VPS) | SQLite file `data/yamsar.db` | `server/node.ts` → `npm run build && npm start` |

**Vercel + Supabase setup**

1. Apply `supabase/migrations/*.sql` to the Supabase project.
2. Deploy the `api` Edge Function with JWT verification **off**. The app does its own admin auth.
3. Add Edge Function secrets: `ADMIN_PASSWORD` (first login only), and optionally `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `SITE_URL`.
4. In `vercel.json`, replace `SUPABASE_PROJECT_REF` with the project ref. Then import the GitHub repo in Vercel; every push to `main` redeploys.

`ADMIN_PASSWORD` only sets the **first** password. After that, change it in Admin → Settings. To force a reset, set `ADMIN_PASSWORD_RESET=1` together with a new `ADMIN_PASSWORD`, log in once, then remove the reset flag.

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

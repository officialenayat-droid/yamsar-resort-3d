# The Yamsar Resort website

The 3D storybook site, plus a small booking API and admin dashboard, all served by one Node app. In production it runs on **Hostinger** (Node.js web app + MySQL).

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

## Deploy to Hostinger

Needs a **Business** or **Cloud** hosting plan; those include Node.js web apps and MySQL.

### 1. Create the database
hPanel → **Websites → Manage → Databases → Add database**.
Choose a name, user and strong password, and note all three. Hostinger adds a prefix such as `u123456789_`.
The app creates its own tables on first start: `ymr_kv`, `ymr_bookings` and `ymr_blocks`. Nothing to import.

### 2. Add the Node.js app
hPanel → **Websites → Add website → Node.js web app → GitHub**. Then pick `officialenayat-droid/yamsar-resort-3d`, branch `main`.

| Setting | Value |
|---|---|
| Application type | **Hono** (or Other) |
| Root directory | *(empty)* |
| Build script | **build** (default; if a dropdown appears, `build` or `build:hostinger` both work) |
| Output directory | *(empty)* |
| Entry file | **build/server.mjs** |
| Node.js version | **22** (or 24) |
| Package manager | npm |

### 3. Environment variables
Add these, or use **Import .env**. `.env.example` lists them all.

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u123456789_yamsar
DB_USER=u123456789_yamsar
DB_PASSWORD=<database password>
ADMIN_PASSWORD=<first admin password>
SITE_URL=https://yamsarresort.in
```

Use `127.0.0.1`, not `localhost`, as Hostinger requires. Add the `SMTP_*` variables too if you want email (see below).
Hostinger may list other variable names it found in the code, such as `DATABASE_URL` or `DB_PATH`. Leave those out or delete them; they're optional.

### 4. Deploy and check
Click **Deploy**. When it's green:
- Open the site. Then go to `/admin` and sign in with `ADMIN_PASSWORD`. Change the password under Settings.
- Make a test booking, and confirm it appears in Admin → Bookings.

Every push to `main` redeploys. Bookings live in MySQL, so they survive redeploys; Hostinger wipes the app folder each time. Back up the database from hPanel regularly.

### Going live on yamsarresort.in
Hostinger's Node.js flow needs the domain to be free: *"If the domain … is already added to your hosting plan, remove that website first."*
1. Deploy to Hostinger's **temporary domain** or a **subdomain** first (e.g. `new.yamsarresort.in`) and test everything.
2. **Back up the current WordPress site** (hPanel → Backups, or a plugin export).
3. Remove the WordPress website from the plan, then add the Node.js app on `yamsarresort.in` and set `SITE_URL` to it.

### Other hosts
`npm run build:hostinger && node build/server.mjs` runs anywhere with Node 22+. That covers a VPS, Railway or Render.
Storage is picked from the environment:

| Environment | Storage |
|---|---|
| `DB_HOST` + `DB_NAME`, or `DATABASE_URL=mysql://…` | MySQL / MariaDB |
| `DATABASE_URL=postgres://…` | Postgres (apply `db/postgres-schema.sql` first) |
| neither | SQLite file at `DB_PATH` (needs a persistent disk) |

`ADMIN_PASSWORD` only sets the **first** password. After that, change it in Admin → Settings. To force a reset, set `ADMIN_PASSWORD_RESET=1` together with a new `ADMIN_PASSWORD`, sign in once, then remove the reset flag.

## Email notifications

Add these to the app's environment variables (locally: `.env`). `.env.example` has the full list.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yamsarresort@gmail.com
SMTP_PASS=<Gmail App Password>
SITE_URL=https://yamsarresort.in
```

For Gmail, turn on 2-Step Verification for the account. Then create an **App Password** at https://myaccount.google.com/apppasswords and use it as `SMTP_PASS`. Your normal Gmail password won't work.
If you have Hostinger email for the domain, you can use `SMTP_HOST=smtp.hostinger.com`, port `465`, with that mailbox's address and password instead.

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

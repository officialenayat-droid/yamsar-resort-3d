// Supabase Edge Function "api": the booking & admin API in production.
// Deploy with verify_jwt = false (the app does its own admin auth).
// Secrets: ADMIN_PASSWORD (first login), optional SMTP_* / MAIL_FROM / SITE_URL.
import { createApp } from '../../../server/app.ts'
import { createPostgresStore } from '../../../server/store-postgres.ts'

const dbUrl = Deno.env.get('SUPABASE_DB_URL')
if (!dbUrl) throw new Error('SUPABASE_DB_URL is not set')

const app = createApp(createPostgresStore(dbUrl))
Deno.serve(app.fetch)

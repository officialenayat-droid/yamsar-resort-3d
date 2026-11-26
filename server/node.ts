/**
 * Node entry. Serves the API and the built site.
 *   Local dev:   npm run api            (SQLite in ./data)
 *   Production:  npm run build → node build/server.mjs   (Hostinger entry file: build/server.mjs)
 *
 * Storage is chosen from the environment:
 *   DB_HOST/DB_NAME… or DATABASE_URL=mysql://…   → MySQL / MariaDB (Hostinger)
 *   DATABASE_URL=postgres://…                    → Postgres (e.g. Supabase)
 *   otherwise                                    → SQLite file (DB_PATH, default data/yamsar.db)
 */
import './env.ts'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.ts'
import type { Store } from './store.ts'

async function createStore(): Promise<{ store: Store; kind: string }> {
  const env = process.env
  const url = env.DATABASE_URL ?? ''
  if (url.startsWith('mysql') || (env.DB_HOST && env.DB_NAME)) {
    const { createMysqlStore } = await import('./store-mysql.ts')
    return { store: createMysqlStore(env), kind: `MySQL (${env.DB_NAME ?? 'DATABASE_URL'})` }
  }
  if (url.startsWith('postgres')) {
    const { createPostgresStore } = await import('./store-postgres.ts')
    return { store: createPostgresStore(url), kind: 'Postgres' }
  }
  const { createSqliteStore } = await import('./store-sqlite.ts')
  return { store: createSqliteStore(), kind: `SQLite (${env.DB_PATH ?? 'data/yamsar.db'})` }
}

const { store, kind } = await createStore()
const app = createApp(store)

// the built site sits next to this file's parent: <root>/dist  (works from server/ and build/)
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const hasDist = existsSync(resolve(dist, 'index.html'))
if (hasDist) {
  const root = relative(process.cwd(), dist) || '.'
  const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
  const page = () => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } })
  app.get('/', page)
  app.use('/assets/*', serveStatic({ root, onFound: (_p, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable') }))
  app.use('*', serveStatic({ root }))
  // SPA fallback (/admin etc.); unknown /assets/* files stay 404
  app.get('*', (c) => (c.req.path.startsWith('/assets/') ? c.notFound() : page()))
}

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.log(`Yamsar Resort on port ${port} · storage: ${kind}${hasDist ? ' · serving site' : ''}`))

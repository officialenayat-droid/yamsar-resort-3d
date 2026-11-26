/**
 * Node entry: SQLite storage + serves the built site from ./dist.
 *   npm run api   (dev, auto-restart)   ·   npm start   (production on a single server)
 */
import './env.ts'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp } from './app.ts'
import { createSqliteStore } from './store-sqlite.ts'

const app = createApp(createSqliteStore())

const dist = resolve('dist')
if (existsSync(dist)) {
  app.use('/assets/*', serveStatic({ root: './dist' }))
  app.use('*', serveStatic({ root: './dist', index: '' }))
  const html = () => readFileSync(resolve(dist, 'index.html'), 'utf8')
  app.get('*', (c) => (c.req.path.startsWith('/assets/') ? c.notFound() : c.html(html())))
}

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.log(`Yamsar booking API on http://localhost:${port}${existsSync(dist) ? ' (serving ./dist)' : ''}`))

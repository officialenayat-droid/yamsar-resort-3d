import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { getKV, setKV } from './db.ts'

interface AuthRecord {
  salt: string
  hash: string
  secret: string
}

const SESSION_HOURS = 12

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex')
}

/** Set up the admin password on boot. ADMIN_PASSWORD (env) always wins; otherwise one is generated once. */
export function initAuth() {
  let rec = getKV<AuthRecord | null>('auth', null)
  const envPw = process.env.ADMIN_PASSWORD
  if (!rec) {
    const salt = randomBytes(16).toString('hex')
    const password = envPw || randomBytes(9).toString('base64url')
    rec = { salt, hash: hashPassword(password, salt), secret: randomBytes(32).toString('hex') }
    setKV('auth', rec)
    if (!envPw) {
      console.log('\n  ┌──────────────────────────────────────────────────────────┐')
      console.log(`  │  Admin password (first run): ${password.padEnd(28)}│`)
      console.log('  │  Change it in /admin → Settings, or set ADMIN_PASSWORD.  │')
      console.log('  └──────────────────────────────────────────────────────────┘\n')
    }
  } else if (envPw && hashPassword(envPw, rec.salt) !== rec.hash) {
    rec = { ...rec, hash: hashPassword(envPw, rec.salt) }
    setKV('auth', rec)
  }
}

export function checkPassword(password: string) {
  const rec = getKV<AuthRecord | null>('auth', null)
  if (!rec) return false
  const a = Buffer.from(hashPassword(password, rec.salt), 'hex')
  const b = Buffer.from(rec.hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function setPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  // rotating the secret also signs out every other session
  setKV('auth', { salt, hash: hashPassword(password, salt), secret: randomBytes(32).toString('hex') })
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url')

export function issueToken() {
  const rec = getKV<AuthRecord>('auth', { salt: '', hash: '', secret: '' })
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_HOURS * 3600000 })).toString('base64url')
  return `${payload}.${sign(payload, rec.secret)}`
}

export function verifyToken(token: string | undefined) {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const rec = getKV<AuthRecord | null>('auth', null)
  if (!rec) return false
  const expected = sign(payload, rec.secret)
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number }
    return Date.now() < exp
  } catch {
    return false
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'Please sign in again.' })
    return
  }
  next()
}

/** Tiny in-memory fixed-window rate limiter. */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>()
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const h = hits.get(key)
    if (!h || now > h.reset) hits.set(key, { n: 1, reset: now + windowMs })
    else if (++h.n > max) {
      res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' })
      return
    }
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k)
    next()
  }
}

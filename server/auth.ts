import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import type { Store } from './store.ts'

interface AuthRecord {
  salt: string
  hash: string
  secret: string
}

const SESSION_HOURS = 12
const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 64).toString('hex')

/**
 * First run only: set the admin password from ADMIN_PASSWORD, or generate one and log it.
 * After that the password is managed in /admin → Settings (env changes are ignored),
 * unless ADMIN_PASSWORD_RESET=1 is set, which forces the env password again.
 */
export async function initAuth(store: Store) {
  const rec = await store.getKV<AuthRecord | null>('auth', null)
  const envPw = process.env.ADMIN_PASSWORD
  if (rec && !(envPw && process.env.ADMIN_PASSWORD_RESET === '1')) return
  const salt = randomBytes(16).toString('hex')
  const password = envPw || randomBytes(9).toString('base64url')
  await store.setKV('auth', { salt, hash: hashPassword(password, salt), secret: randomBytes(32).toString('hex') })
  if (!envPw) {
    console.log('\n  ┌──────────────────────────────────────────────────────────┐')
    console.log(`  │  Admin password (first run): ${password.padEnd(28)}│`)
    console.log('  │  Change it in /admin → Settings.                         │')
    console.log('  └──────────────────────────────────────────────────────────┘\n')
  }
}

export async function checkPassword(store: Store, password: string) {
  const rec = await store.getKV<AuthRecord | null>('auth', null)
  if (!rec) return false
  const a = Buffer.from(hashPassword(password, rec.salt), 'hex')
  const b = Buffer.from(rec.hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function setPassword(store: Store, password: string) {
  const salt = randomBytes(16).toString('hex')
  // rotating the secret also signs out every other session
  await store.setKV('auth', { salt, hash: hashPassword(password, salt), secret: randomBytes(32).toString('hex') })
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url')

export async function issueToken(store: Store) {
  const rec = await store.getKV<AuthRecord | null>('auth', null)
  if (!rec) throw new Error('Auth not initialised')
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_HOURS * 3600000 })).toString('base64url')
  return `${payload}.${sign(payload, rec.secret)}`
}

export async function verifyToken(store: Store, token: string | undefined) {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const rec = await store.getKV<AuthRecord | null>('auth', null)
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

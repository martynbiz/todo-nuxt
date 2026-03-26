import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { getDb } from '../db'
import type { H3Event } from 'h3'

const scryptAsync = promisify(scrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedHash = (await scryptAsync(password, salt, 64)) as Buffer
  return timingSafeEqual(hashBuffer, derivedHash)
}

export async function createSession(userId: string): Promise<string> {
  const sql = getDb()
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${userId}, ${expiresAt})`
  return id
}

export async function getSessionUser(event: H3Event): Promise<{ id: string; name: string; email: string; theme: string } | null> {
  const sessionId = getCookie(event, 'session')
  if (!sessionId) return null
  const sql = getDb()
  const [row] = await sql`
    SELECT u.id, u.name, u.email, u.theme FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `
  return row ? { id: row.id, name: row.name, email: row.email, theme: row.theme } : null
}

export async function deleteSession(event: H3Event): Promise<void> {
  const sessionId = getCookie(event, 'session')
  if (!sessionId) return
  const sql = getDb()
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`
}

export function setSessionCookie(event: H3Event, sessionId: string): void {
  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

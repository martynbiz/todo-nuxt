import { hashPassword, createSession, setSessionCookie } from '../../utils/auth'
import { getDb } from '../../db'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default defineEventHandler(async (event) => {
  const { name, email, password } = await readBody(event)

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, message: 'Name, email and password are required' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const sql = getDb()
  const id = uid()
  const normalizedEmail = email.toLowerCase().trim()
  const passwordHash = await hashPassword(password)

  try {
    await sql`INSERT INTO users (id, name, email, password_hash) VALUES (${id}, ${name.trim()}, ${normalizedEmail}, ${passwordHash})`
  } catch (e: any) {
    if (e.code === '23505') {
      throw createError({ statusCode: 409, message: 'An account with that email already exists' })
    }
    throw e
  }

  const sessionId = await createSession(id)
  setSessionCookie(event, sessionId)
  return { id, name: name.trim(), email: normalizedEmail, theme: 'dark' }
})

import { verifyPassword, createSession, setSessionCookie } from '../../utils/auth'
import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const sql = getDb()
  const [user] = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const sessionId = await createSession(user.id)
  setSessionCookie(event, sessionId)
  return { id: user.id, name: user.name, email: user.email, theme: user.theme }
})

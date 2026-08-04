import { randomBytes } from 'crypto'
import { getDb } from '../db'

export default defineEventHandler(async (event) => {
  const sql = getDb()
  let [user] = await sql`SELECT * FROM users WHERE email = 'dev-test@example.com'`
  if (!user) {
    const id = randomBytes(16).toString('hex')
    ;[user] = await sql`
      INSERT INTO users (id, email, entra_id, name, password_hash)
      VALUES (${id}, 'dev-test@example.com', 'dev-test-entra', 'Dev Test', NULL)
      RETURNING *
    `
  }
  await setUserSession(event, {
    user: { id: user.id, name: user.name, email: user.email, theme: user.theme },
  })
  return sendRedirect(event, '/')
})

import { verifyPassword, hashPassword } from '../../utils/auth'
import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { currentPassword, newPassword } = await readBody(event)

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
  }

  const sql = getDb()
  const [row] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`

  if (!(await verifyPassword(currentPassword, row.password_hash))) {
    throw createError({ statusCode: 401, message: 'Current password is incorrect' })
  }

  const hash = await hashPassword(newPassword)
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`

  return { ok: true }
})

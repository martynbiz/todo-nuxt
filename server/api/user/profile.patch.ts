import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { name, email } = await readBody(event)
  const sql = getDb()

  if (email) {
    const normalised = email.toLowerCase().trim()
    const [existing] = await sql`SELECT id FROM users WHERE email = ${normalised} AND id != ${user.id}`
    if (existing) throw createError({ statusCode: 409, message: 'Email already in use' })
  }

  const [updated] = await sql`
    UPDATE users
    SET
      name  = COALESCE(${name?.trim()  ?? null}, name),
      email = COALESCE(${email ? email.toLowerCase().trim() : null}, email)
    WHERE id = ${user.id}
    RETURNING id, name, email
  `

  return updated
})

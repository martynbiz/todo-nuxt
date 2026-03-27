import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { name } = await readBody(event)
  const sql = getDb()

  const [updated] = await sql`
    UPDATE users
    SET name = COALESCE(${name?.trim() ?? null}, name)
    WHERE id = ${user.id}
    RETURNING id, name, email
  `

  const session = await getUserSession(event)
  await setUserSession(event, { user: { ...session.user, name: updated.name } })

  return updated
})

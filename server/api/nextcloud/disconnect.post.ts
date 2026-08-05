import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sql = getDb()
  await sql`DELETE FROM nextcloud_connections WHERE user_id = ${user.id}`
  return { disconnected: true }
})

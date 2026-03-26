import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { id, label, color } = await readBody(event)
  const userId = event.context.user.id
  const sql = getDb()
  await sql`INSERT INTO tags (id, label, color, user_id) VALUES (${id}, ${label}, ${color}, ${userId})`
  return { id, label, color }
})

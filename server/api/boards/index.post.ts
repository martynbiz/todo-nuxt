import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { id, title, position } = await readBody(event)
  const userId = event.context.user.id
  const sql = getDb()
  await sql`INSERT INTO boards (id, title, position, user_id) VALUES (${id}, ${title}, ${position}, ${userId})`
  return { id, title }
})

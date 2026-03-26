import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { id, label, color } = await readBody(event)
  const sql = getDb()
  await sql`INSERT INTO tags (id, label, color) VALUES (${id}, ${label}, ${color})`
  return { id, label, color }
})

import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { id, title, position } = await readBody(event)
  const sql = getDb()
  await sql`INSERT INTO boards (id, title, position) VALUES (${id}, ${title}, ${position})`
  return { id, title }
})

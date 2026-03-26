import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const sql = getDb()
  await sql`DELETE FROM tags WHERE id = ${id}`
  return { ok: true }
})

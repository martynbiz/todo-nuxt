import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { title } = await readBody(event)
  const sql = getDb()
  await sql`UPDATE boards SET title = ${title} WHERE id = ${id}`
  return { ok: true }
})

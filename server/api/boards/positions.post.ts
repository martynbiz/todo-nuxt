import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { positions } = await readBody(event) as { positions: { id: string, position: number }[] }
  const sql = getDb()
  await Promise.all(
    positions.map(({ id, position }) => sql`UPDATE boards SET position = ${position} WHERE id = ${id}`)
  )
  return { ok: true }
})

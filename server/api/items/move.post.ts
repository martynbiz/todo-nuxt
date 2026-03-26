import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { itemId, fromBoardId, toBoardId, fromOrder, toOrder } = await readBody(event)
  const sql = getDb()

  await sql.begin(async (sql) => {
    if (fromBoardId !== toBoardId) {
      await sql`UPDATE items SET board_id = ${toBoardId} WHERE id = ${itemId}`
    }
    // Update destination board positions
    await Promise.all(
      toOrder.map((id: string, i: number) => sql`UPDATE items SET position = ${i} WHERE id = ${id}`)
    )
    // Update source board positions if different
    if (fromBoardId !== toBoardId) {
      await Promise.all(
        fromOrder.map((id: string, i: number) => sql`UPDATE items SET position = ${i} WHERE id = ${id}`)
      )
    }
  })

  return { ok: true }
})

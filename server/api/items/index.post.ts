import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const { id, boardId, title, description, tags, position, due_date } = await readBody(event)
  const sql = getDb()

  await sql.begin(async (sql) => {
    // Make room at the target position (e.g. 0 = top of board)
    await sql`UPDATE items SET position = position + 1 WHERE board_id = ${boardId} AND position >= ${position}`
    await sql`INSERT INTO items (id, board_id, title, description, position, due_date) VALUES (${id}, ${boardId}, ${title}, ${description}, ${position}, ${due_date ?? null})`

    if (tags?.length) {
      await sql`INSERT INTO item_tags ${sql(tags.map((tagId: string) => ({ item_id: id, tag_id: tagId })))}`
    }
  })

  return { id }
})

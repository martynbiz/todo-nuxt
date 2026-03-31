import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const sql = getDb()

  if (body.title !== undefined || body.description !== undefined) {
    const title = body.title
    const description = body.description
    if (title !== undefined && description !== undefined) {
      await sql`UPDATE items SET title = ${title}, description = ${description} WHERE id = ${id}`
    } else if (title !== undefined) {
      await sql`UPDATE items SET title = ${title} WHERE id = ${id}`
    } else {
      await sql`UPDATE items SET description = ${description} WHERE id = ${id}`
    }
  }

  if (body.due_date !== undefined) {
    await sql`UPDATE items SET due_date = ${body.due_date} WHERE id = ${id}`
  }

  if (body.tags !== undefined) {
    await sql`DELETE FROM item_tags WHERE item_id = ${id}`
    if (body.tags.length > 0) {
      await sql`INSERT INTO item_tags ${sql(body.tags.map((tagId: string) => ({ item_id: id, tag_id: tagId })))}`
    }
  }

  return { ok: true }
})

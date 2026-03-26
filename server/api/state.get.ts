import { getDb } from '../db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const sql = getDb()

  const [boards, items, tags, itemTags] = await Promise.all([
    sql`SELECT * FROM boards WHERE user_id = ${userId} ORDER BY position`,
    sql`
      SELECT i.* FROM items i
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${userId}
      ORDER BY i.position
    `,
    sql`SELECT * FROM tags WHERE user_id = ${userId}`,
    sql`
      SELECT it.* FROM item_tags it
      JOIN items i ON it.item_id = i.id
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${userId}
    `,
  ])

  return {
    boards: boards.map(b => ({
      id: b.id,
      title: b.title,
      items: items
        .filter(i => i.board_id === b.id)
        .map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          tags: itemTags.filter(it => it.item_id === i.id).map(it => it.tag_id),
        })),
    })),
    tags: tags.map(t => ({ id: t.id, label: t.label, color: t.color })),
  }
})

import { getDb } from '../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sql = getDb()

  const [boards, items, tags, itemTags] = await Promise.all([
    sql`SELECT id, title, position FROM boards WHERE user_id = ${user.id} ORDER BY position`,
    sql`
      SELECT i.id, i.board_id, i.title, i.description, i.position
      FROM items i
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${user.id}
      ORDER BY i.position
    `,
    sql`SELECT id, label, color FROM tags WHERE user_id = ${user.id}`,
    sql`
      SELECT it.item_id, it.tag_id FROM item_tags it
      JOIN items i ON it.item_id = i.id
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${user.id}
    `,
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    boards: boards.map(b => ({
      id: b.id,
      title: b.title,
      position: b.position,
      items: items
        .filter(i => i.board_id === b.id)
        .map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          position: i.position,
          tags: itemTags.filter(it => it.item_id === i.id).map(it => it.tag_id),
        })),
    })),
    tags: tags.map(t => ({ id: t.id, label: t.label, color: t.color })),
  }
})

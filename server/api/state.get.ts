import { getDb } from '../db'

export default defineEventHandler(async () => {
  const sql = getDb()

  const [boards, items, tags, itemTags] = await Promise.all([
    sql`SELECT * FROM boards ORDER BY position`,
    sql`SELECT * FROM items ORDER BY position`,
    sql`SELECT * FROM tags`,
    sql`SELECT * FROM item_tags`,
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

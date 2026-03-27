import { getDb } from '../db'

interface ImportItem {
  id: string; title: string; description: string; position: number; tags: string[]
}
interface ImportBoard {
  id: string; title: string; position: number; items: ImportItem[]
}
interface ImportTag {
  id: string; label: string; color: string
}
interface ImportPayload {
  version: number
  boards: ImportBoard[]
  tags: ImportTag[]
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body: ImportPayload = await readBody(event)

  if (!body || !Array.isArray(body.boards) || !Array.isArray(body.tags)) {
    throw createError({ statusCode: 400, message: 'Invalid import format' })
  }

  const sql = getDb()

  // Fetch all existing IDs up front to avoid duplicates
  const [existingBoards, existingItems, existingTags, existingItemTagRows] = await Promise.all([
    sql`SELECT id FROM boards`,
    sql`SELECT id FROM items`,
    sql`SELECT id FROM tags`,
    sql`SELECT item_id, tag_id FROM item_tags`,
  ])

  const existingBoardIds  = new Set(existingBoards.map(r => r.id as string))
  const existingItemIds   = new Set(existingItems.map(r => r.id as string))
  const existingTagIds    = new Set(existingTags.map(r => r.id as string))
  const existingItemTags  = new Set(existingItemTagRows.map(r => `${r.item_id}:${r.tag_id}`))

  let importedBoards = 0
  let importedItems  = 0
  let importedTags   = 0

  await sql.begin(async (sql) => {
    // Tags
    for (const tag of body.tags) {
      if (existingTagIds.has(tag.id)) continue
      await sql`INSERT INTO tags (id, label, color, user_id) VALUES (${tag.id}, ${tag.label}, ${tag.color}, ${user.id})`
      importedTags++
    }

    // Boards + items
    for (const board of body.boards) {
      if (!existingBoardIds.has(board.id)) {
        await sql`INSERT INTO boards (id, title, position, user_id) VALUES (${board.id}, ${board.title}, ${board.position}, ${user.id})`
        importedBoards++
      }

      for (const item of board.items) {
        if (existingItemIds.has(item.id)) continue
        await sql`INSERT INTO items (id, board_id, title, description, position) VALUES (${item.id}, ${board.id}, ${item.title}, ${item.description}, ${item.position})`
        importedItems++

        for (const tagId of item.tags) {
          const key = `${item.id}:${tagId}`
          if (existingItemTags.has(key)) continue
          // Only link tags that exist (either pre-existing or just imported)
          await sql`INSERT INTO item_tags (item_id, tag_id) VALUES (${item.id}, ${tagId}) ON CONFLICT DO NOTHING`
        }
      }
    }
  })

  return { importedBoards, importedItems, importedTags }
})

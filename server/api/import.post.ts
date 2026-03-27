import { getDb } from '../db'
import { randomBytes } from 'crypto'

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
  const newId = () => randomBytes(4).toString('hex')

  // Map old tag IDs → new tag IDs so item-tag links stay correct
  const tagIdMap = new Map<string, string>()

  let importedBoards = 0
  let importedItems  = 0
  let importedTags   = 0

  await sql.begin(async (sql) => {
    for (const tag of body.tags) {
      const id = newId()
      tagIdMap.set(tag.id, id)
      await sql`INSERT INTO tags (id, label, color, user_id) VALUES (${id}, ${tag.label}, ${tag.color}, ${user.id})`
      importedTags++
    }

    for (const board of body.boards) {
      const boardId = newId()
      await sql`INSERT INTO boards (id, title, position, user_id) VALUES (${boardId}, ${board.title}, ${board.position}, ${user.id})`
      importedBoards++

      for (const item of board.items) {
        const itemId = newId()
        await sql`INSERT INTO items (id, board_id, title, description, position) VALUES (${itemId}, ${boardId}, ${item.title}, ${item.description}, ${item.position})`
        importedItems++

        for (const oldTagId of item.tags) {
          const tagId = tagIdMap.get(oldTagId)
          if (tagId) {
            await sql`INSERT INTO item_tags (item_id, tag_id) VALUES (${itemId}, ${tagId}) ON CONFLICT DO NOTHING`
          }
        }
      }
    }
  })

  return { importedBoards, importedItems, importedTags }
})

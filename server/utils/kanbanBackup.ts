import type { Sql } from 'postgres'
import { randomBytes } from 'crypto'

// NOTE: this is the single source of truth for what "all your data" means for
// Export JSON / Import JSON / Nextcloud backup+restore. Whenever a new column
// is added to boards/items/tags (or a new related table), it must be added
// here too (both buildExportPayload and applyImportPayload) or it will be
// silently dropped by every backup/restore path.
//
// Deliberately excluded: item_embeddings — a lazily-regenerated search cache
// derived from title/description (see server/api/chat.post.ts), not
// user-authored data.

export interface ImportComment {
  id: string; body: string; createdAt: string
}
export interface ImportItem {
  id: string; title: string; description: string; position: number; tags: string[]
  due_date: string | null
  comments: ImportComment[]
}
export interface ImportBoard {
  id: string; title: string; position: number; items: ImportItem[]
}
export interface ImportTag {
  id: string; label: string; color: string
}
export interface ImportPayload {
  version: number
  boards: ImportBoard[]
  tags: ImportTag[]
}

export async function buildExportPayload(sql: Sql, userId: string): Promise<ImportPayload & { exportedAt: string }> {
  const [boards, items, tags, itemTags, comments] = await Promise.all([
    sql`SELECT id, title, position FROM boards WHERE user_id = ${userId} ORDER BY position`,
    sql`
      SELECT i.id, i.board_id, i.title, i.description, i.position, i.due_date
      FROM items i
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${userId}
      ORDER BY i.position
    `,
    sql`SELECT id, label, color FROM tags WHERE user_id = ${userId}`,
    sql`
      SELECT it.item_id, it.tag_id FROM item_tags it
      JOIN items i ON it.item_id = i.id
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${userId}
    `,
    sql`
      SELECT c.id, c.item_id, c.body, c.created_at
      FROM comments c
      JOIN items i ON c.item_id = i.id
      JOIN boards b ON i.board_id = b.id
      WHERE b.user_id = ${userId}
      ORDER BY c.created_at ASC
    `,
  ])

  return {
    version: 2,
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
          due_date: i.due_date ? (i.due_date as Date).toISOString().slice(0, 10) : null,
          comments: comments
            .filter(c => c.item_id === i.id)
            .map(c => ({ id: c.id, body: c.body, createdAt: (c.created_at as Date).toISOString() })),
        })),
    })),
    tags: tags.map(t => ({ id: t.id, label: t.label, color: t.color })),
  }
}

export interface ImportResult {
  importedBoards: number
  importedItems: number
  importedTags: number
  importedComments: number
}

export async function applyImportPayload(
  sql: Sql,
  userId: string,
  payload: ImportPayload,
  { replace }: { replace: boolean },
): Promise<ImportResult> {
  const newId = () => randomBytes(4).toString('hex')

  // Map old tag IDs → new tag IDs so item-tag links stay correct
  const tagIdMap = new Map<string, string>()

  let importedBoards = 0
  let importedItems  = 0
  let importedTags   = 0
  let importedComments = 0

  await sql.begin(async (sql) => {
    if (replace) {
      // Deleting items cascades to item_tags, comments and item_embeddings
      await sql`
        DELETE FROM items WHERE board_id IN (
          SELECT id FROM boards WHERE user_id = ${userId}
        )
      `
      await sql`DELETE FROM boards WHERE user_id = ${userId}`
      await sql`DELETE FROM tags WHERE user_id = ${userId}`
    }

    for (const tag of payload.tags) {
      const id = newId()
      tagIdMap.set(tag.id, id)
      await sql`INSERT INTO tags (id, label, color, user_id) VALUES (${id}, ${tag.label}, ${tag.color}, ${userId})`
      importedTags++
    }

    for (const board of payload.boards) {
      const boardId = newId()
      await sql`INSERT INTO boards (id, title, position, user_id) VALUES (${boardId}, ${board.title}, ${board.position}, ${userId})`
      importedBoards++

      for (const item of board.items) {
        const itemId = newId()
        await sql`
          INSERT INTO items (id, board_id, title, description, position, due_date)
          VALUES (${itemId}, ${boardId}, ${item.title}, ${item.description}, ${item.position}, ${item.due_date ?? null})
        `
        importedItems++

        for (const oldTagId of item.tags) {
          const tagId = tagIdMap.get(oldTagId)
          if (tagId) {
            await sql`INSERT INTO item_tags (item_id, tag_id) VALUES (${itemId}, ${tagId}) ON CONFLICT DO NOTHING`
          }
        }

        for (const comment of item.comments ?? []) {
          await sql`
            INSERT INTO comments (id, item_id, user_id, body, created_at)
            VALUES (${newId()}, ${itemId}, ${userId}, ${comment.body}, ${comment.createdAt})
          `
          importedComments++
        }
      }
    }
  })

  return { importedBoards, importedItems, importedTags, importedComments }
}

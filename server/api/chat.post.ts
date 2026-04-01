import type { Sql } from 'postgres'
import { getDb } from '../db'
import { getOpenAI } from '../utils/openai'

// ─── Tool definition ────────────────────────────────────────────────────────

const APPLY_CHANGES_TOOL = {
  type: 'function' as const,
  function: {
    name: 'apply_changes',
    description: 'Apply a series of changes to the kanban board and explain what was done.',
    parameters: {
      type: 'object',
      required: ['actions', 'message'],
      properties: {
        message: {
          type: 'string',
          description: 'A concise, friendly summary of what was changed, or a helpful response if no changes were needed.',
        },
        actions: {
          type: 'array',
          description: 'Ordered list of changes to apply to the board.',
          items: {
            type: 'object',
            required: ['type'],
            properties: {
              type: {
                type: 'string',
                enum: ['move_item', 'add_tag_to_item', 'remove_tag_from_item', 'create_item', 'delete_item', 'rename_item', 'set_due_date', 'rename_board'],
              },
              item_id: { type: 'string', description: 'ID of the item to act on.' },
              board_id: { type: 'string', description: 'Target board ID (or board to rename).' },
              position: { type: 'integer', description: '0-based position within the board (0 = top).' },
              tag_id: { type: 'string', description: 'Tag ID to add or remove.' },
              title: { type: 'string', description: 'Title for create_item, new name for rename_item, or new name for rename_board.' },
              due_date: { type: ['string', 'null'], description: 'ISO date string YYYY-MM-DD for set_due_date, or null to clear the date.' },
            },
          },
        },
      },
    },
  },
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for a kanban todo app. Users give you natural language instructions to manage their tasks. 

When the user makes a request, always call apply_changes — even if no actions are needed (just set actions to [] and respond helpfully in message).

CRITICAL RULES:
- Board names are purely labels. NEVER refuse or skip an action because of the board an item is in. If the user asks to change a property of an item in "Done", "Archived", or any other board — do it unconditionally.
- Always execute the full scope of the user's request. If they say "all outdated items", act on every item matching that description regardless of which board it's on.
- "today" means the date provided in the context below.
- Use British English.

Guidelines:
- "top of board" means position 0; "bottom" means omit position (appends).
- When multiple items match a description, emit one action per item.
- For set_due_date: use YYYY-MM-DD format; pass null to clear a date.
- For rename_board: use board_id + title.
- Prefer targeted changes. If the request is ambiguous, make a sensible interpretation and explain it.
- Be concise in message — one or two sentences.`

// ─── Action executor ─────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

type Action = {
  type: string
  item_id?: string
  board_id?: string
  position?: number
  tag_id?: string
  title?: string
  due_date?: string | null
}

async function executeAction(sql: Sql, action: Action, userId: string): Promise<string | null> {
  try {
    switch (action.type) {
      case 'move_item': {
        if (!action.item_id) return null
        const [item] = await sql`
          SELECT i.* FROM items i
          JOIN boards b ON i.board_id = b.id
          WHERE i.id = ${action.item_id} AND b.user_id = ${userId}
        `
        if (!item) return null

        const targetBoardId = action.board_id ?? item.board_id
        const [targetBoard] = await sql`SELECT id FROM boards WHERE id = ${targetBoardId} AND user_id = ${userId}`
        if (!targetBoard) return null

        if (item.board_id === targetBoardId) {
          // Reorder within the same board
          const currentPos: number = item.position
          const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM items WHERE board_id = ${targetBoardId} AND id != ${action.item_id}`
          const maxPos = Number(cnt)
          const targetPos = action.position !== undefined ? Math.max(0, Math.min(action.position, maxPos)) : maxPos

          if (targetPos === currentPos) return null

          if (targetPos < currentPos) {
            await sql`UPDATE items SET position = position + 1 WHERE board_id = ${targetBoardId} AND position >= ${targetPos} AND position < ${currentPos} AND id != ${action.item_id}`
          } else {
            await sql`UPDATE items SET position = position - 1 WHERE board_id = ${targetBoardId} AND position > ${currentPos} AND position <= ${targetPos} AND id != ${action.item_id}`
          }
          await sql`UPDATE items SET position = ${targetPos} WHERE id = ${action.item_id}`
        } else {
          // Move across boards
          const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM items WHERE board_id = ${targetBoardId}`
          const maxPos = Number(cnt)
          const targetPos = action.position !== undefined ? Math.max(0, Math.min(action.position, maxPos)) : maxPos

          // Compact source board
          await sql`UPDATE items SET position = position - 1 WHERE board_id = ${item.board_id} AND position > ${item.position}`
          // Make space in target board
          await sql`UPDATE items SET position = position + 1 WHERE board_id = ${targetBoardId} AND position >= ${targetPos}`
          // Move the item
          await sql`UPDATE items SET board_id = ${targetBoardId}, position = ${targetPos} WHERE id = ${action.item_id}`
        }
        return action.item_id
      }

      case 'add_tag_to_item': {
        if (!action.item_id || !action.tag_id) return null
        const [item] = await sql`SELECT i.id FROM items i JOIN boards b ON i.board_id = b.id WHERE i.id = ${action.item_id} AND b.user_id = ${userId}`
        if (!item) return null
        const [tag] = await sql`SELECT id FROM tags WHERE id = ${action.tag_id} AND user_id = ${userId}`
        if (!tag) return null
        await sql`INSERT INTO item_tags (item_id, tag_id) VALUES (${action.item_id}, ${action.tag_id}) ON CONFLICT DO NOTHING`
        return action.item_id
      }

      case 'remove_tag_from_item': {
        if (!action.item_id || !action.tag_id) return null
        const [item] = await sql`SELECT i.id FROM items i JOIN boards b ON i.board_id = b.id WHERE i.id = ${action.item_id} AND b.user_id = ${userId}`
        if (!item) return null
        await sql`DELETE FROM item_tags WHERE item_id = ${action.item_id} AND tag_id = ${action.tag_id}`
        return action.item_id
      }

      case 'create_item': {
        if (!action.board_id || !action.title) return null
        const [board] = await sql`SELECT id FROM boards WHERE id = ${action.board_id} AND user_id = ${userId}`
        if (!board) return null
        const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM items WHERE board_id = ${action.board_id}`
        const maxPos = Number(cnt)
        const targetPos = action.position !== undefined ? Math.max(0, Math.min(action.position, maxPos)) : maxPos
        if (targetPos < maxPos) {
          await sql`UPDATE items SET position = position + 1 WHERE board_id = ${action.board_id} AND position >= ${targetPos}`
        }
        const id = uid()
        await sql`INSERT INTO items (id, board_id, title, description, position) VALUES (${id}, ${action.board_id}, ${action.title}, ${''}, ${targetPos})`
        return id
      }

      case 'delete_item': {
        if (!action.item_id) return null
        const [item] = await sql`SELECT i.* FROM items i JOIN boards b ON i.board_id = b.id WHERE i.id = ${action.item_id} AND b.user_id = ${userId}`
        if (!item) return null
        await sql`DELETE FROM item_tags WHERE item_id = ${action.item_id}`
        await sql`DELETE FROM items WHERE id = ${action.item_id}`
        await sql`UPDATE items SET position = position - 1 WHERE board_id = ${item.board_id} AND position > ${item.position}`
        return action.item_id
      }

      case 'rename_item': {
        if (!action.item_id || !action.title) return null
        const [item] = await sql`SELECT i.id FROM items i JOIN boards b ON i.board_id = b.id WHERE i.id = ${action.item_id} AND b.user_id = ${userId}`
        if (!item) return null
        await sql`UPDATE items SET title = ${action.title} WHERE id = ${action.item_id}`
        return action.item_id
      }

      case 'set_due_date': {
        if (!action.item_id) return null
        const [item] = await sql`SELECT i.id FROM items i JOIN boards b ON i.board_id = b.id WHERE i.id = ${action.item_id} AND b.user_id = ${userId}`
        if (!item) return null
        await sql`UPDATE items SET due_date = ${action.due_date ?? null} WHERE id = ${action.item_id}`
        return action.item_id
      }

      case 'rename_board': {
        if (!action.board_id || !action.title) return null
        const [board] = await sql`SELECT id FROM boards WHERE id = ${action.board_id} AND user_id = ${userId}`
        if (!board) return null
        await sql`UPDATE boards SET title = ${action.title} WHERE id = ${action.board_id}`
        return action.board_id
      }
    }
  } catch (err) {
    console.error(`[chat] action ${action.type} failed:`, err)
  }
  return null
}

// ─── Embedding helpers ────────────────────────────────────────────────────────

async function generateMissingEmbeddings(sql: Sql, userId: string) {
  try {
    const openai = getOpenAI()
    const unembedded = await sql`
      SELECT i.id, i.title, i.description
      FROM items i
      JOIN boards b ON i.board_id = b.id
      LEFT JOIN item_embeddings ie ON ie.item_id = i.id
      WHERE b.user_id = ${userId} AND ie.item_id IS NULL
      LIMIT 50
    `
    for (const item of unembedded) {
      const text = [item.title, item.description?.replace(/<[^>]*>/g, '').trim()].filter(Boolean).join('\n')
      const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
      const embStr = `[${res.data[0].embedding.join(',')}]`
      await sql`
        INSERT INTO item_embeddings (item_id, embedding)
        VALUES (${item.id}, ${embStr}::vector)
        ON CONFLICT (item_id) DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
      `
    }
  } catch {
    // pgvector not available or API call failed — embeddings are best-effort
  }
}

async function updateEmbeddings(sql: Sql, itemIds: string[]) {
  try {
    const openai = getOpenAI()
    for (const itemId of itemIds) {
      const [item] = await sql`SELECT id, title, description FROM items WHERE id = ${itemId}`
      if (!item) continue
      const text = [item.title, item.description?.replace(/<[^>]*>/g, '').trim()].filter(Boolean).join('\n')
      const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
      const embStr = `[${res.data[0].embedding.join(',')}]`
      await sql`
        INSERT INTO item_embeddings (item_id, embedding)
        VALUES (${item.id}, ${embStr}::vector)
        ON CONFLICT (item_id) DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
      `
    }
  } catch {
    // best-effort
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const { prompt, history } = await readBody(event)
  if (!prompt?.trim()) throw createError({ statusCode: 400, message: 'Prompt is required' })

  const sql = getDb()
  const openai = getOpenAI()

  // 1. Generate missing embeddings (async, non-blocking for response)
  generateMissingEmbeddings(sql, userId).catch(() => {})

  // 2. Fetch full kanban state
  const [boards, items, tags, itemTags] = await Promise.all([
    sql`SELECT * FROM boards WHERE user_id = ${userId} ORDER BY position`,
    sql`SELECT i.* FROM items i JOIN boards b ON i.board_id = b.id WHERE b.user_id = ${userId} ORDER BY i.position`,
    sql`SELECT * FROM tags WHERE user_id = ${userId}`,
    sql`SELECT it.* FROM item_tags it JOIN items i ON it.item_id = i.id JOIN boards b ON i.board_id = b.id WHERE b.user_id = ${userId}`,
  ])

  // 3. Semantic search with pgvector (best-effort)
  let semanticHint = ''
  try {
    const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: prompt.trim() })
    const embStr = `[${embRes.data[0].embedding.join(',')}]`
    const similar = await sql`
      SELECT ie.item_id
      FROM item_embeddings ie
      ORDER BY ie.embedding <=> ${embStr}::vector
      LIMIT 5
    `
    if (similar.length > 0) {
      const ids = new Set(similar.map((r: { item_id: string }) => r.item_id))
      const matched = items.filter(i => ids.has(i.id)).map(i => `"${i.title}" (id: ${i.id})`)
      if (matched.length) semanticHint = `\n\nSemanticly relevant items: ${matched.join(', ')}`
    }
  } catch {
    // pgvector not ready yet — continue without semantic hint
  }

  // 4. Build context
  const tagMap = new Map(tags.map(t => [t.id, t]))
  const boardContext = boards.map(b => {
    const boardItems = items.filter(i => i.board_id === b.id).map(i => {
      const itemTagNames = itemTags
        .filter(it => it.item_id === i.id)
        .map(it => { const t = tagMap.get(it.tag_id); return t ? `${t.label} (id: ${t.id})` : null })
        .filter(Boolean)
      const tagsStr = itemTagNames.length > 0 ? ` [tags: ${itemTagNames.join(', ')}]` : ''
      const dateStr = i.due_date ? ` [due: ${new Date(i.due_date).toISOString().slice(0, 10)}]` : ''
      return `  ${i.position + 1}. "${i.title}" (id: ${i.id})${tagsStr}${dateStr}`
    })
    const itemsStr = boardItems.length > 0 ? '\n' + boardItems.join('\n') : '\n  (empty)'
    return `Board: "${b.title}" (id: ${b.id})${itemsStr}`
  }).join('\n\n')

  const tagsContext = tags.length > 0
    ? '\nAvailable tags: ' + tags.map(t => `${t.label} (id: ${t.id})`).join(', ')
    : '\nNo tags defined.'

  const today = new Date().toISOString().slice(0, 10)
  const context = `Today's date: ${today}\n\nCurrent board state:\n\n${boardContext}\n${tagsContext}${semanticHint}`

  // 5. Call OpenAI with forced tool use
  const priorMessages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(history)
    ? history.map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    : []

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    tool_choice: { type: 'function', function: { name: 'apply_changes' } },
    tools: [APPLY_CHANGES_TOOL],
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...priorMessages,
      { role: 'user', content: `${context}\n\nRequest: ${prompt.trim()}` },
    ],
  })

  const toolCall = completion.choices[0].message.tool_calls?.[0]
  if (!toolCall) return { message: "Sorry, I couldn't process that request.", actionsApplied: 0 }

  const { actions, message }: { actions: Action[]; message: string } = JSON.parse(toolCall.function.arguments)

  // 6. Execute actions
  const itemActionTypes = new Set(['move_item', 'add_tag_to_item', 'remove_tag_from_item', 'create_item', 'rename_item', 'set_due_date'])
  const changedItemIds: string[] = []
  let actionsApplied = 0
  for (const action of (actions ?? [])) {
    const id = await executeAction(sql, action, userId)
    if (id !== null) {
      actionsApplied++
      if (itemActionTypes.has(action.type)) changedItemIds.push(id)
    }
  }

  // 7. Update embeddings for changed items (async)
  if (changedItemIds.length > 0) updateEmbeddings(sql, changedItemIds).catch(() => {})

  return { message, actionsApplied }
})

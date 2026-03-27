import { getDb } from '../../../db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const itemId = getRouterParam(event, 'id')
  const sql = getDb()

  // Verify item belongs to this user
  const [item] = await sql`
    SELECT i.id FROM items i
    JOIN boards b ON i.board_id = b.id
    WHERE i.id = ${itemId} AND b.user_id = ${userId}
  `
  if (!item) throw createError({ statusCode: 404 })

  const comments = await sql`
    SELECT c.id, c.body, c.created_at, c.user_id,
           u.name as author_name, u.email as author_email
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.item_id = ${itemId}
    ORDER BY c.created_at ASC
  `

  return comments.map(c => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    isOwn: c.user_id === userId,
    author: {
      name: c.author_name || c.author_email,
      email: c.author_email,
    },
  }))
})

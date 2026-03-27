import { getDb } from '../../../db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const itemId = getRouterParam(event, 'id')
  const { body, id } = await readBody(event)
  const sql = getDb()

  if (!body?.trim()) throw createError({ statusCode: 400, message: 'Comment body is required' })

  // Verify item belongs to this user
  const [item] = await sql`
    SELECT i.id FROM items i
    JOIN boards b ON i.board_id = b.id
    WHERE i.id = ${itemId} AND b.user_id = ${userId}
  `
  if (!item) throw createError({ statusCode: 404 })

  await sql`
    INSERT INTO comments (id, item_id, user_id, body)
    VALUES (${id}, ${itemId}, ${userId}, ${body.trim()})
  `

  const [comment] = await sql`
    SELECT c.id, c.body, c.created_at, u.name as author_name, u.email as author_email
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ${id}
  `

  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.created_at,
    isOwn: true,
    author: {
      name: comment.author_name || comment.author_email,
      email: comment.author_email,
    },
  }
})

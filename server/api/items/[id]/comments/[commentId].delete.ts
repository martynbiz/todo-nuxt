import { getDb } from '../../../../db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const commentId = getRouterParam(event, 'commentId')
  const sql = getDb()

  const [comment] = await sql`SELECT * FROM comments WHERE id = ${commentId}`
  if (!comment) throw createError({ statusCode: 404 })
  if (comment.user_id !== userId) throw createError({ statusCode: 403 })

  await sql`DELETE FROM comments WHERE id = ${commentId}`
  return { ok: true }
})

import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sql = getDb()
  const [connection] = await sql`SELECT server_url, connected_at FROM nextcloud_connections WHERE user_id = ${user.id}`

  if (!connection) return { connected: false }
  return { connected: true, serverUrl: connection.server_url, connectedAt: connection.connected_at }
})

import { getDb } from '../../db'
import { buildExportPayload } from '../../utils/kanbanBackup'
import { webdavMkcol, webdavPut, type NextcloudConnection } from '../../utils/nextcloud'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const sql = getDb()
  const [row] = await sql`SELECT * FROM nextcloud_connections WHERE user_id = ${user.id}`
  if (!row) throw createError({ statusCode: 400, message: 'Nextcloud is not connected' })

  const payload = await buildExportPayload(sql, user.id)
  const json = JSON.stringify(payload, null, 2)

  let connection = row as NextcloudConnection
  connection = await webdavMkcol(connection, '/kanban-backups')
  connection = await webdavPut(connection, '/kanban-backup.json', json)

  const timestamp = payload.exportedAt.replace(/[:.]/g, '-')
  await webdavPut(connection, `/kanban-backups/kanban-export-${timestamp}.json`, json)

  return {
    backedUpAt: payload.exportedAt,
    boards: payload.boards.length,
    items: payload.boards.reduce((n, b) => n + b.items.length, 0),
    tags: payload.tags.length,
  }
})

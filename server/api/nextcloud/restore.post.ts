import { getDb } from '../../db'
import { applyImportPayload, type ImportPayload } from '../../utils/kanbanBackup'
import { webdavGet, type NextcloudConnection } from '../../utils/nextcloud'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const requestBody = await readBody<{ replace?: boolean }>(event)
  const replace = requestBody?.replace === true

  const sql = getDb()
  const [row] = await sql`SELECT * FROM nextcloud_connections WHERE user_id = ${user.id}`
  if (!row) throw createError({ statusCode: 400, message: 'Nextcloud is not connected' })

  const connection = row as NextcloudConnection
  const { body: text } = await webdavGet(connection, '/kanban-backup.json')
  if (text === null) throw createError({ statusCode: 404, message: 'No backup found on Nextcloud' })

  let payload: ImportPayload
  try {
    payload = JSON.parse(text)
  } catch {
    throw createError({ statusCode: 502, message: 'Nextcloud backup file is not valid JSON' })
  }

  if (!payload || !Array.isArray(payload.boards) || !Array.isArray(payload.tags)) {
    throw createError({ statusCode: 502, message: 'Nextcloud backup file has an invalid format' })
  }

  return applyImportPayload(sql, user.id, payload, { replace })
})

import { getDb } from '../db'
import { applyImportPayload, type ImportPayload } from '../utils/kanbanBackup'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body: ImportPayload = await readBody(event)

  if (!body || !Array.isArray(body.boards) || !Array.isArray(body.tags)) {
    throw createError({ statusCode: 400, message: 'Invalid import format' })
  }

  const sql = getDb()
  return applyImportPayload(sql, user.id, body, { replace: false })
})

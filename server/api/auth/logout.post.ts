import { deleteSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await deleteSession(event)
  deleteCookie(event, 'session')
  return { ok: true }
})

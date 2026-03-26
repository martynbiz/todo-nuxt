import { getSessionUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Public auth routes — skip check
  if (path.startsWith('/api/auth/')) return
  // Non-API routes — skip check
  if (!path.startsWith('/api/')) return

  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  event.context.user = user
})

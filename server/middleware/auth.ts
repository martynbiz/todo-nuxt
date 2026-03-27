export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Public auth routes — skip check
  if (path.startsWith('/api/auth/')) return
  // Non-API routes — skip check
  if (!path.startsWith('/api/')) return

  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  event.context.user = session.user
})

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Public auth routes — skip check
  if (path.startsWith('/api/auth/')) return
  // Nextcloud OAuth callback handles its own session check (redirects to /login instead of a raw 401)
  if (path === '/api/nextcloud/callback') return
  // Non-API routes — skip check
  if (!path.startsWith('/api/')) return

  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  event.context.user = session.user
})

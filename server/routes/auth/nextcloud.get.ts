import { randomBytes } from 'crypto'
import { buildAuthorizeUrl } from '../../utils/nextcloud'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) return sendRedirect(event, '/login')

  const state = randomBytes(16).toString('hex')
  setCookie(event, 'nextcloud_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const redirectUri = `${getRequestURL(event).origin}/api/nextcloud/callback`
  return sendRedirect(event, buildAuthorizeUrl(state, redirectUri))
})

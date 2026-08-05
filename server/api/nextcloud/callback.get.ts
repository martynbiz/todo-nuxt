import { getDb } from '../../db'
import { exchangeCodeForToken, expiresAtFrom, getNextcloudConfig } from '../../utils/nextcloud'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) return sendRedirect(event, '/login')

  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined
  const cookieState = getCookie(event, 'nextcloud_oauth_state')
  deleteCookie(event, 'nextcloud_oauth_state')

  if (!code || !state || state !== cookieState) {
    return sendRedirect(event, '/settings?nextcloud=error')
  }

  try {
    const redirectUri = `${getRequestURL(event).origin}/api/nextcloud/callback`
    const token = await exchangeCodeForToken(code, redirectUri)

    if (!token.user_id) {
      throw new Error('Nextcloud token response did not include a user_id')
    }

    const { url } = getNextcloudConfig()
    const sql = getDb()

    await sql`
      INSERT INTO nextcloud_connections (user_id, server_url, nextcloud_user_id, access_token, refresh_token, expires_at)
      VALUES (${session.user.id}, ${url}, ${token.user_id}, ${token.access_token}, ${token.refresh_token ?? null}, ${expiresAtFrom(token.expires_in)})
      ON CONFLICT (user_id) DO UPDATE SET
        server_url = EXCLUDED.server_url,
        nextcloud_user_id = EXCLUDED.nextcloud_user_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at
    `

    return sendRedirect(event, '/settings?nextcloud=connected')
  } catch (error) {
    console.error('[nextcloud] connection failed:', error)
    return sendRedirect(event, '/settings?nextcloud=error')
  }
})

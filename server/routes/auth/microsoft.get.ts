import { randomBytes } from 'crypto'
import { getDb } from '../../db'

// Decode Microsoft guest UPN format: localpart_domain#EXT#@tenant → localpart@domain
function decodeEmail(mail: string | null | undefined, upn: string | null | undefined): string {
  if (mail) return mail.toLowerCase().trim()
  const raw = (upn ?? '').toLowerCase().trim()
  const m = raw.match(/^(.+)#ext#@.+$/)
  if (m) {
    const i = m[1].lastIndexOf('_')
    if (i !== -1) return m[1].slice(0, i) + '@' + m[1].slice(i + 1)
  }
  return raw
}

export default defineOAuthMicrosoftEventHandler({
  async onSuccess(event, { user: msUser }) {
    const sql = getDb()
    const email = decodeEmail(msUser.mail as string, msUser.userPrincipalName as string)
    const entraId = msUser.id as string
    const displayName = (msUser.displayName as string) ?? ''

    console.log(`[auth] Microsoft login: entraId=${entraId} email=${email}`)

    let [user] = await sql`SELECT * FROM users WHERE entra_id = ${entraId}`
    if (!user && email) {
      ;[user] = await sql`SELECT * FROM users WHERE LOWER(email) = ${email}`
    }

    if (!user) {
      const id = randomBytes(16).toString('hex')
      ;[user] = await sql`
        INSERT INTO users (id, email, entra_id, name, password_hash)
        VALUES (${id}, ${email}, ${entraId}, ${displayName}, NULL)
        RETURNING *
      `
    } else if (user.entra_id !== entraId) {
      await sql`UPDATE users SET entra_id = ${entraId} WHERE id = ${user.id}`
    }

    await setUserSession(event, {
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme },
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Microsoft OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})

import { getDb } from '../../db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { theme } = await readBody(event)

  if (theme && !['dark', 'light'].includes(theme)) {
    throw createError({ statusCode: 400, message: 'Invalid theme value' })
  }

  const sql = getDb()
  const [updated] = await sql`
    UPDATE users SET theme = ${theme} WHERE id = ${user.id} RETURNING theme
  `

  const session = await getUserSession(event)
  await setUserSession(event, { user: { ...session.user, theme: updated.theme } })

  return { theme: updated.theme }
})

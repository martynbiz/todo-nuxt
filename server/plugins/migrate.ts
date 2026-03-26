import { getDb } from '../db'

export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) return

  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    )
  `

  console.log('[db] migrations complete')
})

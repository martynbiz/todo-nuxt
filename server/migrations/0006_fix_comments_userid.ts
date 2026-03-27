import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  // Drop and recreate with correct user_id TEXT type (users.id is TEXT)
  await sql`DROP TABLE IF EXISTS comments`
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id         TEXT PRIMARY KEY,
      item_id    TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS comments_item_id_idx ON comments(item_id)`
}

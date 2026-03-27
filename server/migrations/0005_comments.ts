import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id         TEXT PRIMARY KEY,
      item_id    TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS comments_item_id_idx ON comments(item_id)`
}

import type { getDb } from '../db'

type Sql = ReturnType<typeof getDb>

// Per-user theme preference stored in the DB
export async function up(sql: Sql) {
  await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark'`)
}

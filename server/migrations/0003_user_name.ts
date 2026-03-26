import type { getDb } from '../db'

type Sql = ReturnType<typeof getDb>

// Store display name on the user account
export async function up(sql: Sql) {
  await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`)
}

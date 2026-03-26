import type { getDb } from '../db'

type Sql = ReturnType<typeof getDb>

// Add user_id to boards and tags so data is scoped per user
export async function up(sql: Sql) {
  await sql.unsafe(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`)
  await sql.unsafe(`ALTER TABLE tags   ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE`)
}

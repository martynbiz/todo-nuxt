import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  // Allow OAuth users who have no password
  await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`
  // Store the Microsoft immutable object ID for reliable identity linking
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS entra_id TEXT`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_entra_id_idx ON users (entra_id) WHERE entra_id IS NOT NULL`
}

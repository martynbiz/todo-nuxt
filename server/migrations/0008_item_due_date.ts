import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS due_date DATE`
}

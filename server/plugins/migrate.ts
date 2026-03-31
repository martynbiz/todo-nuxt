import { getDb } from '../db'
import { up as up0001 } from '../migrations/0001_init'
import { up as up0002 } from '../migrations/0002_user_scoping'
import { up as up0003 } from '../migrations/0003_user_name'
import { up as up0004 } from '../migrations/0004_user_theme'
import { up as up0005 } from '../migrations/0005_comments'
import { up as up0006 } from '../migrations/0006_fix_comments_userid'
import { up as up0007 } from '../migrations/0007_entra_auth'
import { up as up0008 } from '../migrations/0008_item_due_date'

const migrations = [
  { name: '0001_init',                  up: up0001 },
  { name: '0002_user_scoping',          up: up0002 },
  { name: '0003_user_name',             up: up0003 },
  { name: '0004_user_theme',            up: up0004 },
  { name: '0005_comments',             up: up0005 },
  { name: '0006_fix_comments_userid',  up: up0006 },
  { name: '0007_entra_auth',           up: up0007 },
  { name: '0008_item_due_date',        up: up0008 },
]

export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) return

  const sql = getDb()

  // Tracking table — created once, never modified by migrations
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  const applied = await sql`SELECT name FROM schema_migrations`
  const appliedNames = new Set(applied.map((r) => (r as { name: string }).name))

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue
    console.log(`[db] applying migration: ${migration.name}`)
    await migration.up(sql)
    await sql`INSERT INTO schema_migrations (name) VALUES (${migration.name})`
    console.log(`[db] migration applied:  ${migration.name}`)
  }

  console.log('[db] all migrations up to date')
})

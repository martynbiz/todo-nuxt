import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS nextcloud_connections (
      user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      server_url        TEXT NOT NULL,
      nextcloud_user_id TEXT NOT NULL,
      access_token      TEXT NOT NULL,
      refresh_token     TEXT,
      expires_at        TIMESTAMPTZ,
      connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

import type { getDb } from '../db'

type Sql = ReturnType<typeof getDb>

export async function up(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS boards (
      id       TEXT PRIMARY KEY,
      title    TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id          TEXT PRIMARY KEY,
      board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS tags (
      id    TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    )
  `
}

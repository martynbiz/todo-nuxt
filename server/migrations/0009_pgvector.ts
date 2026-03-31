import type { Sql } from 'postgres'

export async function up(sql: Sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  await sql`
    CREATE TABLE IF NOT EXISTS item_embeddings (
      item_id    TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      embedding  vector(1536),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS item_embeddings_ivfflat ON item_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
}

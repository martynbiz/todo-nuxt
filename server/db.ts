import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL!, { max: 10 })
  }
  return _sql
}

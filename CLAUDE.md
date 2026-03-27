# CLAUDE.md

## Local Development Setup

Start PostgreSQL via Docker Compose (postgres service only), then run the Nuxt dev server:

```bash
docker compose up postgres -d
npm run dev
```

App runs at http://localhost:3000.

To stop postgres:

```bash
docker compose down
```

## Database Changes

**Never modify existing migration files.** The app may already be live with those migrations recorded in `schema_migrations`. Changing them won't re-run them and will break new installs.

For any schema change — new column, new table, index, rename — create a new numbered migration file:

1. Add `server/migrations/NNNN_description.ts` with an `up(sql)` function. Write it to be safe against a live database: use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, etc.

2. Register it in `server/plugins/migrate.ts` (auto-discovery is not supported in Nitro — imports must be explicit):
```ts
import { up as up000N } from '../migrations/000N_description'

const migrations = [
  // existing entries …
  { name: '000N_description', up: up000N },
]
```

3. The migration runs automatically on next server start (dev or production rebuild). Existing data is preserved — only the new migration is applied.

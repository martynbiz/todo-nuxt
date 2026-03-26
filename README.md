# Todo Nuxt — Kanban Board

A kanban board app with drag-and-drop, tagging, and WYSIWYG item descriptions. Built with Nuxt 3, Pinia, Tiptap, and PostgreSQL.

---

## Production (Docker)

Requires [Docker](https://www.docker.com/products/docker-desktop/) and [Git](https://git-scm.com/).

### First deployment

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd todo-nuxt
```

**2. Create the environment file**

```bash
cp .env.example .env
```

Edit `.env` with your desired credentials:

```env
APP_PORT=3000
POSTGRES_USER=kanban
POSTGRES_PASSWORD=changeme
POSTGRES_DB=kanban
```

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `3000` | Host port the app is exposed on |
| `POSTGRES_USER` | `kanban` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `kanban` | PostgreSQL password (change this) |
| `POSTGRES_DB` | `kanban` | PostgreSQL database name |

> The database schema is created automatically on first start — no manual migration needed.

**3a. Secure the environment file**

Restrict `.env` so only the owner can read it — it contains your database password:

```bash
chmod 600 .env
```

`600` means read/write for the file owner only. Docker Compose reads it as the user who runs the command, so this is sufficient. You can verify with:

```bash
ls -la .env
# -rw------- 1 you you ... .env
```

**3. Build and start**

```bash
docker compose up --build -d
```

App runs at **http://localhost:${APP_PORT}**. PostgreSQL data is persisted in a named Docker volume and survives restarts.

To stop:

```bash
docker compose down
```

---

### Updating from Git

Pull the latest code and rebuild the app image. The database schema is updated automatically on start.

```bash
git pull
docker compose up --build -d
```

> `docker compose down` is not required before rebuilding — `up --build` replaces the running app container in place while leaving the postgres container and its data volume untouched.

---

## Dev Environment

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker](https://www.docker.com/products/docker-desktop/) (for running PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL via Docker Compose

```bash
docker compose up postgres -d
```

Or use an existing local PostgreSQL install:

```sql
CREATE USER kanban WITH PASSWORD 'kanban';
CREATE DATABASE kanban OWNER kanban;
```

### 3. Configure environment

A `.env` file is included with defaults for local development:

```env
DATABASE_URL=postgresql://kanban:kanban@localhost:5432/kanban
```

Edit it if you changed the credentials above.

### 4. Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**. The database schema is created automatically on first run.

---

## Database Migrations

Schema changes are managed with numbered migration files in `server/migrations/`. On every server start, the migration runner checks a `schema_migrations` table and applies any files that haven't run yet — in order, exactly once.

### Adding a migration

1. Create a new file following the naming convention:

```
server/migrations/0005_your_description.ts
```

```ts
import type { getDb } from '../db'
type Sql = ReturnType<typeof getDb>

export async function up(sql: Sql) {
  await sql`ALTER TABLE example ADD COLUMN new_col TEXT NOT NULL DEFAULT ''`
}
```

2. Register it in `server/plugins/migrate.ts`:

```ts
import { up as up0005 } from '../migrations/0005_your_description'

const migrations = [
  ...
  { name: '0005_your_description', up: up0005 },
]
```

3. Restart the server (`npm run dev` or `docker compose up --build -d`). The migration runs automatically and is recorded in `schema_migrations`.

> Write migrations to be additive where possible (add columns/tables rather than drop or rename) to keep them safe to apply against live data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 3](https://nuxt.com/) |
| State management | [Pinia](https://pinia.vuejs.org/) |
| Rich text editor | [Tiptap](https://tiptap.dev/) |
| Database client | [postgres.js](https://github.com/porsager/postgres) |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |

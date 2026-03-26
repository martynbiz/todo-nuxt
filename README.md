# Todo Nuxt — Kanban Board

A kanban board app with drag-and-drop, tagging, and WYSIWYG item descriptions. Built with Nuxt 3, Pinia, Tiptap, and PostgreSQL.

## Production (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 1. Configure environment

Copy the example env file and edit it:

```bash
cp .env.example .env
```

The `.env` file is read automatically by Docker Compose. Available variables:

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `3000` | Host port the app is exposed on |
| `POSTGRES_USER` | `kanban` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `kanban` | PostgreSQL password |
| `POSTGRES_DB` | `kanban` | PostgreSQL database name |

Example — run on port 8080 with custom credentials:

```env
APP_PORT=8080
POSTGRES_USER=myuser
POSTGRES_PASSWORD=s3cr3t
POSTGRES_DB=mydb
```

### 2. Start

```bash
docker compose up --build -d
```

App runs at **http://localhost:${APP_PORT}**. PostgreSQL data is persisted in a named Docker volume.

To stop:

```bash
docker compose down
```

---

## Dev Environment

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [PostgreSQL](https://www.postgresql.org/) running locally (or via Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Start a local PostgreSQL instance

If you have Docker available, the quickest way:

```bash
docker run -d \
  --name kanban-postgres \
  -e POSTGRES_USER=kanban \
  -e POSTGRES_PASSWORD=kanban \
  -e POSTGRES_DB=kanban \
  -p 5432:5432 \
  postgres:16-alpine
```

Or use an existing local PostgreSQL install and create the database manually:

```sql
CREATE USER kanban WITH PASSWORD 'kanban';
CREATE DATABASE kanban OWNER kanban;
```

### 3. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to point at your local Postgres:

```env
DATABASE_URL=postgresql://kanban:kanban@localhost:5432/kanban
```

### 4. Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**. The database schema is created automatically on first run.

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

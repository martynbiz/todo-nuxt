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

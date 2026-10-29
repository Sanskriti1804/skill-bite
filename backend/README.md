# SkillBite API

Foundation only. Business routes are not implemented. The contract is `documentation/api.md`.

## Setup

```text
cd backend
npm install
copy .env.example .env
```

Set `NODE_ENV`, `PORT`, and `LOG_LEVEL` in `.env`. Do not commit `.env`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start with reload |
| `npm run build` then `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check `src` |
| `npm test` | Foundation tests |

`GET /health` returns `{ "status": "ok" }` when the process is up. It does not check a database, because this phase has no database.

The process closes the HTTP server on `SIGINT` and `SIGTERM`.

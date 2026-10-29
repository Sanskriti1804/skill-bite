# SkillBite API

Express API for SkillBite. The contract is `documentation/api.md`. The schema is `prisma/schema.prisma`.

## Setup

```text
cd backend
npm install
copy .env.example .env
npx prisma migrate deploy
```

Edit `.env` so `DATABASE_URL` reaches a running Postgres server. Set `TOKEN_SIGNING_SECRET` and `PUSH_TOKEN_KEY`. Do not commit `.env`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start with reload |
| `npm run build` then `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check `src` |
| `npm test` | Health and product tests. The product test starts its own Postgres |
| `npm run prisma:generate` | Regenerate the Prisma client |

`GET /health` returns `{ "status": "ok" }` and does not check the database. `/api/v1` is mounted only when `DATABASE_URL` and `TOKEN_SIGNING_SECRET` are set. Startup then upserts the `USER`, `CREATOR`, and `ADMIN` roles and the Trending category. It does not create users or passwords.

The process closes the HTTP server on `SIGINT` and `SIGTERM`.

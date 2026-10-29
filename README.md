# SkillBite

SkillBite is a college microlearning project. Learners watch short videos and structured courses, creators publish that content, and administrators manage users, content, categories, tags, settings, and basic analytics.

**Stage:** API, Next.js web app, and Expo app exist. Hosting is not chosen. The project is not production-ready.

## Confirmed scope

From `SkillBite.md`:

- Email and password, email verification, password recovery, and Google sign-in.
- One role per account: Learner, Creator, or Administrator.
- Standalone videos and courses made of modules and lessons.
- Browse, search, categories, tags, bookmarks, saved progress, continue learning, and sharing by URL.
- In-app and push notifications.
- Admin moderation, audit records, platform settings, and basic progress analytics.
- English UI and video captions or subtitles.

Out of the MVP: payments, comments, community features, learning streaks, and personalized recommendations.

## Technology

ADR 0002 is the baseline: Express, PostgreSQL, Prisma, Next.js, and Expo. ADR 0001 is the earlier unaccepted note.

## Documents

| Document | Role |
|---|---|
| [SkillBite.md](SkillBite.md) | Business requirements |
| [SkillBite-ERD.md](SkillBite-ERD.md) | Logical ERD |
| [documentation/README.md](documentation/README.md) | Design-note index |
| [AGENTS.md](AGENTS.md) | Rules for coding agents |
| [MEMORY.md](MEMORY.md) | Current repository facts for agents |

## Setup

Postgres must be running before the API. `backend/.env.example` lists the variable names. Copy it to `backend/.env` and set `DATABASE_URL`, `TOKEN_SIGNING_SECRET`, and `PUSH_TOKEN_KEY`. Do not commit `.env`.

```text
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

In a second terminal:

```text
cd frontend
npm install
npm run dev
```

If the web app and the API both want port 3000, set `NEXT_PUBLIC_API_URL` to the API origin before starting Next. Health is `GET /health` and does not check the database. Business routes are under `/api/v1` when `DATABASE_URL` and `TOKEN_SIGNING_SECRET` are set.

`npm test` and `npm run typecheck` run in `backend/` and `frontend/`. `frontend/mobile` has `npm start` and `npm run typecheck`. There is no lint or format script. ADR 0002 does not name a linter.

## Limitations

Open BRD decisions block completion measurement, deletion and retention, notification triggers, analytics metrics, age and consent, and the authentication architecture. This repository is not a running product and is not production-ready.

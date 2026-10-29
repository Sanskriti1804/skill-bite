# SkillBite

SkillBite is a college microlearning project. Learners watch short videos and structured courses, creators publish that content, and administrators manage users, content, categories, tags, settings, and basic analytics.

**Stage:** requirements and a logical data model only. No application, database, test suite, or deployment exists.

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

Not selected. See `documentation/decisions/0001-technology-stack.md`.

## Documents

| Document | Role |
|---|---|
| [SkillBite.md](SkillBite.md) | Business requirements |
| [SkillBite-ERD.md](SkillBite-ERD.md) | Logical ERD |
| [documentation/README.md](documentation/README.md) | Design-note index |
| [AGENTS.md](AGENTS.md) | Rules for coding agents |
| [MEMORY.md](MEMORY.md) | Current repository facts for agents |

## Setup

The API foundation is in `backend/`. See `backend/README.md` for install and `GET /health`. Business routes are not implemented. `frontend/` and `ai-input/` are still empty.

## Limitations

Open BRD decisions block completion measurement, deletion and retention, notification triggers, analytics metrics, age and consent, and the authentication architecture. This repository is not a running product and is not production-ready.

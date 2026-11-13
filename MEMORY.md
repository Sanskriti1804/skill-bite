# Memory

Facts about this repository. Rules for changing it are in `AGENTS.md`.

- The BRD is approved for implementation. Accepted clarifications are in `documentation/decisions/0002-confirmed-answers.md`.
- Learner in the BRD is the User role. One active role. The account owner may switch between User and Creator without deleting progress or content. One Admin, not a self-service switch.
- Video is primary. Supporting files and links are `CONTENT_ATTACHMENT`. Video progress is per user and video. Course progress is calculated from video durations of lessons whose `completed_at` is set. Last position is resume only. Trending is a category, not a ranking.
- Completion threshold starts at 90% and is admin-configurable. Last playback position does not prove completion. Old completion rows stay when the threshold changes. The coverage formula is not approved, so the progress route does not set `completed_at`.
- Account status is `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. Children under eight require parental consent. How consent is stored is not specified.
- Reconnecting progress after a new registration is out of scope. Password recovery remains. Retention after account deletion is still undefined.
- Stack baseline: Expo React Native, Next.js admin and learner web, Node.js Express, REST, PostgreSQL, Prisma. Media uses the `MediaStorage` interface: Cloudinary when `CLOUDINARY_*` env vars are set, otherwise local `MEDIA_ROOT`. Hosting provider is not chosen.
- `backend/` has the API, Prisma schema, and tests. `frontend/` has the Next.js web portal. `mobile/` is the Expo React Native app: short-video Learn feed for User, Creator Studio for short tutorials plus series chapters/topics (modules/lessons), AsyncStorage draft index, `GET /api/v1/tags` for publish tags. A device simulator was not run.
- Phase 6–9 verification evidence: backend `typecheck`/`test`/`test:postman` passed; frontend `typecheck`/`test`/`build` passed; mobile `typecheck` passed. Web session persistence, watch auto-progress, creator draft persistence, and admin published-content list exist. Mobile has browse/watch/progress/bookmarks/account with AsyncStorage sessions.
- Still open: watched-coverage formula, parental-consent capture, account-deletion retention, notification type catalog, push provider, analytics metrics, hosting.
- `.gitignore` ignores `.env` and `.env.*` except `.env.example`. `backend/.env.example` lists names only.

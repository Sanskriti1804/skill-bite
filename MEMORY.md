# Memory

Facts about this repository. Rules for changing it are in `AGENTS.md`.

- The BRD is approved for implementation. Accepted clarifications are in `documentation/decisions/0002-confirmed-answers.md`.
- Learner in the BRD is the User role. One active role. The account owner may switch between User and Creator without deleting progress or content. One Admin, not a self-service switch.
- Video is primary. Supporting files and links are attachments. One video asset per lesson. Progress is per lesson. The ERD file still shows per-video progress and has not been updated.
- Completion threshold starts at 90% and is admin-configurable. Last playback position does not prove completion. Old completion rows stay when the threshold changes. The exact watched-coverage formula is still unspecified.
- Stack baseline: Expo React Native, Next.js admin web, Node.js Express, REST, PostgreSQL, Prisma. Local media in development. Hosting provider is not chosen. No application code has been added yet.
- Directories `backend/`, `frontend/`, and `ai-input/` are intentional.
- Still open: account-status values (Q-05) and minimum age or parental consent (Q-25). The BRD does not say “under 8”.
- Deletion is recoverable for content and for accounts, with identity checks before progress is reattached. A written retention period is still missing.
- `.gitignore` ignores `.env` and `.env.*` except `.env.example`. No `.env.example` exists.

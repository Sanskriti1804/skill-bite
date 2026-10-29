# Memory

Facts about this repository. Rules for changing it are in `AGENTS.md`.

- The BRD is approved for implementation. Accepted clarifications are in `documentation/decisions/0002-confirmed-answers.md`.
- Learner in the BRD is the User role. One active role. The account owner may switch between User and Creator without deleting progress or content. One Admin, not a self-service switch.
- Video is primary. Supporting files and links are `CONTENT_ATTACHMENT`. Video progress is per user and video. Course progress is calculated from video duration. Trending is a category, not a ranking.
- Completion threshold starts at 90% and is admin-configurable. Last playback position does not prove completion. Old completion rows stay when the threshold changes. The coverage formula is not approved.
- Account status is `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. Children under eight require parental consent. How consent is stored is not specified.
- Reconnecting progress after a new registration is out of scope. Password recovery remains. Retention after account deletion is still undefined.
- Stack baseline: Expo React Native, Next.js admin web, Node.js Express, REST, PostgreSQL, Prisma. Local media in development. Hosting provider is not chosen. No application code has been added yet.
- Directories `backend/`, `frontend/`, and `ai-input/` are intentional.
- Still open: watched-coverage formula, parental-consent capture, account-deletion retention, and whether one video may appear in only one lesson.
- `.gitignore` ignores `.env` and `.env.*` except `.env.example`. No `.env.example` exists.

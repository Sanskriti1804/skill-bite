# Agent instructions

SkillBite is a college microlearning project. Current facts are in `MEMORY.md`. This file holds rules. Do not copy the BRD or the ERD into other files.

## Authoritative files

- `SkillBite.md` — business requirements. Do not rewrite it unless the user asks.
- `SkillBite-ERD.md` — logical ERD. It is behind ADR 0002 on lesson progress, video reuse, and attachments. Do not treat the old per-video progress key as current.
- `documentation/decisions/0002-confirmed-answers.md` — accepted answers. It wins where it explicitly resolves an open BRD decision.

## Rules

- One active role on the account. The owner may switch between User and Creator. Do not add a role junction table. Do not let a client grant Admin by switching.
- Server-side authorization is required. Hiding a screen is not authorization.
- Video is the primary content. Supporting PDFs, text files, and hyperlinks are attachments, not new content types.
- A video asset belongs to one lesson. Progress is per lesson.
- Do not treat `last_position_seconds` as proof that the completion threshold was met. Do not recalculate existing completions when the admin changes the threshold.
- Do not add payments, comments, streaks, recommendations, or share-analytics tables.
- The implementation baseline is ADR 0002 (Q-14). Do not invent a different stack. The hosting provider is not chosen.
- `backend/`, `frontend/`, and `ai-input/` are the intended directories.
- Account-status codes (Q-05) and minimum age (Q-25) are not decided. Do not invent them.
- Deleted content and deleted accounts stay recoverable. Do not hard-delete them as the default.
- Do not claim tests passed or that the project is production-ready unless you ran the check and saw the result.

# Agent instructions

SkillBite is a college microlearning project. Current facts are in `MEMORY.md`. This file holds rules. Do not copy the BRD or the ERD into other files.

## Authoritative files

- `SkillBite.md` — business requirements. Do not rewrite it unless the user asks.
- `SkillBite-ERD.md` — logical ERD. It is behind ADR 0002 on lesson progress, video reuse, and attachments. Do not treat the old per-video progress key as current.
- `documentation/decisions/0002-confirmed-answers.md` — accepted answers. It wins where it explicitly resolves an open BRD decision.

## Implementation requests

When the user asks for a numbered implementation phase, follow `.cursor/rules/implementation-phases.mdc`. Do that phase only. Do not start the next phase in the same turn.

## Rules

- One active role on the account. The owner may switch between User and Creator. Do not add a role junction table. Do not let a client grant Admin by switching.
- Server-side authorization is required. Hiding a screen is not authorization.
- Video is the primary content. Supporting PDFs, text files, and hyperlinks are attachments, not new content types.
- Video progress is per user and video. Course progress is calculated from video durations and is not the same record. Recently played means videos.
- Do not treat `last_position_seconds` as proof that the completion threshold was met. Do not recalculate existing completions when the admin changes the threshold.
- Do not add payments, comments, streaks, recommendations, or share-analytics tables.
- The implementation baseline is ADR 0002 (Q-14). Do not invent a different stack. The hosting provider is not chosen.
- `backend/`, `frontend/`, and `ai-input/` are the intended directories.
- Account status is `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. Children under eight require parental consent. Do not add other age limits.
- Do not add account recovery that reconnects progress after a new registration. Password recovery stays. Do not invent a retention period. Deleted content stays recoverable by the admin.
- Do not claim tests passed or that the project is production-ready unless you ran the check and saw the result.
- When files change, end the reply with a summary that names every created, modified, or deleted file and what changed in it.

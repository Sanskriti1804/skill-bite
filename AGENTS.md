# Agent instructions

SkillBite is a college microlearning project. Current facts are in `MEMORY.md`. This file holds rules. Do not copy the BRD or the ERD into other files.

## Authoritative files

- `SkillBite.md` — business requirements. Do not rewrite it unless the user asks.
- `SkillBite-ERD.md` — logical ERD. It is behind ADR 0002 on lesson progress, video reuse, and attachments. Do not treat the old per-video progress key as current.
- `documentation/decisions/0002-confirmed-answers.md` — accepted answers. It wins where it explicitly resolves an open BRD decision.
- `documentation/PRD.md` — product scope. Do not add a feature it leaves open or out of scope.
- `documentation/DESIGN.md` — UI rules for screens that are in the PRD. No UI code exists yet.
- `documentation/architecture.md` — system boundaries. ADR 0002 replaces its “stack not accepted” sentence for the implementation baseline. The hosting provider is still unchosen.
- `documentation/database.md` — physical PostgreSQL model. The ERD remains the logical model.
- `documentation/api.md` — HTTP contract. Only `GET /health` is implemented.

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

## How to change the repo

Inspect the files you will edit, and the callers of anything you change, before writing. Reuse the existing function or module. Do not rewrite a working path to match a new style. Do not edit unrelated files. Do not add a dependency, package script, or config file for a problem the current code already solves.

## Code quality and naming

Match the backend that exists: TypeScript, ESM (`"type": "module"`), `strict` in `backend/tsconfig.json`. Source files are `backend/src/*.ts`. Exported functions are `camelCase` verbs (`createApp`, `loadConfig`). Types and error classes are `PascalCase` (`HttpError`, `AppConfig`). JSON fields in the API are camelCase, as in `documentation/api.md`.

Do not introduce a second language or a second API style. Do not add `any` to get past `strict`. Parse external input with the existing Zod pattern in `backend/src/config.ts` rather than a second validator.

## Folder structure

- `backend/` — API, domain logic, database access, and backend tests. `src/` is application code. `test/` is `node:test` files run by `npm test`.
- `frontend/` — client UI and frontend tests. The directory is not created yet. Do not invent it until a client task needs it.
- `ai-input/` — reference material for AI-assisted work. Do not put runtime code there.
- `documentation/` — design notes. Product decisions stay in the authoritative files above.

Prisma schema and migrations belong under `backend/` when a database task starts. Do not add them early.

## Component reuse

Shared UI follows `documentation/DESIGN.md`: one button, field, status badge, content card, player, empty state, and dialog. Do not create a second component for the same job on mobile and web. User and Creator do not render as two roles at once. Admin UI stays on the web portal.

## Dependencies

Backend dependencies today are `express`, `zod`, and `dotenv`. Dev dependencies are TypeScript, `tsx`, and the Node and Express types. Add a package only when an approved feature needs it, and add the lockfile change with it. Do not add a web framework, ORM, or test runner besides Prisma (when migrations start) and the ADR 0002 stack. Do not upgrade packages as a side effect.

## Type safety

Keep `strict` on. Exported functions take and return explicit types where the compiler would otherwise infer `any` or a wide JSON blob. Do not silence errors with `@ts-ignore` or a cast to `any`. Environment variables enter through `loadConfig`. New required variables get a Zod field and a placeholder in `backend/.env.example` with no secret value.

## Error handling

Throw `HttpError` with an HTTP status and a stable `code`. The response body is `{ "error": { "code", "message" } }`. Unknown routes use `not_found`. Unexpected failures use `internal_error` and the message `Internal error`. Do not put stacks, tokens, SQL, or password hashes in the body or the request log. The log line may include method, path, status, duration, and the error name.

## Security and secrets

Authorization is enforced in the API. Clients do not choose Admin. Do not log `Authorization` or request bodies that contain passwords or tokens. Secrets live in the server environment. `.env` stays untracked. `.env.example` lists names only. Do not return the database URL, Google client secret, hash parameters, or push credentials to a client.

## Database and API access

Clients do not connect to PostgreSQL. Use one database. Follow `documentation/database.md` for tables, keys, and `ON DELETE RESTRICT`. Do not add cascade deletes, a coverage table, consent columns, or row-level security unless a decision in ADR 0002 or the PRD adds them. One video maps to one lesson. Do not mark `completed_at` from `last_position_seconds`.

New routes follow `documentation/api.md`. Implement only paths that file already lists. Do not add webhooks, payment calls, or an analytics API. Google identity tokens are checked on the server. Push delivery failure must not fail playback or progress saves.

## Testing

Run backend checks with `npm test` and `npm run typecheck` in `backend/` when the change affects that package. The runner is `tsx --test test/**/*.ts`. `documentation/testing.md` still says no runner is selected; trust `backend/package.json` for the runner. Add a test next to the behavior you change: auth rejection, ownership, duplicate bookmark or progress, and “seek does not complete” when those paths exist. Do not add browser or device suites before a client exists.

## Documentation

Update the authoritative doc that the change makes wrong. Do not restate the BRD or the ERD in a second file. Leave open decisions open. `documentation/testing.md` and the “stack not accepted” lines in `architecture.md` are stale relative to ADR 0002; do not treat them as permission to skip the baseline or the tests.

## Git and change discipline

Do not commit, push, or open a pull request unless the user asks. Do not commit `.env` or credentials. Do not force-push or skip hooks unless the user explicitly asks. One change should do the requested work. Do not reformat or rename unrelated code in the same edit.

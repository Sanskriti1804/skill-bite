# ADR 0002 — Confirmed answers to open questions

**Status:** accepted for the items marked resolved below. Q-05 and Q-25 are not accepted.

**Context:** The project owner answered the open-question list. `SkillBite.md` remains the requirements document. Where this record explicitly resolves an open decision, implementation follows this record.

The BRD is approved for implementation (Q-02). The word Learner in the BRD is the User role in these answers.

## Resolved

| ID | Decision |
|---|---|
| Q-01 | Video is the primary content type. Creators may attach supporting PDFs, text documents, hyperlinks, and similar materials. Attachments are not separate primary content types. |
| Q-03, Q-04 | An account has one active role. The user may switch that role between User and Creator. Each role has its own UI and server-enforced permissions. Progress, bookmarks, and content are kept. There is no simultaneous two-role grant and no role junction table. |
| Q-06 | Roles are User, Creator, and Admin. One administrator. That admin can delete content and restore it. No multi-admin management. |
| Q-08 | A video needs title, description, creator, video asset, and applicable captions before publish, plus sources, tags, and keywords. A course needs module names, lesson names, and a video on each lesson. Supporting files are optional. The server validates required fields before publish. |
| Q-09 | Lessons may be watched in any order. Display order is required. Positions are unique within the parent course or module. |
| Q-10 | Video progress is one row per user and video (`VIDEO_PROGRESS`). Course progress is calculated from the total duration of that course's videos and the duration completed. Recently played means videos. A course in this MVP is video content only. One video asset per lesson remains the content rule; the ERD cardinality is still zero-to-many until that tightening is approved. |
| Q-11 | The admin configures the completion threshold. The initial value is 90%. Completion uses playback-progress data, not last position alone. Seeking, replay, interrupted sessions, and multiple devices must be handled consistently. Existing completion rows are not recalculated when the threshold changes. |
| Q-12 | Search titles, descriptions, tags, and keywords. Filter by category, including a Trending category. Trending is not a view-count or completion ranking. Learners see published content only. |
| Q-13 | English UI. Loading, empty, error, and success states. Extra screen specs only where a workflow is still ambiguous. |
| Q-14 | Baseline, unless a college rule overrides it: Expo and React Native (TypeScript) for mobile; Next.js (TypeScript) for the web admin UI; Node.js, Express, and TypeScript for the API; REST; PostgreSQL, Prisma, and versioned migrations; server-validated auth with Google sign-in. Local media storage in development; object storage and a CDN in production. Secrets in environment variables. Hosting provider is still an implementation choice. |
| Q-15 | `backend/`, `frontend/`, and `ai-input/` stay. Backend holds the API, domain logic, database access, and backend tests. Frontend holds client UI and frontend tests. `ai-input/` holds reference material for AI-assisted work. |
| Q-16 | Development stores video files locally and keeps the reference in the database. Metadata and files are separate. Deleted content stays recoverable by the admin. Production media must not depend on a developer machine. |
| Q-18 | The application stores verification tokens, sessions, refresh tokens, and push-device tokens. Validation secrets are hashed. Expiry, single-use verification, refresh rotation, revocation, and session invalidation are required. |
| Q-19 | Versioned REST. Document methods, paths, validation, schemas, status codes, errors, pagination, filtering, sorting, auth, rate limiting, and idempotency where a duplicate request would be wrong. |
| Q-20 | Google sign-in accepts a Google identity token checked by the server (signature, issuer, audience, expiry, verified email). An email typed by the client is not enough. Unverified email does not link accounts. |
| Q-21 | Argon2id or another current password hash. Short-lived access tokens, rotating refresh tokens, reuse detection that revokes the token family or session, single-use verification tokens, logout, and account-status checks. Lifetimes and hash parameters follow current guidance and are configuration, not unexplained constants. |
| Q-23 | Users see their own progress, completions, and history. Creators do not lose that data when they switch roles. The admin sees the management data the role allows. Private progress is not readable by another user. |
| Q-24 | No extra numeric performance targets for evaluation. |
| Q-26 | Captions may be uploaded or generated and then reviewed. The record shows which method was used. Captions are not a publish requirement unless a later decision says they are. |

## Partial

**Q-07.** Creators edit drafts before publication. A published video is not edited in place. The creator takes it down and submits the revised video for publication again. That resubmission is the same creator publish path. There is no approval queue. Only the admin deletes and restores content. Deletion stays recoverable by the admin. Whether the creator may change published text without taking the video down is still unspecified.

**Q-11 measurement.** The threshold, the ban on using last position as completion, and the rule that existing completions stay when the threshold changes are accepted. No coverage formula is approved. A proposal, not a decision: count a video complete only when the sum of non-overlapping watched segments reaches the threshold. Do not implement that proposal until it is accepted.

**Q-17.** Reattaching content and progress after a person registers again is not an MVP feature. Password recovery (FR-AUTH-03) remains. FR-PRIV-04 and FR-PRIV-06 still require a deletion and retention description, and that policy is not written. Do not invent a retention period or a permanent-delete rule.

**Q-22.** In-app and push notifications are in scope. Optional messages cover new content the user opted into, learning reminders or milestones, progress and completion, and promotional messages. Essential account and security messages are separate from optional ones. Firebase Cloud Messaging is the stated push example. The event list is still a default, not a closed catalog. Do not send publication-approval notifications unless an approval workflow exists.

## Not resolved

**Q-05.** MVP account statuses are `ACTIVE`, `SUSPENDED`, and `DEACTIVATED`. `ACTIVE` may sign in and call protected APIs allowed by the active role. `SUSPENDED` is an administrator block: no sign-in and no protected API. `DEACTIVATED` is the account-deactivation state in FR-AUTH-08: no sign-in and no protected API. Password-reset tokens are not a substitute for an active account. No extra status is included.

**Q-25.** Children under eight years of age require parental consent. No other age limit is approved. How consent is captured and stored is not specified.

## Consequences

- `VIDEO_PROGRESS` stays unique on `(user_id, video_content_id)`. Course progress is derived. `CONTENT_ATTACHMENT` holds supporting files and links.
- Push event lists and Firebase Cloud Messaging are unchanged. FCM is not a required provider.
- One video must not be referenced by two lessons.
- Role remains a single active `role_id` that the account owner may change between User and Creator. Admin assignment is not a self-service switch.
- Application code may follow the Q-14 baseline. The hosting provider is still unnamed.

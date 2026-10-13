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
| Q-10 | One video asset belongs to one lesson. Progress is stored for the lesson, not reused across lessons. External hyperlinks are supporting materials only. |
| Q-11 | The admin configures the completion threshold. The initial value is 90%. Completion uses playback-progress data, not last position alone. Seeking, replay, interrupted sessions, and multiple devices must be handled consistently. Existing completion rows are not recalculated when the threshold changes. |
| Q-12 | Search titles, descriptions, tags, and keywords. Filter by category. Sort by newest and trending. Trending uses views and completions. Learners see published content only. Unpublished and deleted content stay out of learner discovery. |
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

**Q-07.** Creators manage their own content. Drafts can be edited before publication. Only the admin deletes and restores content. Deletion is recoverable, not an immediate erase. How a creator edits content after it is published is not fully specified. Do not add an approval queue: BR-03 still says creator publishing needs no pre-publication approval. The “approval or rejection” notification in Q-22 applies only if that workflow is explicitly added later.

**Q-11 measurement.** The threshold and the “not last position” rule are accepted. The exact watched-coverage formula is not specified beyond consistent handling of seek, replay, interruption, and multiple devices.

**Q-17.** Deleted accounts must be recoverable: content and progress can be reattached after a later registration once identity is verified. Immediate destruction is not the default. Permanent deletion, anonymization, and the legal retention period are still “according to applicable privacy requirements” and are not a written policy.

**Q-22.** In-app and push notifications are in scope. Optional messages cover new content the user opted into, learning reminders or milestones, progress and completion, and promotional messages. Essential account and security messages are separate from optional ones. Firebase Cloud Messaging is the stated push example. The event list is still a default, not a closed catalog. Do not send publication-approval notifications unless an approval workflow exists.

## Not resolved

**Q-05.** Account-status values are not confirmed. See the question in the decision discussion. Do not treat `ACTIVE`, `SUSPENDED`, and `DELETED` as accepted codes.

**Q-25.** Minimum age and parental consent are not confirmed. The BRD does not define an “under 8” rule.

## Consequences

- `VIDEO_PROGRESS` keyed only by user and video no longer matches Q-10. Progress must be per lesson. The ERD file has not been redrawn in this record.
- Supporting attachments need a place in the data model. They are not a second content type beside video and course.
- One video must not be referenced by two lessons.
- Role remains a single active `role_id` that the account owner may change between User and Creator. Admin assignment is not a self-service switch.
- Application code may follow the Q-14 baseline. The hosting provider is still unnamed.

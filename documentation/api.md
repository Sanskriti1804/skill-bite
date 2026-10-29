# API contract

**Status:** `GET /health` and the unknown-route and error bodies below are implemented in `backend/src/app.ts`. Every `/api/v1` business path is required by `PRD.md` and is not built.

**Sources:** `documentation/PRD.md`, `documentation/architecture.md`, `documentation/database.md`, ADR 0002. This file does not add features those sources leave open.

Prefix for business routes: `/api/v1`. Learner in the BRD is the User role. The server reads the active role and `account_status` from the account. A role sent by the client is ignored except on `PATCH /api/v1/me/role`, which may set only `USER` or `CREATOR`.

Only `ACTIVE` accounts may use protected routes. `SUSPENDED` and `DEACTIVATED` receive 403.

## Formats

- Request and response bodies are JSON. The implemented parser accepts at most 1mb.
- Success bodies are JSON objects. Field names already used in this file are camelCase in JSON (`displayName`, `contentId`, `identityToken`).
- Error body: `{ "error": { "code": string, "message": string } }`. No stack traces, tokens, password hashes, or other users’ data.
- Dates are ISO-8601 timestamps in UTC when a response includes them. That shape is planned. Health does not return a date.

| Status | Use |
|---|---|
| 400 | Validation on a planned route |
| 401 | Missing or invalid session |
| 403 | Role or account status |
| 404 | Missing or not visible. Implemented for unknown paths as `not_found` / `Not found` |
| 409 | Unique conflict or illegal lifecycle transition |
| 500 | Unexpected failure. Implemented code `internal_error`, message `Internal error` |

Invalid JSON currently hits the implemented error handler and returns 500 `internal_error`, not 400. Planned field validation uses 400. Do not put a parser exception in the response.

## Implemented

### `GET /health`

- Auth: none.
- Response: `200 { "status": "ok" }`.
- Does not check a database.

## Auth

| Method and path | Auth | Purpose |
|---|---|---|
| `POST /api/v1/auth/register` | No | Create an account with email, password, display name, and starting role `USER` or `CREATOR`. |
| `POST /api/v1/auth/verify-email` | No | Consume a single-use verification token. |
| `POST /api/v1/auth/login` | No | Email and password. Returns `{ accessToken, refreshToken, expiresIn }`. The refresh token is rotated by `POST /api/v1/auth/refresh` with `{ refreshToken }`. |
| `POST /api/v1/auth/google` | No | Server-verified Google identity token. |
| `POST /api/v1/auth/password-reset` | No | Start password recovery. Response must not reveal whether the email exists. |
| `POST /api/v1/auth/password-reset/confirm` | No | Consume a single-use reset token and set a new password. |
| `POST /api/v1/auth/refresh` | Refresh token | Rotate the refresh token. Reuse revokes the family or session. |
| `POST /api/v1/auth/logout` | Access | Revoke the session and its refresh tokens. |

Register body: `email`, `password`, `displayName`, `role`. Duplicate normalized email is 409. Children under eight require parental consent. How consent is sent is not specified, so this body does not invent a consent field yet.

Google body: `identityToken` only. Unverified email does not link an existing account. Linking a Google identity to an existing local account has no approved extra step beyond a verified Google identity.

## Account

| Method and path | Auth | Purpose |
|---|---|---|
| `GET /api/v1/me` | User, Creator, or Admin | Current account, active role, status. |
| `PATCH /api/v1/me/role` | User or Creator | Switch the active role between `USER` and `CREATOR`. Does not delete progress or content. Cannot set `ADMIN`. |
| `GET /api/v1/admin/users` | Admin | List accounts. |
| `PATCH /api/v1/admin/users/:userId/status` | Admin | Set `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. |

There is no endpoint that reconnects progress after a new registration.

## Discovery

| Method and path | Auth | Purpose |
|---|---|---|
| `GET /api/v1/content` | No | Published content. Query: `q` (title, description, tags, keywords), `category`, `sort=newest`. |
| `GET /api/v1/categories` | No | Active categories, including Trending as a category. |
| `GET /api/v1/content/:contentId` | No for published | One published video or course. Drafts are visible to the owner and Admin only. |

Trending is not a ranking endpoint. No view-count API. Unpublished and deleted content are omitted for learners. Share uses the content URL. There is no share-create endpoint.

## Video and course authoring

Creator or Admin. A creator may change only owned content. Publish has no approval queue.

| Method and path | Purpose |
|---|---|
| `POST /api/v1/videos` | Create a draft video: title, description, sources, tags, keywords. |
| `PATCH /api/v1/videos/:contentId` | Edit a draft. Published videos return 409. |
| `PUT /api/v1/videos/:contentId/media` | Store media. Body `{ mimeType, dataBase64, durationSeconds }`. Development storage is local. |
| `GET /api/v1/videos/:contentId/media` | Read bytes. Published content is readable. A draft is readable by the owner or an admin. |
| `POST /api/v1/videos/:contentId/publish` | Publish when title, description, creator, media, and required metadata exist. |
| `POST /api/v1/videos/:contentId/takedown` | Owner unpublishes so a revision can be edited and published again. |
| `POST /api/v1/videos/:contentId/captions` | Add an uploaded or generated caption. |
| `POST /api/v1/videos/:contentId/attachments` | Optional PDF, text, or hyperlink. |
| `DELETE /api/v1/videos/:contentId/attachments/:attachmentId` | Remove an owned attachment. |
| `POST /api/v1/courses` | Create a draft course. |
| `PATCH /api/v1/courses/:contentId` | Edit a draft course. |
| `POST /api/v1/courses/:contentId/modules` | Add a module with a unique position. |
| `POST /api/v1/modules/:moduleId/lessons` | Add a lesson with a unique position and its own video. |
| `POST /api/v1/courses/:contentId/publish` | Publish when modules, lesson names, and each lesson video meet the video rules. |

Captions are not a publish blocker unless a later decision says they are. Whether published title text can change without takedown is unresolved, so these routes do not allow it.

Admin content:

| Method and path | Purpose |
|---|---|
| `POST /api/v1/admin/content/:contentId/delete` | Soft-delete. Hidden from discovery. Recoverable. |
| `POST /api/v1/admin/content/:contentId/restore` | Restore deleted content. |

## Learning

Authenticated User. Creator data remains when the role switches. Callers cannot read another user's progress.

| Method and path | Purpose |
|---|---|
| `PUT /api/v1/videos/:contentId/progress` | Save resume position for that user and video. |
| `GET /api/v1/me/progress` | That user's video progress, newest `last_watched_at` first. |
| `GET /api/v1/courses/:contentId/progress` | Derived course progress from video durations and completed duration. Not a stored course-progress row. |
| `POST /api/v1/bookmarks` | Body `contentId`. Duplicate is 409. |
| `DELETE /api/v1/bookmarks/:contentId` | Remove one bookmark. |
| `GET /api/v1/me/bookmarks` | That user's bookmarks. |

`completed_at` is not set from last position alone. The coverage formula is not approved, so the progress route must not mark complete until that rule exists. Existing completions are not recalculated when the threshold changes.

## Notifications and settings

| Method and path | Auth | Purpose |
|---|---|---|
| `GET /api/v1/notifications` | Any active role | That user's in-app notifications. |
| `POST /api/v1/notifications/:notificationId/read` | Owner | Set `read_at`. |
| `GET /api/v1/notification-preferences` | Owner | Preferences by type. |
| `PUT /api/v1/notification-preferences/:type` | Owner | Optional messages only. Account and security messages cannot be disabled. |
| `POST /api/v1/devices` | Owner | Register a push device token. |
| `DELETE /api/v1/devices/:deviceId` | Owner | Revoke a device. |
| `GET /api/v1/admin/settings/completion-threshold` | Admin | Read the threshold. Initial value 90. |
| `PUT /api/v1/admin/settings/completion-threshold` | Admin | Change the threshold without rewriting old completions. |
| `GET /api/v1/admin/categories` | Admin | Manage categories. |
| `POST /api/v1/admin/categories` | Admin | Create a category. |
| `PATCH /api/v1/admin/categories/:categoryId` | Admin | Update a category, including Trending as a normal category. |
| `POST /api/v1/admin/tags` | Admin | Create a tag. |
| `PATCH /api/v1/admin/tags/:tagId` | Admin | Update a tag. |
| `GET /api/v1/admin/audit` | Admin | Read audit records. |

The notification event catalog is not closed. Do not add publication-approval events. The push provider is not chosen.

There is no analytics route. Metrics are OD-09. Do not return placeholder numbers.

## Authentication and authorization

Planned. Not implemented.

- Protected routes require a short-lived access token. The server checks signature, issuer, audience, expiry, and the session. Access tokens are not stored (ERD section 2.4).
- Login and refresh establish refresh state. Refresh tokens are stored only as hashes, rotate on use, and reuse revokes the token family or session. Logout revokes the session and its refresh tokens.
- The access token must not be placed in a URL. The Google client secret, database URL, password-hash parameters, and push credentials are server environment values. They are not response fields.
- Authorization uses the stored role and `account_status`. Hiding a screen is not authorization. A creator may change only owned content. Admin routes require the Admin role. Progress, bookmarks, notifications, preferences, and devices are readable only by that `user_id`.
- Password reset does not sign in a `SUSPENDED` or `DEACTIVATED` account.

## Pagination, filtering, and idempotency

No list response is implemented, and no page size is approved. Do not invent a page size or a cursor format. These planned lists must paginate before they can return an unbounded table: `GET /api/v1/content`, `GET /api/v1/admin/users`, `GET /api/v1/me/progress`, `GET /api/v1/me/bookmarks`, `GET /api/v1/notifications`, `GET /api/v1/admin/audit`.

Filtering that is already decided:

| Route | Query |
|---|---|
| `GET /api/v1/content` | `q` searches title, description, tags, and keywords. `category` filters by category, including Trending. `sort=newest` uses `published_at`. No other sort is approved. |
| `GET /api/v1/me/progress` | Newest `last_watched_at` first. No extra filter. |

`PUT /api/v1/videos/:contentId/progress` updates the one row for that user and video. Repeating it must not insert a second row. `POST /api/v1/bookmarks` for an existing pair returns 409. A second publish of an already published video is not a second content row. Duplicate register email is 409.

## External APIs

| Integration | Contract | Failure |
|---|---|---|
| Google sign-in | `POST /api/v1/auth/google` sends `identityToken`. The server checks signature, issuer, audience, expiry, and verified email with Google. A typed email is not accepted as proof. | Invalid token is 401. Google being unreachable is 500 with a generic message. Do not create an account on an unchecked token. |
| Email delivery | Verification and password recovery must be delivered. The provider is not chosen. | The API still stores the hashed single-use token. The response must not reveal whether the mailbox exists. |
| Media storage | `PUT /api/v1/videos/:contentId/media` stores a reference, not the bytes in PostgreSQL. Local disk in development. Object storage and a CDN in production. The provider is not chosen. | A missing or unreadable object is not a successful playback. The content URL stays restricted. |
| Push | `POST /api/v1/devices` stores an encrypted device token. Firebase Cloud Messaging is an example, not a required provider. | Delivery failure does not block playback, progress, or bookmarks. |

No payment provider.

## Webhooks

No inbound webhook is required. Google sign-in uses the identity token on `POST /api/v1/auth/google`. Email and push providers are unnamed, so no provider callback is part of this contract. Do not add a webhook that marks a video complete or that links an account.

## Rate limiting

ADR Q-19 requires rate limiting to be documented. No numeric limit is approved (ADR Q-24). Do not ship a guessed quota.

When limits exist, they apply first to register, login, verify-email, password reset, refresh, and Google sign-in. A limited call returns 429 with the standard error body and no account details. Learning routes are not a substitute for those controls. Health is not an authentication route.

## Environment variables

Loaded today by `backend/src/config.ts`:

| Variable | Required | Values |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | Yes | Integer from 1 to 65535 |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error`. Default `info` |

Not loaded yet. Required before the feature is implemented. Names are not fixed in code, and values stay in the server environment, never in a client bundle or a response:

- Database URL.
- Google audience (client id) used to check the identity token, and the Google client secret if the chosen Google flow needs it.
- Password-hash parameters and token lifetimes.
- Email delivery credentials.
- Push credentials, if a provider is selected.
- Object-storage credentials for production media.

## Privacy and failure handling

- Collect only the fields these routes already name. Do not add a parental-consent field until OD-10 says how it is stored.
- Logs for the implemented server record method, path, status, and duration. They must not record tokens, passwords, or authorization headers. The 500 log records the error name only.
- Password-reset and unknown-user login responses stay generic.
- Shared links to unpublished, removed, or unauthorized content return 404 without the private title, description, or progress.
- A failed progress save does not set `completed_at` and does not show another account’s row.
- Push registration or delivery failure leaves the rest of the API usable.
- Account deletion and retention have no route. OD-11 is open. There is no reconnect-progress endpoint.

## Implementation order

1. Auth and `GET /api/v1/me`.
2. Role switch and admin account status.
3. Categories, tags, video drafts, media, publish, takedown.
4. Courses, modules, lessons.
5. Attachments and captions.
6. Discovery and bookmarks.
7. Video progress and derived course progress.
8. Notifications, devices, completion threshold, audit, admin delete and restore.

## Unresolved

- Parental-consent payload for children under eight.
- Watched-coverage formula, so completion writes stay blocked.
- One video on many lessons is still allowed by the ERD diagram and forbidden by ADR 0002.
- Retention after account deactivation.
- Exact optional notification type codes.
- Push provider.

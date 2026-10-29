# API contract

**Status:** plan for later phases. Only `GET /health` is implemented. Every other path below is required and not built.

Prefix for business routes: `/api/v1`. Learner in the BRD is the User role. The server reads the active role and `account_status` from the account. A role sent by the client is ignored except on `PATCH /api/v1/me/role`, which may set only `USER` or `CREATOR`.

Only `ACTIVE` accounts may use protected routes. `SUSPENDED` and `DEACTIVATED` receive 403.

Error body: `{ "error": { "code": string, "message": string } }`. No stack traces.

| Status | Use |
|---|---|
| 400 | Validation |
| 401 | Missing or invalid session |
| 403 | Role or account status |
| 404 | Missing or not visible |
| 409 | Unique conflict or illegal lifecycle transition |
| 500 | Unexpected failure, generic message |

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
| `POST /api/v1/auth/login` | No | Email and password. Returns a short-lived access token and sets refresh state. |
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
| `PUT /api/v1/videos/:contentId/media` | Store the local media reference. |
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

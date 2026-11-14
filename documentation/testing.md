# Testing

**Status:** runners exist. Backend uses `tsx --test` via `npm test` in `backend/`. Frontend uses the same pattern in `frontend/`. Newman/Postman coverage runs with `npm run test:postman` in `backend/`.

Map cases to requirement IDs in [requirements.md](requirements.md).

## Layers

| Layer | First cases | Status |
|---|---|---|
| Database constraints | Duplicate email, duplicate bookmark, duplicate progress pair, lesson position clash, one video per lesson | Covered in `backend/test/product.test.ts` |
| API authorization | Missing session, wrong role, another creator’s content, inactive account | Covered in product tests and Postman |
| Token lifecycle | Expired, consumed, revoked, concurrent refresh of one token | Covered for verify, reset, refresh reuse, logout |
| Progress | Resume position saved; completion not set from seek-to-end until OD-06 is specified | Covered; progress route does not set `completed_at` |
| Workflow | Register, publish, browse, bookmark, admin change, audit row | Covered by product tests and Postman |
| Frontend states | Loading vs empty, draft list helpers | Covered in `frontend/test/` |

Do not treat browser or device suites as complete until a recorded simulator or browser E2E run exists. Docker Desktop was unavailable during the Phase 9 verification pass on this machine; API E2E used embedded PostgreSQL.

Failure cases the BRD already requires: invalid input, unavailable media, failed progress save, and authentication errors that follow the approved message policy.

## Scenarios

| Priority | Scenario | Expected result | Evidence |
|---|---|---|---|
| High | Register with email and password | One user, one role, password hash only, verification token hashed and expiring | Pass |
| High | Verify email and recover password | Token works once, then fails | Pass |
| High | Google sign-in | Identity unique; unverified email alone does not link accounts | Pass (negative path without configured Google) |
| High | Publish a video and a course as a creator | No approval queue; subtype matches; positions unique | Pass |
| High | Second creator edits the first creator’s content | Rejected | Pass |
| High | Learner bookmarks the same content twice | Second insert rejected | Pass |
| High | Save progress and resume | `last_position_seconds` restored | Pass |
| High | Seek to the end without watching | Completion is not granted from the resume position | Pass |
| Medium | Browse and filter published content | Unpublished content is not shown as available | Pass |
| Medium | Share a content URL | Link resolves to that content | Client copies URL; server detail route Pass |
| Medium | Admin changes a user or content item | Audit row written | Pass |
| Medium | Change an optional notification preference | One row per user and type | Blocked by OD-08; route returns 409 |
| Later | Android, iOS, and both web surfaces | Same account and progress rules | Web build Pass; mobile typecheck Pass; device simulator not run |
| Later | Account deletion | Matches the approved retention rules | Blocked by OD-11, OD-12 |

A scenario is complete only when an automated or recorded manual check has been executed and the result matches the expected column.

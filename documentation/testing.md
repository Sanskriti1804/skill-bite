# Testing

**Status:** planned. No test runner is selected. No test has been executed.

Map cases to requirement IDs in [requirements.md](requirements.md).

## Layers

| Layer | First cases | When |
|---|---|---|
| Database constraints | Duplicate email, duplicate bookmark, duplicate progress pair, lesson position clash, subtype XOR if implemented as a constraint | With the first migration |
| API authorization | Missing session, wrong role, another creator’s content, inactive account | With the first protected route |
| Token lifecycle | Expired, consumed, revoked, concurrent refresh of one token | With auth |
| Progress | Resume position saved; completion not set from seek-to-end until OD-06 is specified | With playback save |
| Workflow | BRD section 10: register, publish, browse, bookmark, admin change, audit row | After the thin vertical slice |

Do not add end-to-end browser or device suites until a client exists. The BRD’s cross-platform checks apply after the four surfaces exist.

Failure cases the BRD already requires: invalid input, unavailable media, failed progress save, and authentication errors that follow the approved message policy.

## Scenarios

| Priority | Scenario | Expected result | Blocked by |
|---|---|---|---|
| High | Register with email and password | One user, one role, password hash only, verification token hashed and expiring | Stack |
| High | Verify email and recover password | Token works once, then fails; expired token fails | Stack |
| High | Google sign-in | Identity unique on provider and provider user id; unverified email alone does not link accounts | Linking rules still open in the BRD |
| High | Publish a video and a course as a creator | No approval queue; subtype matches content type; positions unique inside a course or module | Stack |
| High | Second creator edits the first creator’s content | Rejected | Stack |
| High | Learner bookmarks the same content twice | Second insert rejected | Stack |
| High | Save progress and resume | `last_position_seconds` restored | Stack |
| High | Seek to the end without watching | Completion is not granted from the resume position | OD-06 |
| Medium | Browse and filter published content | Unpublished content is not shown as available | Which statuses are public is still open |
| Medium | Share a content URL | Link resolves to that content | Stack |
| Medium | Admin changes a user or content item | Audit row written; a learner cannot call the same action | Which events are audited is still open |
| Medium | Change an optional notification preference | One row per user and type | Which types exist is an open BRD decision |
| Later | Android, iOS, and both web surfaces | Same account and progress rules | Clients do not exist |
| Later | Account deletion | Matches the approved retention rules | OD-11, OD-12 |

A scenario is complete only when an automated or recorded manual check has been executed and the result matches the expected column. None are complete.

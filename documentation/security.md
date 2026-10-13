# Security

Requirements from BRD sections 9.1 and 9.2, applied to the logical ERD. This is not a penetration-test report. No running system was reviewed.

## Trust boundary

The browser and mobile apps are untrusted. Role, account status, and resource ownership are read from the server-side account record.

## Secrets

| Data | Storage rule |
|---|---|
| Password | `USER.password_hash` only. Never plaintext. Never in logs or audit `details`. |
| Verification and reset token | `AUTH_TOKEN.token_hash` only. |
| Refresh token | `REFRESH_TOKEN.token_hash` only. |
| Access token | Not a table. Validate signature, issuer, audience, and expiry. Server-side revocation of access tokens is not in the ERD. |
| Push token | `encrypted_push_token` if the app must send it again. Hashing alone cannot deliver a push. |

## Token and session lifecycle

As written in `SkillBite-ERD.md`:

- Check purpose, expiry, unused, and unrevoked before `AUTH_TOKEN` is consumed.
- Consume the token in the same transaction as the authorized change.
- Refresh rotation marks the presented token used and inserts the replacement, linked by `replaced_by_token_id`, in one transaction.
- A second use of a consumed refresh token is replay. Whether that revokes the session or the token family is not specified.
- Logout sets `USER_SESSION.revoked_at` and revokes active refresh tokens for that session.
- A session with `revoked_at` set, or `expires_at` in the past, does not authorize.
- Account status is checked as well. Allowed status values are not defined yet.

## Authorization

| Action | Rule |
|---|---|
| Learner playback, bookmark, progress | Authenticated account whose status allows it. Creator access is OD-02. |
| Create or edit content | Creator or administrator, and ownership for non-admin edits (FR-CONT-09). |
| Category, tag, user status, settings | Administrator (FR-ADMIN-04, FR-ADMIN-06). Whether one admin can manage another admin is open (OD-13). |
| Audit read | Administrators. No general user write. |

Do not log passwords, raw tokens, push tokens, or full learning-history dumps. Audit `details` follow the same rule.

## Still required before implementation

- Password hashing algorithm and parameters.
- Access-token format and lifetime.
- Refresh-reuse response.
- Account-status values.
- Google client secrets and database credentials kept out of the repository.

## Checklist

Every row is **not done**.

| Check | Verify by | Status |
|---|---|---|
| Passwords stored only as hashes | Schema and registration code | Not done |
| Verification and reset tokens stored only as hashes, expired, and single-use | Auth tests | Not done |
| Refresh tokens rotated and revocable | Auth tests | Not done |
| Google identity unique on provider plus provider user id | Constraint test | Not done |
| Account has exactly one stored role | Schema and authorization tests | Not done |
| Deactivated or pending accounts cannot use protected actions | Authorization tests | Not done. Status values are undefined |
| Creator cannot modify another creator’s content | Authorization tests | Not done |
| Only administrators manage users, categories, tags, settings, and moderation | Authorization tests | Not done |
| Audit details contain no passwords or raw tokens | Review of audit writes | Not done |
| Push tokens encrypted if stored for delivery | Device registration review | Not done |
| Secrets kept out of the repository | Review of commits and ignore rules | No app secrets exist yet |
| Personal and learning data restricted by role and ownership | Authorization tests | Not done |
| Account deletion and retention | Policy tests | Blocked by open BRD deletion decisions |
| Age and consent | Policy | Open (OD-10) |
| Dependency review | After dependencies exist | Not done |

Do not mark a row done without a recorded test or review.

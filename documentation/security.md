# Security

Requirements from BRD sections 9.1 and 9.2, applied to the logical ERD and the current API. This is not a penetration-test report.

## Trust boundary

The browser and mobile apps are untrusted. Role, account status, and resource ownership are read from the server-side account record. Client route guards are presentation only.

## Secrets

| Data | Storage rule |
|---|---|
| Password | `USER.password_hash` only (Argon2id). Never plaintext. Never in logs or audit `details`. |
| Verification and reset token | `AUTH_TOKEN.token_hash` only. |
| Refresh token | `REFRESH_TOKEN.token_hash` only. |
| Access token | Short-lived JWT. Validate signature, issuer, audience, and expiry. |
| Push token | `encrypted_push_token` with AES-GCM when registered. Hash fingerprint stored for lookup. |

`backend/.env` is gitignored. `backend/.env.example` lists names only. Do not commit real `TOKEN_SIGNING_SECRET`, `PUSH_TOKEN_KEY`, Google secrets, or database passwords.

## Token and session lifecycle

- Check purpose, expiry, unused, and unrevoked before `AUTH_TOKEN` is consumed.
- Consume the token in the same transaction as the authorized change.
- Refresh rotation marks the presented token used and inserts the replacement in one transaction.
- Refresh reuse revokes the session.
- Logout sets `USER_SESSION.revoked_at` and revokes active refresh tokens for that session.
- A session with `revoked_at` set, or `expires_at` in the past, does not authorize.
- Account status is checked. Only `ACTIVE` may sign in or call a protected API.

## Authorization

| Action | Rule |
|---|---|
| Learner playback, bookmark, progress | Authenticated account whose status allows it. |
| Create or edit content | Creator or administrator, and ownership for non-admin edits (FR-CONT-09). |
| Category, tag, user status, settings | Administrator (FR-ADMIN-04, FR-ADMIN-06). |
| Audit read | Administrators. No general user write. |

Do not log passwords, raw tokens, push tokens, or full learning-history dumps. Request logs omit bodies that contain credentials. Audit `details` follow the same rule.

## Checklist

| Check | Verify by | Status |
|---|---|---|
| Passwords stored only as hashes | Schema and registration code | Done |
| Verification and reset tokens stored only as hashes, expired, and single-use | Auth tests | Done |
| Refresh tokens rotated and revocable | Auth tests / Postman | Done |
| Google identity unique on provider plus provider user id | Constraint and google path tests | Done |
| Account has exactly one stored role | Schema and authorization tests | Done |
| Suspended or deactivated accounts cannot use protected actions | Authorization tests | Done |
| Creator cannot modify another creator’s content | Authorization tests | Done |
| Only administrators manage users, categories, tags, settings, and moderation | Authorization tests / Postman | Done |
| Audit details contain no passwords or raw tokens | Review of audit writes | Done for current writers |
| Push tokens encrypted if stored for delivery | Device registration review | Done (delivery provider still open) |
| Secrets kept out of the repository | `.gitignore` and review | Done for current tree |
| Personal and learning data restricted by role and ownership | Authorization tests | Done for implemented routes |
| Account deletion and retention | Policy tests | Blocked by OD-11, OD-12 |
| Age and consent | Policy | Open (OD-10) |
| Dependency review | After a release host exists | Not done |
| Rate limiting | Numeric limits approved | Not done |
| Production email and push providers | Provider choice | Not done |

Do not mark a row done without a recorded test or review.

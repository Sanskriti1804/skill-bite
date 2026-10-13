# Architecture

**State:** proposed. Nothing in this file is implemented.

## Boundaries

Four clients share one set of business rules (`SkillBite.md` section 5.1): Android, iOS, a learner web application, and a creator/administrator web portal.

One logical database (`SkillBite-ERD.md`). Separate databases per client are not justified.

Clients are not trusted for role, account status, ownership, or completion. Authentication and authorization run on the server.

## Proposed shape

```
clients (four surfaces)
    -> application API (authorization, validation, workflows)
        -> relational database (SkillBite-ERD.md)
        -> video storage and playback (provider not chosen)
        -> Google sign-in (required by FR-AUTH-04)
        -> push delivery (provider not chosen)
```

One backend is the recommended default so role checks and progress rules exist once. A different split needs an approved reason (OD-16). The stack is not accepted: `decisions/0001-technology-stack.md`.

| Area | Owns | Does not own |
|---|---|---|
| Clients | Screens, local input, playback UI, calling the API | Final authorization, completion calculation, secrets |
| API | Use cases, transactions, token checks, audit writes | Storing video bytes, unless a later decision says so |
| Database | Keys, uniqueness, foreign keys, checks the engine can express | Subtype XOR and replay detection, unless triggers are added |
| Video host | Media bytes, playback URLs | Course structure |
| Push provider | Device delivery | In-app notification rows |

Background workers, a cache, and a search engine are not a confirmed design. Full-text search for FR-DISC-02 is open (OD-07, OD-16).

Environments must be separated before deployment. Database credentials, the Google client secret, push credentials, and token hashing parameters stay outside source control. No environment files exist because no runtime exists.

## Data flows

These sequences name responsibilities. They are not endpoint contracts.

### Register with email

1. The client sends email and password over the protected API.
2. The API normalizes the email, rejects a duplicate `email_normalized`, stores a password hash, and assigns exactly one role.
3. The API creates an `AUTH_TOKEN` for verification: random secret, stored hash, expiry.
4. The user submits the secret. The API accepts it only if the hash matches, the type is verification, it is unexpired, `consumed_at` is null, and `revoked_at` is null, then sets `consumed_at` in the same transaction as `email_verified_at`.

Password recovery uses the same token rules with a different `token_type`.

### Google sign-in

1. The API validates the Google assertion with Google, not with a client-supplied email alone.
2. Lookup uses unique `(provider, provider_user_id)` on `AUTH_IDENTITY`.
3. Linking an identity to an existing email account is unspecified and must not be improvised.

### Publish

1. The API checks the caller’s role and `account_status`.
2. Insert `CONTENT` and exactly one of `VIDEO_DETAILS` or `COURSE_DETAILS`.
3. A course adds `COURSE_MODULE` and `LESSON` rows. Positions are unique within the parent.
4. A lesson references `VIDEO_DETAILS`. Reuse across lessons is drawn as allowed and is not confirmed by an explicit BRD rule.
5. Creator publish does not require an approval record (BR-03). Administrators can still change status later (FR-CONT-05).

### Resume

1. The API loads `VIDEO_PROGRESS` for the authenticated user and video.
2. The client seeks to `last_position_seconds`.
3. Later saves update that same row.
4. Setting `completed_at` waits for the OD-06 measurement rule. The resume position is not that measurement.

### Bookmark and share

A bookmark insert uses the composite primary key so the same user and content pair cannot be stored twice. Share returns a content URL. No share row is written.

### Administration

Account, content, category, tag, and setting changes go through the API. Where the audit policy requires it, the same transaction writes `AUDIT_LOG` with the acting user. Ordinary clients have no update path to audit rows.

### Deletion

No flow is specified. OD-11 and OD-12 must be decided before cascade rules are implemented.

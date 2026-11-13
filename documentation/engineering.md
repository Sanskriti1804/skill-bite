# Engineering status

The repository is not production-ready. ADR 0002 is the implementation baseline. `backend/` has an Express API, Prisma schema and migrations, `npm test`, `npm run typecheck`, and `npm run test:postman`. `frontend/` is the Next.js client. `mobile/` is the Expo React Native client. No host is chosen. Hosting, CI, and deployment commands stay out of this file until a host exists.

## Current implementation

1. Backend feature APIs match [api.md](api.md).
2. Backend integration checks pass with embedded PostgreSQL.
3. Next.js covers learner, creator, and admin screens with session persistence.
4. Expo covers browse, watch/progress, bookmarks, history, notifications, and account/role switch. Admin and full creator publishing stay web-primary.
5. Open decisions still defer completion marking, notification catalogs, analytics metrics, parental-consent storage, deletion retention, push/email production providers, and hosting.

## Still blocked by open decisions

| Work | Blocker |
|---|---|
| Progress completion writes | OD-06 watched-coverage formula |
| Optional notification preferences and event generation | OD-08 and a push provider |
| Analytics screens with metrics | OD-09 |
| Parental-consent capture | OD-10 |
| Account deletion retention and cascades | OD-11, OD-12 |
| Production media, email, push, and CI/deploy | Hosting and provider choices (OD-16) |

## Vertical slice (done)

Register, verify email, create a standalone video, publish it, play it, save `last_position_seconds`, bookmark it, with authorization tests and database constraints.

Courses and lessons, discovery by category, admin status and audit, Google identity verification on the server, device registration without push delivery, and analytics deferred until OD-09.

Out of this plan: payments, comments, streaks, recommendations, account recovery after a new registration, and trending analytics. Supporting attachments are in scope.

## Gates

### Before release or public accounts

- [x] Server-side authorization tests for protected operations
- [x] No secrets in the repository (`.env` gitignored; `.env.example` names only)
- [ ] Audit events catalog closed (OD-13)
- [ ] Notification triggers listed or notifications deferred (OD-08)
- [ ] Age and consent resolved or registration limited (OD-10)
- [ ] Backup and restore defined for the chosen host (BRD section 9.6)
- [ ] Dependency review after a host and release candidate exist
- [ ] Device simulator / browser E2E recorded against a running stack

### Already true

- [x] MVP exclusions named in the BRD
- [x] One role per account represented by `USER.role_id`
- [x] Token hashing and rotation implemented
- [x] No payment, comment, streak, or recommendation entities

## Operations, when a host exists

Add a file only for a choice that has been made: deployment, configuration (placeholders only), monitoring, backup and recovery, or release and rollback. Do not commit secrets.

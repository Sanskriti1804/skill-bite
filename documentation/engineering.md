# Engineering status

The repository is not production-ready. No application, database, CI workflow, or deployment exists. ADR 0001 is open, so this file does not add package manifests, pipelines, containers, or hosting commands.

## Can start now

1. Approve the BRD draft, or limit the demonstration to that draft.
2. Resolve OD-06, OD-03, OD-04, OD-11, and OD-16 first. They block completion, publishing rules, deletion, and any schema.
3. Accept or replace ADR 0001 with a database and an API style.
4. Treat `SkillBite-ERD.md` as the only ERD. Older Mermaid fragments are not in this repository.

## Blocked

| Work | Blocker |
|---|---|
| Migrations | Database engine, delete rules, status values |
| Auth implementation | Hashing choice, Google app registration, replay policy |
| Video upload | Media host |
| Progress completion | OD-06 |
| Notifications | OD-08 and a push provider |
| Analytics screens | OD-09 |
| CI and deployment | A stack and a host |
| API endpoint files | An accepted API style |

## After the stack is accepted

Build one vertical slice first: register, verify email, create a standalone video, publish it, play it, save `last_position_seconds`, bookmark it. Include authorization tests and the database constraints that slice touches.

Then: courses and lessons, discovery by category, admin status and audit, Google sign-in, push and in-app notifications, analytics derived from progress rows.

Out of this plan: payments, comments, streaks, recommendations, account recovery after a new registration, and trending analytics. Supporting attachments are in scope.

## Gates

### Before application code

- [ ] BRD approved, or the demonstration explicitly limited to the current draft
- [ ] OD-16 stack accepted (ADR 0001)
- [ ] Account-status values and who may publish (OD-02, OD-03, OD-04)
- [ ] Completion measurement (OD-06), or completion UI deferred
- [ ] Deletion left unimplemented until OD-11 and OD-12
- [ ] Password hashing, refresh-replay policy, and secret handling recorded as decisions

### Before a database migration

- [ ] Database engine chosen
- [ ] Unique constraints from the ERD implemented
- [ ] Subtype XOR strategy chosen
- [ ] Foreign-key delete actions written only after OD-11 and OD-12
- [ ] Migration tested on an empty database and a rollback path recorded

### Before release or public accounts

- [ ] Server-side authorization tests for every protected operation
- [ ] No secrets in the repository
- [ ] Audit events listed (OD-13)
- [ ] Notification triggers listed or notifications deferred (OD-08)
- [ ] Age and consent resolved or registration limited (OD-10)
- [ ] Backup and restore defined for the chosen host (BRD section 9.6)
- [ ] Dependencies reviewed after they exist

### Already true in the documents

- [x] MVP exclusions named in the BRD
- [x] One role per account represented by `USER.role_id`
- [x] Token hashing and rotation described in the ERD
- [x] No payment, comment, streak, or recommendation entities

## Operations, when a host exists

Add a file only for a choice that has been made: deployment, configuration (placeholders only), monitoring, backup and recovery, or release and rollback. Do not commit secrets.

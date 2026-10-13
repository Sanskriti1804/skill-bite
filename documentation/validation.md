# BRD and ERD validation

Reviewed against the files in the repository. The BRD and root ERD were not rewritten during that review.

**Later note:** the partial Mermaid files named below (`documentation/database/diagrams/*.mmd`) are not in the repository now. `SkillBite-ERD.md` is the only ERD file. The findings about those fragments are kept because they describe a real disagreement that existed when the review was written.

## Repository evidence at review time

Present then:

- `SkillBite.md` — BRD, status “Draft for requirements validation.”
- `SkillBite-ERD.md` — logical ERD with token lifecycle and a constraint section.
- `documentation/database/diagrams/04-course-structure.mmd` through `08-admin.mmd`.

Absent then: application source, tests, dependency manifests, migrations, CI, environment examples, and a selected database engine. That absence is still true.

## BRD

The BRD states scope, three roles with one role per account, Must requirements with IDs, exclusions, business rules BR-01 through BR-10, non-functional areas without invented numeric targets, and open decisions OD-01 through OD-16.

Usable as the requirements source. Not approved. Several Must items depend on an Open item before they can be tested:

| Must | Blocked by |
|---|---|
| FR-AUTH-08 deletion process | OD-11, OD-12 |
| FR-CONT-04 creator content operations | OD-03, OD-04 |
| FR-CONT-07 and FR-SHARE-03 visibility | OD-03 |
| FR-PROG-04 completion | OD-06 |
| FR-NOTIF-01 and FR-NOTIF-02 | OD-08 |
| FR-AN-01 and FR-AN-02 | OD-06, OD-09 |
| FR-PRIV-03 and FR-PRIV-04 | OD-10, OD-11 |
| Captions in section 9.4 | OD-14 |

No contradictory Must statements were found inside the BRD. Ambiguity is explicitly marked Open. Downloadable resources are excluded until OD-01 is decided.

## ERD against the BRD

The root ERD covers accounts, one role, email/password fields, Google identity, verification and recovery tokens, sessions, refresh-token rotation, shared content with video and course subtypes, modules, lessons, captions, categories, tags, bookmarks, one current progress row per user and video, notifications, preferences, push devices, audit log, and platform settings.

Sharing has no table. That matches URL sharing in FR-SHARE-01.

Excluded MVP features (payments, comments, streaks, recommendations) have no tables.

### Mismatches and gaps (not silently resolved)

1. **Lesson completion vs video progress.** FR-PROG-04 and BR-06 are lesson completion. `VIDEO_PROGRESS` is unique per `(user_id, video_content_id)`. If one video is used in two lessons, one row cannot represent two lesson outcomes. The partial diagram `06-progress.mmd` used a different key: composite primary key `(user_id, video_content_id)` instead of `progress_id` plus a unique pair.
2. **Watched percentage.** The ERD stores `last_position_seconds` and `completed_at`. It does not store qualifying watched coverage. OD-06 is still open. Completion must not be inferred from the resume position.
3. **Subtype picture vs rule.** The diagram shows each content row with zero or one `VIDEO_DETAILS` and zero or one `COURSE_DETAILS`. The ERD text requires exactly one matching subtype and not both. Mermaid does not enforce that XOR. It needs a trigger or a single transaction that inserts the parent and the one subtype.
4. **Deletion.** Deletion behavior must be defined. Relationship labels do not state `RESTRICT`, `CASCADE`, or `SET NULL`. OD-11 and OD-12 are still open, so a delete matrix must not be treated as a confirmed rule.
5. **Allowed values.** Content status, account status, token type, and push platform values are not listed on the diagram.
6. **Uniqueness annotations.** Unique `(provider, provider_user_id)`, module position, lesson position, caption `(video, language, format)`, and progress `(user, video)` are required by the ERD text. Those composites were not marked on the diagram attributes.
7. **Partial diagrams were stale.** They had no account or refresh-token diagram. `04-course-structure.mmd` marked video reuse as open, while the root ERD draws `VIDEO_DETAILS` to `LESSON` as zero-to-many. Those fragment files are no longer in the tree.
8. **Auth storage is conditional.** `AUTH_TOKEN`, `USER_SESSION`, `REFRESH_TOKEN`, and `PUSH_DEVICE` assume the application stores those secrets. OD-16 and the auth provider choice can remove or relocate them. They are a proposed logical design, not a confirmed physical schema.
9. **Audit and notification targets** (`target_id`, `target_reference`) are not foreign keys.

`REFRESH_TOKEN` separated from `USER_SESSION` matches the lifecycle in the ERD. It is a design choice in that document, not a separate BRD requirement.

## Checks not run

No database was created. Constraints were not executed. Mermaid was not rendered in a CLI. Diagram syntax was reviewed by reading the fenced diagram in `SkillBite-ERD.md`.

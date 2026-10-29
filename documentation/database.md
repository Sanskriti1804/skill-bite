# Database

The logical model is [SkillBite-ERD.md](../SkillBite-ERD.md). That file owns entity names, attributes, keys, relationships, and the token lifecycle.

## How to read it

- One database for all clients. Do not split learner data by Android, iOS, or web.
- `USER.role_id` means one role per account.
- `CONTENT` holds shared fields. `VIDEO_DETAILS` and `COURSE_DETAILS` hold the subtype. The ERD text requires exactly one matching subtype. Diagram lines alone do not enforce that.
- `VIDEO_PROGRESS` is the current row for a user and a video. Resume uses `last_position_seconds`. That column does not prove the completion threshold. Course progress is calculated from video durations and is not a second progress table. `CONTENT_ATTACHMENT` stores supporting PDFs, text files, and hyperlinks.
- Sharing has no table. Payments, comments, streaks, and recommendations have no tables.

## Not in this repository

| Item | Why it is absent |
|---|---|
| A second data dictionary | Attributes are already defined on the ERD |
| SQL migrations | No database engine is selected (ADR 0001) |
| Physical types, indexes, and cascade clauses as an approved schema | Engine and retention decisions are still open |
| Separate Mermaid fragment files | They are not in the tree. `SkillBite-ERD.md` is the diagram |

When an engine is accepted, add migration files in the place that engine expects, and record naming and rollback in this file. Do not add them before then.

Known gaps between the BRD and the ERD are recorded in [validation.md](validation.md).

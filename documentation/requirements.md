# Requirements

`SkillBite.md` is the only requirements specification. This file does not repeat it. It maps requirement IDs to the logical ERD and to checks that do not exist yet.

Non-functional topics already named in the BRD, without numeric targets: security, privacy, accessibility (English and captions), and reliable playback, progress save, search, and content retrieval. Performance numbers, availability targets, and jurisdictions are unresolved. Do not invent them here.

| ID | Rule | Entities | Enforcement beyond the diagram | Verification when built |
|---|---|---|---|---|
| FR-AUTH-01 | — | `USER.password_hash` | Hash only; reject weak or missing passwords in the server | Registration tests |
| FR-AUTH-02, FR-AUTH-03 | — | `AUTH_TOKEN` | Hash, expiry, single use, purpose check | Token consume-once tests |
| FR-AUTH-04 | — | `AUTH_IDENTITY` | Unique `(provider, provider_user_id)`; do not link on unverified email alone | Google sign-in cases |
| FR-AUTH-05, BR-02 | One role | `USER.role_id` | Server reads the stored role | Role assignment tests |
| FR-AUTH-06, BR-09, BR-10 | — | all protected rows | Authorization on the server | Forbidden-access tests |
| FR-AUTH-07 | — | `USER.account_status` | Allowed statuses and transitions still undefined | Blocked until status values exist |
| FR-AUTH-08, FR-PRIV-04 | — | `USER.deleted_at` and related rows | Deletion and retention are OD-11 | Blocked |
| FR-CONT-01, FR-CONT-02, BR-04 | — | `CONTENT`, subtypes, `COURSE_MODULE`, `LESSON` | Subtype XOR | Create video and course |
| FR-CONT-03, BR-03 | No mandatory approval | `CONTENT.status` | Publish path for a creator | Publish without an approval queue |
| FR-CONT-05, FR-ADMIN-03 | — | `CONTENT`, `AUDIT_LOG` | Admin-only | Authorization tests |
| FR-CONT-06, FR-ADMIN-04 | — | `CATEGORY`, `TAG`, junctions | Admin-only tag and category changes | Management tests |
| FR-CONT-09 | — | `CONTENT.creator_id` | Ownership check; the foreign key is not authorization | Cross-creator update rejected |
| FR-DISC-01–05 | — | `CONTENT`, category and tag junctions | Only learner-visible statuses; search engine is undecided | Browse and filter tests |
| FR-PROG-02, FR-PROG-03, BR-05 | — | `VIDEO_PROGRESS.last_position_seconds` | One row per user and video | Save and resume |
| FR-PROG-04, BR-06 | 90% initial threshold | `SYSTEM_SETTING`, `completed_at` | Measurement is OD-06 | Blocked for the completion assertion |
| FR-PROG-06 | History and continue | `VIDEO_PROGRESS.last_watched_at` | Current-state list only; no session history table | List by last watched |
| FR-PROG-07 | — | `BOOKMARK` | Composite primary key | Duplicate bookmark rejected |
| FR-SHARE-01, FR-SHARE-02 | — | none | Stable content URL | Link opens available content |
| FR-NOTIF-01 | — | `NOTIFICATION` | Triggers are OD-08 | Blocked for event list |
| FR-NOTIF-02 | — | `PUSH_DEVICE` | Provider is undecided | Blocked |
| FR-ADMIN-05, FR-AN-01, FR-AN-02 | — | progress rows | Metrics are OD-09; derive, do not add aggregate tables yet | Blocked |
| FR-ADMIN-06 | — | `SYSTEM_SETTING` | Admin-only; threshold range check | Setting update audited |
| FR-ADMIN-07 | — | `AUDIT_LOG` | Event list is OD-13; polymorphic target is not a foreign key | Admin action writes a row |
| FR-PRIV-01, FR-PRIV-02 | BR-10 | — | Minimize fields; authorize reads | Access tests |
| NFR security | — | token hashes | No raw tokens or passwords in logs | Log review |
| Exclusions BR-01, BR-07, BR-08 | — | no tables | Do not add payment, comment, streak, or recommendation entities | Schema review |

Open decisions OD-01 through OD-16 stay in the BRD. They are not closed here.

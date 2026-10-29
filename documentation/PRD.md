# SkillBite — Product Requirements Document

**Status:** Draft, aligned to the approved BRD (`SkillBite.md`) and accepted decisions in `documentation/decisions/0002-confirmed-answers.md`.

**Document purpose:** Product source of truth for implementation. Where this file and the BRD differ, ADR 0002 wins on items it explicitly resolves. Unresolved BRD items stay open. This document does not replace `SkillBite.md` or the ERD.

**Product:** SkillBite, a college microlearning project. Free in the MVP.

**Assumption (labeled):** Screen names below are the workflows the BRD already requires. ADR Q-13 says not to add extra screen specifications except where a workflow is still ambiguous. They are not a separately approved UI inventory.

---

## 1. Problem statement

Educational material is spread across formats and platforms. Learners have trouble finding relevant material, continuing from where they stopped, keeping useful content together, and seeing learning progress. Creators need a direct way to publish educational videos and to organize them into structured courses.

SkillBite is one platform for short educational videos, structured courses, discovery, automatic progress, and creator publishing, with administration of users, content, categories, settings, and basic analytics.

Measurable business impact is not established. Do not treat unstated outcomes as confirmed.

## 2. Value proposition

- Learners discover and watch short videos and courses, resume automatically, bookmark, review watch history, and share eligible content.
- Creators publish standalone videos and courses (modules and lessons) without a mandatory approval queue.
- Administrators manage accounts, content, categories, tags, approved settings, audit records, and basic progress analytics.
- The same learning and publishing experience is available on Android, iOS, a learner web application, and a creator/administrator web portal.
- The MVP is free. Payments, comments, streaks, and personalized recommendations are excluded.

## 3. Target users

| User | Who they are | What they need |
|---|---|---|
| User (BRD “Learner”) | Person who consumes educational content | Register, discover, watch, resume, bookmark, share, see own progress |
| Creator | Person who publishes educational videos and courses | Create drafts, publish without an approval queue, organize courses |
| Administrator | One platform administrator | Manage users and content, categories, tags, settings, analytics, audit |
| Project owner / student team | Builders of the academic project | Requirements, implementation, documentation, demonstration |
| Project evaluator / faculty | Reviewers | Functionality, documentation, decisions, quality |

Named individuals for stakeholder roles are outside this document.

The account owner may switch the single active role between User and Creator. Progress, bookmarks, and content are kept. Admin is not a self-service switch. There is one administrator and no multi-admin management.

## 4. Product goals

1. Register, authenticate, and reach only authorized features.
2. Discover and watch educational video.
3. Support standalone videos and structured courses.
4. Save progress automatically and resume.
5. Track video completion with an admin-configurable threshold, initially 90%. Course progress is calculated separately.
6. Bookmarks, watch history, continue learning, and sharing.
7. Creator publishing without mandatory pre-publication approval.
8. Administration: users, content moderation, categories, settings, audit logs, basic analytics.
9. In-app and push notifications.
10. A base for later work that does not pull deferred features into the MVP.

## 5. Core user journeys

### 5.1 User (learner)

1. Register or sign in (email/password or Google). Complete email verification when it applies.
2. Browse or search. Filter by category, including Trending. Trending is a category, not a ranking.
3. Open a published standalone video or course. Lessons may be watched in any order. Display order is required.
4. Watch. Progress saves automatically. Resume from the last saved position.
5. Bookmark content. View watch history and continue-learning (recently played means videos).
6. See own progress and completion. Share eligible content.
7. Receive in-app and push notifications that are actually defined. The event catalog is still open (OD-08).

Only `ACTIVE` accounts may sign in and call protected APIs. `SUSPENDED` and `DEACTIVATED` cannot.

### 5.2 Creator

1. Register and switch the active role to Creator, or sign in already as Creator.
2. Create a standalone video or a course with modules/sections and lessons.
3. Supply required fields. The server validates them before publish.
4. Edit the draft before publication.
5. Publish with no approval queue. Published content is available under visibility rules. Learners see published content only.
6. A published video is not edited in place. The creator takes it down and publishes the revision again on the same publish path.
7. Only the administrator deletes or restores content. Deletion stays recoverable by that administrator.

**Still open:** whether published text (title and similar metadata) may change without taking the video down (ADR Q-07, partial).

### 5.3 Administrator

1. Sign in as the single Administrator.
2. View and manage user accounts and status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`).
3. Review, publish, unpublish, or remove content. Restore deleted content.
4. Manage categories and tags.
5. View basic usage and learning analytics. Exact metrics are OD-09.
6. Configure approved settings, including the completion threshold.
7. Inspect audit records of defined administrative actions. The event list is OD-13.

The administrator does not manage other administrators.

## 6. User stories

Stories restate approved requirements. They do not add scope.

| ID | Story |
|---|---|
| FR-AUTH-01 | As a visitor, I register with email and password so I can use the platform. |
| FR-AUTH-02 | As a new user, I verify my email when the flow requires it. |
| FR-AUTH-03 | As a user who forgot a password, I recover it. Recovery does not restore progress onto a new registration. |
| FR-AUTH-04 | As a visitor, I sign in with Google. The server checks the Google identity token. A client-typed email is not enough. Unverified email does not link accounts. |
| FR-AUTH-05 | As an account owner, I have one active role: User, Creator, or Admin. I may switch only between User and Creator. |
| FR-AUTH-06 | As any user, protected operations follow my server-side role. Hiding a screen is not authorization. |
| FR-AUTH-07 | As an administrator, I set account status. |
| FR-AUTH-08 | As a user or administrator, deactivation and deletion follow the approved process. Retention after deletion is not defined (OD-11). |
| FR-AUTH-09 | As a user who fails sign-in, verification, or recovery, I get feedback that does not expose secrets. |
| FR-CONT-01 | As a creator, I publish a standalone educational video. |
| FR-CONT-02 | As a creator, I publish a course of modules/sections and lessons. |
| FR-CONT-03 | As a creator, I publish without waiting for approval. |
| FR-CONT-04 | As a creator, I use the approved content operations: create, edit drafts, take down a published video, and publish the revision. |
| FR-CONT-05 | As an administrator, I review, publish, unpublish, remove, and restore content. |
| FR-CONT-06 | As an administrator, I manage categories and tags. |
| FR-CONT-07 | As a user, I see content that is published and allowed for me. |
| FR-CONT-08 | As a creator, publish is rejected until required fields are present. |
| FR-CONT-09 | As a creator, I cannot change another creator’s content. |
| FR-DISC-01–05 | As a user, I browse, search, and filter published content without personalized recommendations. |
| FR-PROG-01–03 | As a user, I play a video, have progress saved, and resume. |
| FR-PROG-04 | As a user, video completion uses the configured threshold. Course progress is calculated from video durations. Last position alone is not completion. |
| FR-PROG-05–07 | As a user, I see my progress, history, continue-learning, and bookmarks. |
| FR-SHARE-01–03 | As a user, I share eligible videos and courses. A link opens available content. A known URL does not unlock restricted content. |
| FR-NOTIF-01–02 | As a user, I can receive in-app and push notifications. Triggers and preferences are OD-08. |
| FR-ADMIN-01–07 | As the administrator, I manage users, status, content, categories, tags, settings, and I leave an audit record. |
| FR-AN-01–02 | As the administrator, I see basic progress and completion analytics derived from recorded activity. |
| FR-PRIV-01–05 | Personal and learning data stay limited to the purpose and the authorized reader. Children under eight require parental consent. How consent is stored is unspecified. |

## 7. Features and functional requirements

Priority: **Must** = agreed MVP. **Open** = do not implement a guessed rule.

### 7.1 Authentication and accounts

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Register with email and password. Passwords are hashed (Argon2id or another current hash). Reject weak or missing passwords on the server. | Must |
| FR-AUTH-02 | Email verification. Tokens are stored hashed, expire, and are single use. | Must |
| FR-AUTH-03 | Password recovery. Reset tokens do not bypass a non-active account. | Must |
| FR-AUTH-04 | Google sign-in. Server validates signature, issuer, audience, expiry, and verified email. | Must |
| FR-AUTH-05 | One active role: User, Creator, or Admin. Owner may set only User or Creator. No role junction table. | Must |
| FR-AUTH-06 | Server authorization on protected operations. | Must |
| FR-AUTH-07 | Status values are only `ACTIVE`, `SUSPENDED`, and `DEACTIVATED`. Only `ACTIVE` may sign in and call protected APIs. | Must |
| FR-AUTH-08 | Deactivation and a defined deletion process. | Must |
| FR-AUTH-09 | Invalid credentials, verification failures, and recovery failures do not leak sensitive information. | Must |
| FR-AUTH-10 | Closed by ADR Q-03, Q-04, and Q-06 for role switching and a single admin. Creator use of learner data is kept across the switch (Q-23). | Resolved |

Sessions: short-lived access tokens, rotating refresh tokens, reuse detection that revokes the token family or session, logout, and session invalidation. Lifetimes are configuration.

### 7.2 Content and courses

| ID | Requirement | Priority |
|---|---|---|
| FR-CONT-01 | Standalone educational videos. | Must |
| FR-CONT-02 | Courses with modules/sections and lessons. Display order is required. Positions are unique within the parent. | Must |
| FR-CONT-03 | Publish without an approval queue. | Must |
| FR-CONT-04 | Creator operations in section 5.2. | Must |
| FR-CONT-05 | Admin review, publish, unpublish, remove, restore. | Must |
| FR-CONT-06 | Category and tag management is admin-only. | Must |
| FR-CONT-07 | Availability follows visibility and status. Learners see published content only. | Must |
| FR-CONT-08 | Validate before publish. Video: title, description, creator, video asset, and applicable captions, plus sources, tags, and keywords. Course: module names, lesson names, and a video on each lesson. Supporting files are optional. | Must |
| FR-CONT-09 | Ownership check. A creator cannot update another creator’s content. | Must |
| FR-CONT-10 | Draft edit, takedown, republish, and admin-only delete/restore are decided. In-place edit of a published video is not allowed. Published-metadata edits without takedown are still unspecified. | Partial |
| FR-CONT-11 | Supporting PDFs, text documents, and hyperlinks are in the MVP as attachments, not primary content types. No document-reading progress. | Must |

One video asset per lesson is the content rule. One video must not be referenced by two lessons. Lessons may be watched in any order.

**Publish vs captions:** ADR Q-08 lists applicable captions among video publish inputs. ADR Q-26 says captions are not a publish requirement unless a later decision says they are, and that captions may be uploaded or generated and then reviewed, with the method recorded. **Decision requiring approval:** treat Q-26 as the later explicit rule (captions are not a publish blocker) until the project owner confirms that Q-08’s “applicable captions” means something else.

### 7.3 Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-DISC-01 | Browse available content. | Must |
| FR-DISC-02 | Search titles, descriptions, tags, and keywords. | Must |
| FR-DISC-03 | Discover through categories, including Trending. Trending is not a view-count or completion ranking. | Must |
| FR-DISC-04 | Filter by category. | Must |
| FR-DISC-05 | Discovery does not require personalized recommendations. | Must |
| FR-DISC-06 | Sorting, featured content, and any filter beyond category are not approved (OD-07). Do not invent them. | Open |

Empty search results are stated clearly. Content that is not learner-visible is excluded.

### 7.4 Playback and progress

| ID | Requirement | Priority |
|---|---|---|
| FR-PROG-01 | Play available videos. | Must |
| FR-PROG-02 | Save progress automatically. One progress row per user and video. | Must |
| FR-PROG-03 | Resume from the last saved position. | Must |
| FR-PROG-04 | Completion threshold starts at 90% and is admin-configurable. Course progress is calculated from total video duration and duration completed. It is not the same record as video progress. | Must |
| FR-PROG-05 | Show the learner their own progress and completion. | Must |
| FR-PROG-06 | Watch history and continue-learning from current progress (`last_watched_at`). No session-history table. | Must |
| FR-PROG-07 | Bookmarks. A duplicate bookmark for the same user and content is rejected. | Must |
| FR-PROG-08 | Do not treat last playback position as proof of completion. Do not recalculate existing completions when the threshold changes. Seeking, replay, interrupted sessions, and multiple devices must be consistent once a formula exists. **No coverage formula is approved.** A video must not be marked complete until that rule is accepted. Proposal only, not a decision: sum of non-overlapping watched segments. | Open |

### 7.5 Sharing

| ID | Requirement | Priority |
|---|---|---|
| FR-SHARE-01 | Share eligible videos and courses. | Must |
| FR-SHARE-02 | A stable link opens the content when it is still available. | Must |
| FR-SHARE-03 | Unpublished, removed, or restricted content stays unavailable if only the URL is known. | Must |

No share-analytics table.

### 7.6 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-NOTIF-01 | In-app notifications. | Must |
| FR-NOTIF-02 | Push notifications on supported platforms. Firebase Cloud Messaging is an example, not a required provider. | Must |
| FR-NOTIF-03 | Event list, preferences, permission handling, and failure behavior. Optional examples, not a closed catalog: new content the user opted into, learning reminders or milestones, progress and completion, promotional messages. Essential account and security messages are separate from optional ones. Do not send publication-approval notifications. | Open |

Push permission denial or delivery failure must not block learning.

### 7.7 Administration and analytics

| ID | Requirement | Priority |
|---|---|---|
| FR-ADMIN-01 | View and manage user accounts. | Must |
| FR-ADMIN-02 | Manage account status. | Must |
| FR-ADMIN-03 | Review, publish, unpublish, remove, and restore content. | Must |
| FR-ADMIN-04 | Manage categories and tags. | Must |
| FR-ADMIN-05 | Basic usage and learning analytics. | Must |
| FR-ADMIN-06 | Approved platform settings, including the completion threshold, with a range check. Admin-only. | Must |
| FR-ADMIN-07 | Audit log of defined administrative actions. Ordinary users cannot edit audit rows through the application. The event list is OD-13. | Must |
| FR-ADMIN-08 | Single admin is decided. The audited-event catalog is not. | Partial |
| FR-AN-01 | Basic learner progress analytics, derived, not a separate aggregate table until metrics are approved. | Must |
| FR-AN-02 | Basic lesson/course completion analytics, using the approved completion rule. | Must |
| FR-AN-03 | Exact metrics, views, and audience. | Open |

Private progress is not readable by another user. Creators keep their own progress data when they switch roles. The admin sees management data the role allows.

### 7.8 Privacy and account lifecycle

| ID | Requirement | Priority |
|---|---|---|
| FR-PRIV-01 | Collect only personal data needed for agreed functionality. | Must |
| FR-PRIV-02 | Authorize reads of personal and learning data. | Must |
| FR-PRIV-03 | Consent where required. | Must |
| FR-PRIV-04 | Document deactivation, deletion, and retention. The policy text is not written. | Must, policy open |
| FR-PRIV-05 | Children under eight require parental consent. No other age limit. Capture and storage of consent are unspecified. | Must, method open |
| FR-PRIV-06 | Retention of progress, bookmarks, history, and creator content after account deletion. | Open |

Reconnecting progress after a new registration is out of scope. Do not invent a retention period or a permanent-delete rule. Deleted content stays recoverable by the admin.

### 7.9 Business rules

| ID | Rule |
|---|---|
| BR-01 | MVP is free. No payments or subscriptions. |
| BR-02 | One active role. |
| BR-03 | No mandatory pre-publication approval. |
| BR-04 | A course is modules/sections and lessons. Video is the primary content. |
| BR-05 | Progress is saved automatically. |
| BR-06 | Configurable completion threshold, initial 90%. Course progress is separate. Last position is not completion. |
| BR-07 | No personalized recommendations or streaks. |
| BR-08 | No comments or community interactions. |
| BR-09 | Administrative operations are authorized on the server. |
| BR-10 | Personal and learning data are protected from unauthorized access. |

## 8. Non-functional requirements

Numeric response-time, availability, and capacity targets are not required for evaluation (ADR Q-24). Do not invent them.

### 8.1 Security

- Enforce authentication and authorization on the server.
- Do not store passwords in plaintext. Store validation secrets hashed.
- Do not put credentials, tokens, or secrets in source or client-visible configuration. Use environment variables.
- Validate input at trust boundaries.
- Use safe database access.
- Check permission and resource ownership on sensitive operations.
- Fail authentication and protected operations without leaking secrets. Do not log raw tokens or passwords.
- Review dependencies and configuration for known risks.
- Versioned REST. Document methods, paths, validation, schemas, status codes, errors, pagination, filtering, sorting, auth, rate limiting, and idempotency where a duplicate request would be wrong.

### 8.2 Privacy

- Minimize collected fields.
- Restrict data by role and ownership.
- Consent, retention, and deletion stay explicit where still open.
- Do not expose sensitive details in errors, logs, URLs, or analytics.
- Age rule: under eight needs parental consent before that audience can register. The consent record is unspecified.

### 8.3 Performance and reliability

- Playback, progress save, search, and content retrieval should be reliable for expected college-project use.
- Network failure and unavailable content produce understandable errors.
- Progress updates must not create invalid completion states, including duplicate or out-of-order updates.
- No extra numeric performance targets.

### 8.4 Usability and accessibility

- English UI.
- Loading, empty, error, and success states (section 11).
- Video captions/subtitles. Method may be upload or generation followed by review. The record stores which method was used.
- Usable on the supported screen sizes for Android, iOS, learner web, and creator/admin web.

### 8.5 Maintainability

- Keep this PRD, the BRD, ADR 0002, design, and implementation aligned when a decision changes.
- Consistent validation, authorization, and errors.
- Automated tests for important business rules.
- Version control. Document setup and how to run the application.
- Baseline stack unless a college rule overrides it: Expo and React Native (TypeScript) for mobile; Next.js (TypeScript) for the web admin UI; Node.js, Express, and TypeScript for the API; REST; PostgreSQL, Prisma, and versioned migrations. Directories: `backend/`, `frontend/`, `ai-input/`. Hosting provider is not chosen.

### 8.6 Data integrity and recovery

- Keep valid relationships among accounts, content, courses, lessons, and progress.
- Reject unauthorized or invalid updates.
- Define backup and recovery for the chosen environment.
- Document migrations where a persistent database is used.
- Development stores media locally and keeps the reference in the database. Metadata and files are separate. Production media must not depend on a developer machine. Production uses object storage and a CDN. The provider is unnamed.

## 9. Pages and screens

These surfaces are implied by approved workflows. Layout detail is not specified.

| Surface | Who | Purpose |
|---|---|---|
| Register | Visitor | Email/password registration |
| Sign in | Visitor | Email/password and Google |
| Verify email | User | Complete verification |
| Password recovery | Visitor | Request and complete reset |
| Browse / search / category | User | Discovery, including Trending as a category |
| Video | User | Playback, resume, progress |
| Course | User | Modules, lessons, course progress |
| Bookmarks | User | Saved content |
| History and continue learning | User | Recently played videos and resume |
| Share | User | Share an eligible video or course |
| Notifications | User | In-app list; push permission is platform-specific |
| Account / role switch | Account owner | Switch only between User and Creator |
| Creator content editor | Creator | Draft video or course, publish, takedown and republish |
| Admin users | Admin | Accounts and status |
| Admin content | Admin | Publish, unpublish, remove, restore |
| Admin taxonomy | Admin | Categories and tags |
| Admin settings | Admin | Approved settings, including completion threshold |
| Admin analytics | Admin | Basic progress and completion figures once metrics exist |
| Admin audit | Admin | Read audit records |

**Not specified:** parental-consent capture screen, notification preference screen, and any analytics layout. Do not design those until OD-10, OD-08, and OD-09 close.

Client platforms: Android, iOS, learner web, creator/admin web portal.

## 10. Roles and permissions

Server-enforced. A role sent by the client is ignored except on the role-switch operation, which may set only User or Creator.

| Capability | User | Creator | Admin |
|---|---|---|---|
| Sign in and use protected APIs when `ACTIVE` | Yes | Yes | Yes |
| Browse, search, play published content | Yes | Own progress is kept when switched to User; Creator UI is separate while the active role is Creator | Management data the role allows |
| Own progress, bookmarks, history | Yes | Kept across role switch; not a second simultaneous role | As allowed for administration |
| Create and publish own content | No | Yes | Yes, including publish/unpublish |
| Edit another creator’s content | No | No | Yes, within admin content operations |
| Delete or restore content | No | No | Yes |
| Manage users, status, categories, tags, settings | No | No | Yes |
| Assign Admin by self-service switch | No | No | No other admins to manage |
| Read another user’s private progress | No | No | Only management data the role allows |
| Audit log write via admin actions; user edit of audit rows | No | No | Write through admin actions; not free edit by ordinary users |

`SUSPENDED` is an administrator block: no sign-in and no protected API. `DEACTIVATED` is the FR-AUTH-08 deactivation state: no sign-in and no protected API.

## 11. Loading, empty, and error states

Required for primary flows (ADR Q-13). Copy is not specified. Behavior is:

| State | When | Behavior |
|---|---|---|
| Loading | Content, search, playback start, or a save is in progress | Show that the action is in progress. Do not present an empty list as if the user has no data. |
| Empty | Browse, search, category, bookmarks, history, or notifications have no rows | Say that there is nothing to show. Search empty is explicit (discovery acceptance). |
| Error | Invalid input, failed auth, forbidden role, inactive account, unavailable media, network loss, failed progress save, failed verification or recovery | Understandable message. No secrets, tokens, or other users’ data. Core learning continues if push delivery fails. |
| Success | Registration, verification, publish, bookmark, setting change, or similar completed actions | Confirm the outcome. |
| Restricted content | Shared link to unpublished, removed, or unauthorized content | Do not play or reveal private data. |
| Inactive account | `SUSPENDED` or `DEACTIVATED` | No sign-in and no protected API. |
| Progress save failure | Save does not complete | Do not show a false completion. Do not attribute progress to another account. |

## 12. Data requirements

Logical needs. The ERD remains the structural diagram and is behind ADR 0002 where they conflict.

| Data | Rule |
|---|---|
| Account | One active role. Status `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. Password hash. Soft-delete marker exists; retention is OD-11. |
| Auth | Verification, session, refresh, and push-device tokens stored by the application. Validation secrets hashed. Expiry, single-use verification, refresh rotation, revocation. |
| External identity | Unique provider plus provider user id. Do not link on unverified email alone. |
| Content | Video is primary. Course, module, lesson. Status controls learner visibility. Creator ownership. |
| Attachment | PDF, text, hyperlink, and similar. Not a primary content type. Optional. |
| Taxonomy | Categories and tags. Trending is a category. Admin-managed. |
| Video progress | One row per user and video. Last position is resume data, not completion proof. Completion rows stay when the threshold changes. |
| Course progress | Calculated from that course’s video durations and duration completed. Not stored as the same record as video progress. |
| Bookmark | One per user and content. |
| Notification | In-app notification and push device. Triggers are OD-08. |
| Settings | System settings include the completion threshold. Admin-only. |
| Audit | Administrative actions. Target may be polymorphic. Event list is OD-13. |
| Captions | Optional for publish under Q-26 pending confirmation against Q-08. Method (uploaded or generated) is recorded. |
| Consent | Required for children under eight. Storage is unspecified. |

Do not add payment, comment, streak, recommendation, or share-analytics storage.

**Open data rules:** watched-coverage formula; parental-consent fields; retention after account deletion; content behavior after creator deactivation or deletion (OD-12).

## 13. Integrations

| Integration | Requirement | Status |
|---|---|---|
| Google sign-in | Identity token checked on the server | Required |
| Email verification and password recovery | Delivery mechanism not named in the BRD | Required behavior; provider not chosen |
| Video storage | Local files in development. Object storage and CDN in production | Required; production provider not chosen |
| Push | Device token stored. FCM is an example only | Required capability; provider not chosen |
| Captions | Upload or generate, then review | Required capability; generator not chosen |
| Hosting | Not selected | Open (OD-16) |

No payment provider.

## 14. MVP scope

### 14.1 In scope

Authentication (email/password, verification, recovery, Google), one active role with User/Creator switch, three account statuses, standalone videos and courses, attachments, discovery (browse, search, category including Trending), playback, automatic progress and resume, bookmarks, history, continue learning, sharing, in-app and push capability, admin user/content/category/tag/settings/audit, basic analytics, English, captions, Android, iOS, learner web, creator/admin web.

### 14.2 Out of scope

- Payments, subscriptions, purchases, monetization.
- Comments, replies, community, ratings, reviews.
- Learning streaks.
- Personalized recommendations.
- Additional primary content types. Attachments are in scope and are not primary types.
- Additional languages and additional authentication providers.
- Organization or team accounts. Additional roles.
- Reconnecting progress or content to a newly registered account.
- Multi-admin management. Client-granted Admin.
- Share analytics.
- Publication-approval notifications and an approval queue.
- In-place edit of a published video.
- Numeric performance targets.
- Marking videos complete before a coverage formula is approved.

### 14.3 Deferred, not commitments

Personalized recommendations, streaks, comments, ratings and reviews, extra content types and languages, monetization, advanced analytics and creator dashboards, extra roles or teams. Downloadable resources are already in scope as attachments (OD-01 closed); do not treat them as a future exclusion.

## 15. Success criteria

The MVP is ready for academic demonstration when:

- Approved Must requirements are implemented, except behavior explicitly blocked by an open decision.
- User, creator, and administrator workflows in section 5 work end to end for the decided parts.
- Server authorization and ownership checks are verified, including inactive accounts and cross-creator updates.
- Critical failures are handled: invalid input, unavailable media, network interruption, failed progress save, authentication errors.
- Business rules have tests: one role, no approval queue, course structure, completion not inferred from last position, completions not recalculated when the threshold changes, duplicate bookmark rejected.
- Android, iOS, learner web, and creator/admin web are tested for their agreed capabilities.
- Setup documentation exists.
- Open decisions are either resolved or accepted as outside the demonstrated behavior.
- The demonstration does not claim unimplemented functionality, including a coverage formula, retention periods, consent capture, notification catalogs, or analytics metrics that are still open.

### 15.1 Verification

1. Functional: registration, authentication, publishing, discovery, playback, bookmarks, history, notifications, administration.
2. Authorization: protected functions and another user’s private data.
3. Business rules: roles, completion, course structure, account lifecycle.
4. Failure cases listed in section 11.
5. Data integrity: duplicate or out-of-order progress, ownership, deletion behavior that is actually specified.
6. Cross-platform checks.
7. Regression and technical checks: automated tests, static checks, dependency checks, production-build verification.

Map each requirement ID to evidence before calling the MVP accepted. OD-15 (measurable quality targets beyond Q-24) stays open.

## 16. Assumptions and decisions requiring approval

**Assumptions**

- “Learner” in the BRD means the User role.
- Screen list in section 9 names workflows only.
- Q-26 (captions are not a publish blocker) is followed until Q-08 is reconciled.
- The non-overlapping-segment coverage idea is a proposal, not a rule.

**Requires approval before the related behavior is built**

| ID | Decision |
|---|---|
| OD-06 / FR-PROG-08 | Watched-coverage formula |
| Q-07 remainder | Whether published metadata can change without takedown |
| OD-07 | Sorting, featured content, filters beyond category |
| OD-08 | Notification triggers and preferences |
| OD-09 | Analytics metrics and who sees them |
| OD-10 | How parental consent is captured and stored |
| OD-11 / FR-PRIV-04 / FR-PRIV-06 | Retention and permanent deletion. Do not invent a period |
| OD-12 | Content when a creator is deactivated or deleted |
| OD-13 | Which admin actions are audited |
| OD-14 | Caption method details beyond upload-or-generate and review |
| OD-15 | Any quality numbers beyond “no extra numeric targets” |
| OD-16 | Hosting provider |
| Q-08 vs Q-26 | Whether captions are required before publish |

Closed and not to be reopened without a new decision: attachments in MVP (OD-01); one role and User/Creator switch; one admin; lesson order is display order with any watch order; search fields; Trending is a category; stack baseline; local media in development; no progress reconnect after a new registration; account statuses; age rule without a second age limit.

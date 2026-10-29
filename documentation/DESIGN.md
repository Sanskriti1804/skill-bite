# SkillBite — Design

**Status:** Draft. No prior `DESIGN.md`, UI, or design assets exist in the repository.

**Source of truth:** `PRD.md`, which follows `SkillBite.md` and ADR 0002. This file specifies how approved screens behave. It does not add product features.

**Open product limits that constrain UI:** no coverage formula, so the player must not present a video as complete from last position. Captions are recorded (uploaded or generated, then reviewed) and are not a publish blocker until Q-08 and Q-26 are reconciled. Notification preferences, parental-consent capture, and analytics layouts stay undesigned until OD-08, OD-10, and OD-09 close. Copy strings are not specified in the PRD; labels below are functional names.

**Design assumptions (not approved brand decisions):** palette, type scale, and spacing numbers. They exist so Android, iOS, learner web, and the creator/admin web portal can share one system. Replace them if a brand decision is approved.

---

## 1. Visual direction and principles

SkillBite is a learning product. The video and the course outline are the content. Chrome stays quiet.

1. **Watching first.** On a video or lesson, playback and resume take the primary region. Bookmarks, share, attachments, and captions are secondary.
2. **One role, one interface.** User and Creator do not appear as two modes at once. Role switch is an explicit account action. Admin lives on the web portal, not inside the learner player.
3. **Status is visible.** Published, draft, taken down, removed, and account status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`) use the same status treatment everywhere.
4. **Honest progress.** Show last position as resume. Show completion only when the server has a completion record. Course progress is separate from a single video’s position.
5. **No decoration that implies excluded features.** No streak counters, ratings, comments, recommendations, prices, or approval queues.
6. **Same rules on every client.** Expo mobile, learner web, and Next.js admin web share components, states, and labels. Density may change. Meaning does not.

## 2. Color

Neutral surfaces, one accent for the current action, semantic colors only for status.

| Token | Value | Use |
|---|---|---|
| `bg` | `#F6F5F2` | App background |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `ink` | `#1C1B19` | Primary text |
| `ink-muted` | `#5E5A54` | Secondary text, metadata |
| `line` | `#E4E0D8` | Borders, dividers |
| `accent` | `#0F6E56` | Primary buttons, links, current lesson, focus ring |
| `accent-ink` | `#FFFFFF` | Text on accent |
| `danger` | `#9F2D2D` | Destructive confirm, form errors |
| `warning` | `#8A5A00` | Suspended, taken down, unsaved failure |
| `success` | `#0F6E56` | Completed save or publish confirmation (same hue as accent; pair with a check, not color alone) |
| `video-bg` | `#141210` | Player letterbox |

Contrast: body text on `bg` and `surface` at least 4.5:1. Accent text on accent fills at least 4.5:1. Do not use color as the only signal for completion, errors, or account status.

Trending is a category chip, the same component as any other category. It does not get a flame graphic or a rank number.

## 3. Typography

English only. Use the platform UI font: system UI on web, the default React Native text style on iOS and Android. Do not load a decorative webfont for the MVP.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Title | 28 / 34 | 650 | Screen title |
| Section | 20 / 26 | 650 | Course or module name |
| Body | 16 / 24 | 450 | Descriptions, form help |
| Label | 14 / 20 | 600 | Buttons, field labels, nav |
| Meta | 13 / 18 | 450 | Duration, status, timestamps |

Player controls and captions stay at least body size. Do not set learning text below 13px. Titles truncate to two lines on cards and wrap on the detail page.

## 4. Spacing and layout

Base unit: 4px. Use 4, 8, 12, 16, 24, 32, 48.

| Layout | Width | Padding |
|---|---|---|
| Mobile | full width | 16px page inset |
| Learner web | content column max 1120px, centered | 24px |
| Admin web | fluid with a fixed start nav of 240px | 24px in the main column |

Stacks gap 16 between sections and 8 between a label and its control. Cards pad 16. Touch targets are at least 44×44px. Admin tables may use 40px row height with a larger hit area on icon buttons.

Page structure, top to bottom: status or error banner if needed, title and primary action, content, secondary actions. One primary button per view.

## 5. Reusable components

Build these once and use them on every client that needs the job.

| Component | Rules |
|---|---|
| Button | Primary (accent), secondary (surface + line), danger. Disabled while a request is in flight. |
| Text field | Visible label, hint, error under the field. Password fields have a show/hide control. |
| Status badge | Draft, published, unpublished, removed, active, suspended, deactivated. Text plus color. |
| Category chip | Filter. Selected state is accent outline, not a new color. Trending included. |
| Content card | Title, duration or lesson count, category, progress bar only when a saved position or a real completion exists. |
| List row | Bookmarks, history, notifications, admin tables. |
| Video player | Play/pause, seek, time, captions toggle, resume from saved position. Completion is not a seek-bar percentage. |
| Progress bar | Resume position and course duration progress are labeled differently. |
| Course outline | Modules, then lessons, display order. Any lesson can be opened. Current lesson marked. |
| Attachment row | PDF, text file, or link. Labeled as supporting material, not as the lesson itself. |
| Dialog | Confirm takedown, delete, restore, role switch, and destructive admin actions. State the outcome in the title. |
| Toast or inline success | Confirms publish, bookmark, save, and setting changes. Does not replace field errors. |
| Banner | Full-width for inactive account, network loss, and restricted content. |
| Empty state | Short sentence plus one next action when an action exists (for example, clear search). |
| Skeleton | Loading placeholder that matches the list or player shape. |

Do not add comment composers, star ratings, paywalls, or recommendation rails.

## 6. Navigation and forms

### 6.1 Navigation

The active role chooses the shell. There is no Admin item on the User or Creator switch.

**User (mobile and learner web):** Browse, Search, Bookmarks, History (continue learning lives here; recently played means videos), Notifications, Account. Video and course are pushed on the stack or opened as pages, not extra tabs.

**Creator:** Content list (own drafts and published items), editor, Account with the switch back to User. Publishing is the primary action on the editor, not a separate approval inbox.

**Admin (web portal):** Users, Content, Categories and tags, Settings, Analytics, Audit. Analytics may show a holding state until OD-09 names the metrics. Do not invent charts.

**Role switch:** Account page only. Choices are User and Creator. Confirm before switching. After the switch, show that role’s navigation. Progress and content remain; the other role’s screens are not shown at the same time.

**Share:** Action on an eligible video or course. It invokes the platform share sheet or copies the stable URL. It is not a destination tab.

**Inactive account:** Sign-in stops. Show a banner that the account is suspended or deactivated. No learner or creator navigation.

### 6.2 Forms

| Form | Fields | Validation shown in the UI |
|---|---|---|
| Register | Email, password | Invalid data inline. No secret detail in the error. |
| Sign in | Email, password, and a Google action | Same failure treatment for unknown user and wrong password. |
| Verify email | Follows the verification link or code the product sends | Expired or used token: error and a way to request again. |
| Password recovery | Email, then new password | Failure does not reveal whether the email exists. Reset does not sign in a suspended or deactivated account. |
| Video draft | Title, description, video file, sources, tags, keywords, optional captions, optional attachments | Publish stays disabled or returns field errors until required fields are present. Caption method (uploaded or generated) is recorded when a caption is added. |
| Course draft | Course fields needed to hold modules; each module has a name; each lesson has a name and one video | Lessons list in display order. Reorder changes position only. A lesson cannot pick a video already used on another lesson. |
| Bookmark | None beyond the action | Second bookmark on the same item shows the existing saved state, not a second row. |
| Admin status | `ACTIVE`, `SUSPENDED`, `DEACTIVATED` | Confirm before suspend or deactivate. |
| Completion threshold | Numeric setting on admin settings | Show the current value. Initial value is 90%. Reject out-of-range on the server; show that error on the field. Changing it does not ask the UI to recompute old completions. |
| Taxonomy | Category or tag name | Admin only. |
| Role switch | User or Creator | No Admin option. |

Google sign-in is a button that starts the provider flow. The UI never sends a typed email as proof of a Google account.

Parental consent has no form until OD-10 defines capture. If registration must block children under eight before that decision, stop and ask for the decision rather than inventing a consent widget.

## 7. Loading, empty, and error states

Match PRD section 11.

| State | Presentation |
|---|---|
| Loading | Skeleton or a control spinner. Lists do not flash the empty state first. The player shows a loading state on the video surface until playback can start. |
| Empty browse or category | “Nothing in this category.” |
| Empty search | State that nothing matched, and keep the query visible so it can be edited. |
| Empty bookmarks, history, notifications | Say the list is empty. History empty means there is no continue-learning row. |
| Empty creator list | Explain that no videos or courses exist yet, with the create action. |
| Empty admin list | Say there are no rows. |
| Field error | Under the control. The first invalid field is focused. |
| Auth error | Banner or form error. No tokens, stack traces, or account enumeration. |
| Forbidden role | Banner: the active role cannot do that. Do not show the protected screen’s data. |
| Inactive account | Full-screen or sign-in banner. No protected content. |
| Unavailable media or restricted link | Player area explains the content is unavailable. Do not render title or description of private content on a shared link that failed authorization. |
| Network loss | Banner and retry. Locally entered form values stay put. |
| Progress save failure | Small persistent warning on the player. Resume position and completion stay at the last confirmed server values. |
| Push failure | Inline note on notifications. Playback and progress keep working. |
| Success | Inline confirmation or toast, then return focus to the triggering control. |
| Analytics before OD-09 | Explain that metrics are not defined yet. Do not show placeholder numbers. |

## 8. Interaction and motion

Motion only explains a change of place or state.

- Page and stack transitions: platform default, under 200ms.
- Sheets and dialogs: fade/slide, under 200ms. Respect `prefers-reduced-motion` and the OS reduce-motion setting: cut distance to opacity or an instant change.
- Do not animate progress as a celebration, and do not pulse the completion state.
- Seek updates the time readout immediately. Saving progress is quiet unless it fails.
- Role switch and publish use a dialog or an explicit result, not a novelty transition.
- No autoplay of the next lesson. The outline stays available because lessons are unordered for watching.

## 9. Responsive behavior

| Client | Behavior |
|---|---|
| Phone (Android, iOS) | Single column. Player full width. Course outline below the player or in a sheet. Bottom navigation for the User tabs. Creator uses the same shell with creator destinations. |
| Tablet | Same components. Content column grows. Outline may sit beside the player from 720px up. |
| Learner web | Column max 1120px. From 960px, video and outline sit side by side: player first, outline second. Search and category chips wrap. |
| Admin web | From 1024px, start navigation plus main pane. Below that, navigation collapses into a menu button. Tables become stacked rows under 720px so status and actions stay visible. |

Hover is an enhancement. Every action works by touch and keyboard. The admin portal is the Next.js web UI. Learner web is in scope as its own surface and should reuse the same components.

## 10. Accessibility

- English UI text.
- Captions: player control to turn captions on and off when a caption track exists. The editor can add an uploaded or generated track and must show that it needs review before it is treated as ready. Do not block the publish control on a missing caption while Q-26 stands.
- Focus order follows the visual order. Focus ring uses `accent` at 2px offset, visible on light and on `video-bg`.
- Every icon-only control has a text alternative: play, pause, seek, captions, bookmark, share, close.
- Form fields have labels, not placeholder-only labels. Errors use text, not color alone.
- Status badges include text.
- Target contrast in section 2. Hit targets in section 4.
- Dialogs trap focus until dismiss or confirm, and restore focus to the opener.
- The player exposes play state and current time to assistive tech. A completion announcement happens only after the server records completion.
- Reduced motion as in section 8.
- The BRD does not set a WCAG conformance level or a caption format. The UI rules above are the implementation bar until a stricter standard is approved.

## 11. Page layouts

Regions are in order. Do not add sections for excluded features.

### 11.1 Register, sign in, verify, recovery

Narrow column, max 400px, centered. Title, form, primary submit, alternate path (sign in versus register, Google on sign in, resend on verify). Recovery is two steps: request, then set a new password. Errors sit on the form.

### 11.2 Browse, search, category

Title, search field, horizontal category chips with Trending as one chip, then a vertical list or wrapping grid of content cards. Continue-learning is a single row at the top of Browse only when a saved video exists, linking to History. Loading uses skeletons. Empty and error follow section 7.

### 11.3 Video

Player region, title, resume/completion line (“Resume at …” versus “Completed” only if recorded), bookmark and share, description, attachments list. No comments.

### 11.4 Course

Title, course progress line calculated from video durations (word it as course progress, not as one video’s seek position), then modules and lessons in display order. Opening a lesson uses the video layout with the outline still reachable. Each lesson shows one video.

### 11.5 Bookmarks and history

Title and list. History rows are videos, most recently watched first, with resume. Empty states from section 7.

### 11.6 Notifications

Title and list of in-app items. If the platform has not granted push permission, one text action to request it. Denial is a sentence on this screen, not a block on the rest of the app. No preference matrix until OD-08.

### 11.7 Account

Identity summary, role switch (User or Creator) with confirmation, sign out. No admin grant.

### 11.8 Creator editor

Title: new or existing draft. Status badge. Fields from section 6.2. Supporting attachments are an optional group under the video fields. Primary action: Publish, or Republish after takedown. Secondary: save draft, take down when published. Taking down explains that the published video is not edited in place and that the revision is published again on the same path. Delete and restore are absent here; those are admin actions. If published text fields are locked, that is because metadata edits without takedown are unspecified — keep them read-only after publish until that decision lands.

### 11.9 Admin

Shared portal frame: navigation, page title, primary admin action on the right when the page has one.

- **Users:** list with email and status, detail with status control.
- **Content:** list with owner, type, status. Actions: publish, unpublish, remove, restore. Restore is available on removed items.
- **Categories and tags:** simple name lists and create/edit.
- **Settings:** completion threshold field and save. Success confirmation. No other settings until they are approved.
- **Analytics:** holding copy until metrics are approved. No sample figures.
- **Audit:** read-only list. Columns wait on OD-13; until then show actor, action, and time if the API provides them, and do not offer edit or delete.

### 11.10 Restricted and inactive

Restricted shared links use a single message page, not the video layout. Inactive accounts use the sign-in frame plus the status banner.

---

## 12. Out of design scope

Payments, comments, streaks, recommendations, extra languages, extra auth providers, team accounts, share analytics, approval queues, in-place edit of a published video, consent UI, notification preference UI, and analytics visualization. Add those only after the PRD marks them in scope.

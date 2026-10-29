# **SkillBite** 

Suns - 7/18/2026 

**Document Status: Draft Project Type: College / Academic Project Product Name: SkillBite Document Purpose: Define the product's business objectives, scope, users, functional requirements, business rules, quality expectations, and acceptance criteria before detailed design and implementation.** 

## **1. Executive Summary** 

SkillBite is a microlearning platform designed to help people learn through short educational videos and structured courses. The platform combines standalone learning videos with courses organized into modules or sections and lessons. 

The system will support learners who discover and consume educational content, creators who publish learning content, and administrators who manage users, content, categories, platform settings, and basic analytics. 

The MVP will include the essential functionality needed to demonstrate the complete learning and publishing experience across Android, iOS, a learner web application, and a creator/administrator web portal. 

SkillBite will be free to use in the MVP. Monetization, comments, community interactions, learning streaks, and personalized recommendations are excluded from the confirmed MVP scope. 

This BRD establishes the business requirements. Database design, technology selection, application architecture, API contracts, folder structure, and deployment implementation will be documented separately. 

## **2. Project Background and Problem Statement** 

### **2.1 Background** 

Educational content is available in many formats and across many platforms. Learners may find it difficult to discover relevant material, continue learning from where they stopped, organize useful content, and track their learning progress. 

Creators also need a straightforward way to publish educational videos and organize content into structured learning experiences. 

SkillBite aims to provide a unified platform for short-form learning, structured courses, content discovery, progress tracking, and creator publishing. 

### **2.2 Problem Statement** 

The project addresses the need for a platform that brings together: 

- Short educational videos and structured courses. 

- Content discovery through browsing, searching, categories, and filters. 

- A consistent learning experience across mobile and web interfaces. 

- Automatic progress saving and continuation of learning. 

- Creator publishing capabilities. 

- Administrative management of users, content, categories, and platform information. 

The precise business impact and measurable success targets have not yet been established and must not be treated as confirmed outcomes. 

## **3. Project Objectives** 

The MVP aims to: 

1. Enable users to register, authenticate, and access authorized platform features. 

2. Enable learners to discover and consume educational video content. 

3. Support standalone videos and structured courses. 

4. Save learning progress automatically and allow learners to resume content. 

5. Track lesson completion using a configurable completion threshold. 

6. Provide bookmarking, watch history, continue-learning, and content-sharing functionality. 

7. Enable creators to publish educational content without mandatory pre-publication approval. 

8. Provide administrators with user management, content moderation, category management, settings, audit logs, and basic analytics. 

9. Support in-app and push notifications. 

10. Establish a clear foundation for future enhancement without including deferred features in the MVP. 

## **4. Stakeholders and User Roles** 

### **4.1 Stakeholders** 

|**Stakeholder**|**Interest or responsibility**|
|---|---|
|Project owner / student team|Requirements, implementation, documentation, and project<br>demonstration|
|Learners|Discovering content, learning, saving content, and tracking<br>progress|
|Creators|Creating, organizing, and publishing educational content|
|Administrators|Managing users, content, categories, settings, and platform<br>oversight|
|Project evaluator / faculty|Reviewing functionality, documentation, design decisions,<br>and project quality|



The exact individuals assigned to each stakeholder role are outside the scope of this BRD. 

### **4.2 User Roles** 

#### **Learner** 

A learner consumes educational content and uses the supported learning features. 

#### **Creator** 

A creator publishes educational videos and organizes content into standalone videos or structured courses. 

#### **Administrator** 

An administrator manages users, content moderation, categories and tags, platform settings, basic analytics, and administrative audit records. 

### **4.3 Role and Permission Rules** 

- Each account has exactly one assigned role at a time. 

- A registered user can become a creator and publish immediately, without mandatory pre-publication approval. 

- Administrative capabilities must be restricted to authorized administrators. 

- Users must not gain access to administrative functions by changing client-side state or navigating directly to protected screens. 

- The complete permissions of creators, including access to learner-specific features, remain an open decision. 

- Rules for changing roles, transferring ownership, and managing administrator accounts remain to be defined. 

## **5. Project Scope** 

### **5.1 In Scope — MVP** 

|**Area**|**Included functionality**|
|---|---|
|Authentication|Email/password, email verification, password recovery,<br>Google sign-in|
|User management|Role assignment and account status management|
|Learning content|Standalone educational videos and structured courses|
|Course structure|Courses, modules/sections, and lessons|
|Content publishing|Creator publishing and administration of published content|
|Discovery|Browse, search, categories, and filters|
|Learning progress|Automatic saving, resuming, and lesson-completion tracking|
|Learner tools|Bookmarks, watch history, continue learning, content sharing|
|Notifications|In-app and push notification capability|
|Administration|User, content, category, tag, and platform-settings<br>management|
|Analytics|Basic learning-progress and completion analytics|
|Auditability|Records of defined administrative actions|
|Privacy|Restricted access to personal and learning data, consent<br>where required, and documented retention rules|
|Platforms|Android, iOS, learner web app, creator/admin web portal|
|Accessibility|English initially and video captions/subtitles|



### **5.2 Out of Scope — Confirmed MVP Exclusions** 

- Paid subscriptions, payments, purchases, and monetization. 

- Comments and community interactions. 

- Learning streaks. 

- Personalized recommendation functionality; basic discovery is included. 

- Additional primary content formats beyond video. Supporting attachments are in scope and are not a primary content type. 

### **5.3 Deferred or Unconfirmed Features** 

The following must not be silently included in the confirmed MVP: 

- Ratings, reviews, and replies. 

- Advanced analytics and recommendation algorithms. 

- Additional languages. 

- Additional authentication providers. 

- Advanced creator workflows or organization/team accounts. 

- Monetization in future releases. 

Video is the primary content type. Creators may attach supporting PDFs, text documents, and hyperlinks. Those attachments are not separate primary content types. For course progress, a course is treated as video content only. There is no document-reading progress. 

## **6. User Workflows** 

### **6.1 Learner Workflow** 

1. Register or sign in using a supported authentication method. 

2. Complete required email verification when applicable. 

3. Browse or search available learning content. 

4. Filter or explore content by categories and other approved discovery criteria. 

5. Open a standalone video or course. 

6. Watch the video. 

7. Allow learning progress to be saved automatically. 

8. Resume previously started content. 

9. Save content to bookmarks. 

10. View watch history and continue-learning content. 

11. Share content using the approved sharing functionality. 

12. View available learning-progress and completion information. 

13. Receive supported in-app and push notifications. 

The exact learner capabilities available to a Creator account remain to be confirmed. 

### **6.2 Creator Workflow** 

1. Register and obtain Creator access. 

2. Access creator functionality. 

3. Create standalone video content or a structured course. 

4. Organize course content into modules/sections and lessons. 

5. Provide the required content information. 

6. Publish content without mandatory pre-publication approval. 

7. Make published content available according to platform access rules. 

8. Edit a draft before publication. A published video is not edited in place. The creator takes it down and submits the revised video for publication again, without a separate approval queue. 

Drafts may be edited before publication. Only an administrator deletes or restores content. Deletion stays recoverable by that administrator. 

### **6.3 Administrator Workflow** 

1. Sign in with an authorized Administrator account. 

2. Access the administrative portal. 

3. View and manage user accounts and account status. 

4. Review, publish, unpublish, or remove content as authorized. 

5. Manage categories and tags. 

6. View basic usage and learning analytics. 

7. Configure approved platform settings. 

8. Inspect administrative audit records. 

The precise administrator permissions, especially whether administrators can manage other administrators, remain open. 

## **7. Functional Requirements** 

Requirement identifiers will be used for traceability between the BRD, technical design, implementation, and tests. 

Priority definitions: 

- Must: Essential to the agreed MVP. 

- Should: Expected where feasible within the project scope. 

- Open: Requires clarification before the affected behavior can be finalized. 

### **7.1 Authentication and Account Management** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-AUTH-01|The system shall allow users to register<br>using email and password.|Must|
|FR-AUTH-02|The system shall support email<br>verification.|Must|
|FR-AUTH-03|The system shall support password<br>recovery.|Must|
|FR-AUTH-04|The system shall support Google<br>sign-in.|Must|
|FR-AUTH-05|The system shall associate each<br>account with one active role: Learner,<br>Creator, or Administrator.|Must|



|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-AUTH-06|The system shall restrict protected<br>operations according to the user's<br>authorization.|Must|
|FR-AUTH-07|The system shall support<br>administrative account-status<br>management.|Must|
|FR-AUTH-08|The system shall support account<br>deactivation and a defined deletion<br>process.|Must|
|FR-AUTH-09|The system shall handle invalid<br>credentials, verification failures, and<br>recovery failures without exposing<br>sensitive information.|Must|
|FR-AUTH-10|Role-change rules and Creator access<br>to learner functionality shall be<br>explicitly defined.|Open|



#### **Acceptance criteria** 

- A user can register using valid information. 

- Invalid registration data is rejected with understandable feedback. 

- Verification and recovery flows behave according to their defined rules. 

- Protected actions reject unauthorized users. 

- Disabled accounts cannot perform the operations prohibited by the account-status policy. 

- Account deletion follows the approved retention and deletion rules. 

### **7.2 Content and Course Management** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-CONT-01|The system shall support standalone<br>educational videos.|Must|
|FR-CONT-02|The system shall support courses<br>containing modules/sections and<br>lessons.|Must|
|FR-CONT-03|Creators shall be able to publish<br>content without mandatory<br>pre-publication approval.|Must|
|FR-CONT-04|The system shall support the<br>content-management operations<br>approved for creators.|Must|
|FR-CONT-05|Administrators shall be able to review,<br>publish, unpublish, and remove<br>content.|Must|
|FR-CONT-06|The system shall support category and<br>tag management.|Must|
|FR-CONT-07|Published content shall be available to<br>authorized users according to its<br>visibility and status.|Must|



|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-CONT-08|The system shall validate required<br>content information before the relevant<br>save or publishing operation.|Must|
|FR-CONT-09|The system shall prevent unauthorized<br>users from modifying another creator's<br>content.|Must|
|FR-CONT-10|Rules for drafts, incomplete courses,<br>lesson ordering, editing published<br>content, and deletion shall be<br>documented.|Open|
|FR-CONT-11|Downloadable attachments shall be<br>included only if confirmed as an MVP<br>requirement.|Open|



#### **Acceptance criteria** 

- An authorized Creator can create and publish the supported content type. 

- A structured course can represent modules/sections and lessons. 

- Required content fields are validated according to the agreed rules. 

- Administrators can perform authorized content-management operations. 

- Unauthorized content modification is rejected by the backend. 

- Unpublished or removed content follows the approved visibility rules. 

### **7.3 Content Discovery** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-DISC-01|Learners shall be able to browse<br>available content.|Must|
|FR-DISC-02|Learners shall be able to search<br>content.|Must|
|FR-DISC-03|Learners shall be able to discover<br>content through categories.|Must|
|FR-DISC-04|The system shall support the filters<br>approved for the MVP.|Must|
|FR-DISC-05|The system shall provide basic content<br>discovery without requiring<br>personalized recommendations.|Must|
|FR-DISC-06|Sorting, featured content, and the exact<br>search fields shall be explicitly defined.|Open|



#### **Acceptance criteria** 

- Relevant content is returned for valid searches. 

- Category and filter selections affect displayed results. 

- Empty results are communicated clearly. 

- Content that is not available to learners is excluded according to its visibility rules. 

- Trending is a category used for discovery. It is not a view-count or completion ranking. 

### **7.4 Video Playback and Learning Progress** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-PROG-01|The system shall allow learners to play<br>available educational videos.|Must|
|FR-PROG-02|The system shall save learning<br>progress automatically.|Must|
|FR-PROG-03|The system shall allow learners to<br>resume content from the last saved<br>position.|Must|
|FR-PROG-04|The system shall determine video<br>completion using a configurable<br>threshold, initially specified as at least<br>90% watched. Course progress is<br>calculated separately from video<br>progress.|Must|
|FR-PROG-05|The system shall expose appropriate<br>progress and completion information to<br>the learner.|Must|
|FR-PROG-06|The system shall support watch history<br>and continue-learning functionality.|Must|
|FR-PROG-07|The system shall support bookmarks<br>for learning content.|Must|
|FR-PROG-08|Watched coverage must not be inferred<br>from last playback position alone.<br>Changing the threshold must not<br>recalculate existing completions. The<br>exact coverage formula remains<br>unapproved.|Open|



#### **Acceptance criteria** 

- Playback progress is saved and restored for a returning learner. 

- A learner can continue from the saved position. 

- The system applies the approved completion calculation consistently. 

- Progress is not incorrectly attributed to another account. 

- Repeated or out-of-order progress updates do not produce invalid completion states. 

- Bookmarks and history reflect the correct account's actions. 

### **7.5 Sharing** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-SHARE-01|The system shall provide a way to<br>share eligible videos and courses.|Must|
|FR-SHARE-02|Shared links shall open the appropriate<br>content page or app route when the<br>content remains available.|Must|
|FR-SHARE-03|Sharing behavior for unpublished,<br>removed, or restricted content shall<br>follow the approved visibility rules.|Must|



#### **Acceptance criteria** 

- A user can initiate sharing for eligible content. 

- A valid shared link resolves to the intended content. 

- Restricted content does not become accessible merely because its URL is known. 

### **7.6 Notifications** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-NOTIF-01|The system shall support in-app<br>notifications.|Must|
|FR-NOTIF-02|The system shall support push<br>notifications on applicable supported<br>platforms.|Must|
|FR-NOTIF-03|Notification events, user preferences,<br>permission handling, and failure<br>behavior shall be defined.|Open|



#### **Acceptance criteria** 

- Supported notification events generate the expected notification. 

- Notifications are associated with the correct user. 

- Push-notification permission denial or delivery failure does not prevent core learning functionality. 

- Notification behavior follows the approved user-preference rules. 

### **7.7 Administration** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-ADMIN-01|Administrators shall be able to view<br>and manage user accounts.|Must|
|FR-ADMIN-02|Administrators shall be able to manage<br>account status.|Must|
|FR-ADMIN-03|Administrators shall be able to review,<br>publish, unpublish, and remove<br>content.|Must|
|FR-ADMIN-04|Administrators shall be able to manage<br>categories and tags.|Must|
|FR-ADMIN-05|Administrators shall be able to view<br>basic usage and learning analytics.|Must|
|FR-ADMIN-06|Administrators shall be able to<br>configure approved platform settings.|Must|
|FR-ADMIN-07|The system shall record defined<br>administrative actions in audit logs.|Must|
|FR-ADMIN-08|Administrator permissions and the list<br>of audited events shall be defined.|Open|



#### **Acceptance criteria** 

- Only authorized administrators can access administrative operations. 

- Administrative changes are reflected in the application. 

- Audit records identify the relevant action and actor where required. 

- Audit records cannot be modified by ordinary users through application interfaces. 

### **7.8 Analytics** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-AN-01|The system shall provide basic learner<br>progress analytics.|Must|
|FR-AN-02|The system shall provide basic<br>lesson/course completion analytics.|Must|
|FR-AN-03|The exact metrics, reporting views, and<br>intended audience shall be specified.|Open|



#### **Acceptance criteria** 

- Displayed analytics are derived from the underlying recorded activity. 

- Completion figures follow the approved completion rule. 

- Reports do not expose personal or learning data to unauthorized users. 

- Metrics are labelled clearly enough to avoid misleading interpretation. 

### **7.9 Privacy and Account Lifecycle** 

|**ID**|**Requirement**|**Priority**|
|---|---|---|
|FR-PRIV-01|The system shall collect only the<br>personal data necessary for its agreed<br>functionality.|Must|
|FR-PRIV-02|Access to personal and learning data<br>shall be restricted by authorization<br>rules.|Must|
|FR-PRIV-03|The system shall support consent<br>where required by applicable law or the<br>approved product requirements.|Must|
|FR-PRIV-04|Account deactivation, deletion, and<br>retention behavior shall be<br>documented.|Must|
|FR-PRIV-05|Children under eight years of age<br>require parental consent. No other age<br>limit is approved.|Must|
|FR-PRIV-06|Retention behavior for learning<br>progress, bookmarks, history, and<br>creator content after account deletion<br>shall be defined.|Open|



#### **Acceptance criteria** 

- Users cannot access other users' private learning information without authorization. 

- Data collection and access are limited to the agreed purpose. 

- Account deletion follows the documented process. 

- Any data retained after deletion has an explicitly defined reason and retention rule. 

## **8. Business Rules** 

The following rules are confirmed or directly required by the selected product behavior. 

|**ID**|**Business rule**|
|---|---|
|BR-01|The MVP is free; payment and subscription processing are<br>not included.|
|BR-02|An account has one active role at a time.|
|BR-03|Creator publishing does not require mandatory<br>pre-publication approval.|
|BR-04|A course is organized into modules/sections and lessons.|
|BR-05|Learning progress is saved automatically.|
|BR-06|Video completion uses a configurable threshold, with 90%<br>as the stated initial threshold. Course progress is calculated<br>separately from the total video duration and the duration<br>completed. Last playback position alone is not completion.|
|BR-07|Personalized recommendations and learning streaks are<br>excluded from the MVP.|
|BR-08|Comments and community interactions are excluded from<br>the MVP.|
|BR-09|Administrative operations must be protected by<br>authorization.|
|BR-10|Personal and learning data must be protected from<br>unauthorized access.|



The following rules require decisions before their affected behavior can be finalized: 

- Whether creators can use learner features while retaining the Creator role. 

- Whether a creator may change published metadata other than by taking the video down and publishing the revision. The in-place edit of a published video is not allowed. 

- Whether lessons may be taken in any order or must be completed sequentially. 

- Which watched-coverage formula is approved. Last position is not sufficient, and existing completions are kept when the threshold changes. 

- Who can change the completion threshold. 

- What happens to content owned by a disabled or deleted creator. 

- What happens to a learner's data after account deletion. 

- Which events trigger notifications and which notification preferences are supported. 

- Which discovery filters and analytics metrics are required. 

## **9. Non-Functional Requirements** 

Non-functional requirements describe how the system should behave, rather than which business features it provides. 

Where a measurable target has not been provided, this BRD identifies the required quality area without inventing a numeric target. 

### **9.1 Security** 

- Authentication and authorization must be enforced on the server. 

- Passwords must not be stored in plaintext. 

- Credentials, tokens, and secrets must not be exposed in source code or client-visible configuration. 

- Input must be validated at appropriate trust boundaries. 

- Database access must use safe query practices. 

- Sensitive operations must verify user permissions and resource ownership. 

- Authentication and protected operations must handle failures safely. 

- Dependencies and application configuration should be reviewed for known security risks. 

### **9.2 Privacy** 

- Collect only data necessary for the approved features. 

- Restrict personal and learning data according to role and ownership. 

- Define consent, retention, and deletion requirements. 

- Avoid exposing sensitive details through error messages, logs, URLs, or analytics. 

- Resolve age-related requirements before permitting the relevant audience to register. 

### **9.3 Performance and Reliability** 

- Common user workflows should respond within agreed performance targets. 

- Video playback, progress saving, searching, and content retrieval should handle expected project usage reliably. 

- Network failures and unavailable content should produce understandable error states. 

- Progress saving should avoid invalid or conflicting state changes. 

- Numeric response-time, availability, and capacity targets remain to be established if required by the project evaluator. 

### **9.4 Usability and Accessibility** 

- Provide understandable loading, empty, error, and success states. 

- Keep primary learning and publishing workflows clear. 

- Support English in the initial version. 

- Provide video captions/subtitles according to the agreed caption method. 

- Ensure interfaces are usable across the supported screen sizes and devices. 

### **9.5 Maintainability and Quality** 

- Keep requirements, technical design, and implementation documentation aligned. 

- Use consistent validation, authorization, and error-handling practices. 

- Include appropriate automated tests for important business rules. 

- Use version control and review meaningful code changes. 

- Document setup, configuration, and the procedure for running the application. 

### **9.6 Data Integrity and Recovery** 

- Preserve valid relationships between accounts, content, courses, lessons, and progress records. 

- Prevent unauthorized or invalid updates. 

- Define appropriate backup and recovery practices for the chosen implementation environment. 

- Document migration and data-change procedures where a persistent database is used. 

## **10. Acceptance and Verification Strategy** 

The MVP should be considered functionally acceptable when its approved requirements have been implemented and verified. 

Verification should include: 

1. Functional testing: registration, authentication, publishing, discovery, playback, bookmarks, history, notifications, and administration. 

2. Authorization testing: attempts to access protected functions and another user's private data. 

3. Business-rule testing: role restrictions, lesson completion, course structure, and account lifecycle. 

4. Failure testing: invalid input, unavailable media, network interruptions, failed progress saves, and authentication errors. 

5. Data-integrity testing: duplicate or out-of-order progress updates, ownership relationships, and deletion behavior. 

6. Cross-platform testing: supported functionality on Android, iOS, learner web, and creator/admin web. 

7. Regression testing: verifying that changes do not break previously accepted functionality. 

8. Technical checks: applicable automated tests, static checks, dependency checks, and production-build verification. 

The final acceptance checklist should map each requirement ID to its implementation and verification evidence. 

## **11. Assumptions, Constraints, Dependencies, and Open Decisions** 

### **11.1 Confirmed Constraints** 

- The project is being developed as a college project. 

- The MVP is free. 

- Four platform interfaces are included in the selected scope. 

- English is the initial language. 

- The proposed technology stack must be re-evaluated rather than assumed final. 

- Advanced recommendations, streaks, comments, and monetization are excluded from the confirmed MVP. 

### **11.2 Dependencies** 

The project depends on decisions and implementation choices for: 

- Video hosting and playback. 

- Authentication and Google sign-in integration. 

- Push-notification delivery. 

- Persistent data storage. 

- Supported client platforms and their shared functionality. 

- Caption/subtitle provision. 

- Account and content lifecycle rules. 

The specific providers and technologies are not confirmed by this BRD. 

### **11.3 Open Decisions Register** 

|**ID**|**Open decision**|**Why it matters**|
|---|---|---|
|OD-01|Resolved. Supporting attachments are<br>in the MVP. Video remains the primary<br>content type.|Closed|
|OD-02|Whether Creators can use learner<br>features|Affects permissions and account<br>behavior|
|OD-03|Creator draft, edit, unpublish, and<br>delete rules|Affects content lifecycle and ownership|
|OD-04|Minimum requirements for publishing a<br>course|Affects validation and course<br>completeness|
|OD-05|Lesson ordering and sequential-access<br>rules|Affects the learning workflow|
|OD-06|The coverage formula is not approved.<br>See FR-PROG-08.|Still open|
|OD-07|Search fields, filters, sorting, and<br>featured content|Defines the discovery experience|
|OD-08|Notification triggers and user<br>preferences|Defines notification behavior|
|OD-09|Analytics metrics and intended viewers|Defines reports and access control|
|OD-10|Resolved for age. Children under eight<br>require parental consent. How that<br>consent is recorded is not specified.|Consent method still open|
|OD-11|Account recovery after a later<br>registration is not an MVP feature.<br>Retention and permanent deletion are<br>still undefined. Password recovery<br>remains a separate requirement.|Retention still open|
|OD-12|Content behavior after creator<br>deactivation or deletion|Affects ownership and content<br>availability|
|OD-13|Administrator authority and audit<br>events|Affects permissions and accountability|
|OD-14|Caption/subtitle provision method|Affects content creation and playback|
|OD-15|Measurable quality targets and project<br>acceptance criteria|Affects testing and evaluation|
|OD-16|Final technology stack and hosting<br>approach|Affects technical design and<br>implementation|



These items must remain visible in the project documentation until resolved. They should not be silently converted into confirmed business rules. 

## **12. Future Enhancements** 

The following may be evaluated after the MVP, but they are not commitments: 

- Personalized recommendations. 

- Learning streaks. 

- Comments and community interactions. 

- Ratings and reviews. 

- Downloadable resources if excluded from the MVP. 

- Additional content types and languages. 

- Monetization, subscriptions, or payments. 

- Advanced analytics and creator dashboards. 

- Additional roles or organization/team capabilities. 

## **13. Requirements Traceability** 

Each approved requirement should be traceable through the development lifecycle. 

|**Stage**|**Example for FR-PROG-03**|
|---|---|
|Business requirement|Learners can resume previously started videos.|
|Design|Define the progress model and resume behavior.|
|Implementation|Save and retrieve the appropriate learner's playback<br>position.|
|Verification|Test saving, leaving, returning, resuming, and handling failed<br>saves.|
|Documentation|Keep the requirement, design decision, and test evidence<br>aligned.|



The same traceability approach should be used for authentication, course publishing, content discovery, administration, privacy, and other material requirements. 

## **14. Definition of MVP Completion** 

The SkillBite MVP is ready for academic demonstration when: 

- All approved Must requirements are implemented. 

- Required user workflows function end to end. 

- Authorization and data-ownership checks are verified. 

- Critical error and failure scenarios are handled. 

- Important business rules have appropriate tests. 

- Supported interfaces have been tested against their agreed capabilities. 

- Setup and project documentation are available. 

- The remaining open decisions are either resolved or explicitly accepted as outside the MVP. 

- The project can be demonstrated without claiming unimplemented functionality. 

## **15. Document Status and Approval** 

#### **Current status: Draft for requirements validation.** 

This BRD captures the confirmed product direction and identifies unresolved requirements. It should be reviewed against the intended academic deliverables before being marked approved. 

Approval should confirm that the project scope, user capabilities, functional requirements, exclusions, and acceptance criteria accurately represent the intended SkillBite MVP. 

Once approved, changes to scope or business rules should be recorded and reflected in the relevant design, implementation, and testing documents. 


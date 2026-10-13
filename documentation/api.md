# API

**Status:** proposed boundary, no contract.

[architecture.md](architecture.md) recommends one application API for Android, iOS, the learner web app, and the creator/administrator portal. That split is not accepted until ADR 0001 is accepted or replaced.

## What any API must do

- Authenticate the caller and read role and account status from stored account data.
- Ignore a role claimed by the client.
- Store password and token material as described in [security.md](security.md) and `SkillBite-ERD.md`.
- Let creators publish without a mandatory approval queue. Administrators can still moderate.
- Save and resume progress in `VIDEO_PROGRESS`.
- Apply the configurable completion threshold. The measurement method is still an open BRD decision.

## Not specified

HTTP paths, request bodies, response bodies, error codes, pagination, and versioning are not defined. This file does not invent them.

Workflows are in [architecture.md](architecture.md). Add endpoint sections here only after the stack ADR is accepted and the first use cases have agreed contracts.

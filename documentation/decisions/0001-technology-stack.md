# ADR 0001 — Technology stack

**Status:** replaced by [0002-confirmed-answers.md](0002-confirmed-answers.md) for the implementation baseline. Hosting provider is still not chosen.

## Context

BRD section 11.1 says the stack must be re-evaluated rather than assumed. OD-16 is unresolved. The repository has no language, framework, or database files.

## Decision

None.

## Options to compare before application code

| Option | Fits | Cost |
|---|---|---|
| One HTTP API plus a relational database, with separate web and mobile clients | One place for authorization and the ERD | Four clients still need to be built |
| Full-stack web first, mobile later | Smaller first milestone | Delays Android and iOS, which are in MVP scope |
| Backend-as-a-service for auth and data | Faster academic demo | Fights the custom token, audit, and progress rules unless those products are checked against the ERD |

A relational database is the appropriate class of store for the ERD. The product (PostgreSQL or another) is not chosen. Engine-specific partial indexes and exclusion constraints should wait for that choice.

## Recommendation (not approval)

PostgreSQL for constraints and transactions, one small API service, and the four clients calling that API. Video files in an object store referenced by `VIDEO_DETAILS.media_reference`.

Do not start migrations or client projects until this ADR is accepted or replaced.

## Consequences until then

Documentation may name entities and rules. It must not add framework boilerplate, ORMs, or lockfiles.

# Documentation

Design notes. They do not replace the BRD or the ERD at the repository root.

| File | Owns |
|---|---|
| [../SkillBite.md](../SkillBite.md) | Requirements, rules, acceptance criteria, open decisions |
| [../SkillBite-ERD.md](../SkillBite-ERD.md) | Entities, keys, relationships, token lifecycle |
| [requirements.md](requirements.md) | Requirement IDs mapped to entities and planned checks |
| [architecture.md](architecture.md) | Proposed system shape and data flows |
| [database.md](database.md) | Physical PostgreSQL model; Prisma schema lives under `backend/prisma/` |
| [api.md](api.md) | HTTP contract for implemented `/api/v1` routes |
| [security.md](security.md) | Secrets, sessions, authorization, checklist |
| [decisions/0002-confirmed-answers.md](decisions/0002-confirmed-answers.md) | Accepted answers to the open questions |
| [decisions/README.md](decisions/README.md) | How to add the next ADR |
| [testing.md](testing.md) | Test layers, runners, and scenario evidence |
| [engineering.md](engineering.md) | Build order, gates, and deferred operations |
| [validation.md](validation.md) | BRD–ERD gaps that were not closed |

## Where the next change goes

- A business rule goes in `SkillBite.md`, then a row in `requirements.md`.
- A data-model change goes in `SkillBite-ERD.md`.
- An accepted technical choice becomes a new file in `decisions/`.
- Application code follows ADR 0002. Hosting, CI, and production providers wait until those decisions exist.

# Documentation

Design notes. They do not replace the BRD or the ERD at the repository root.

| File | Owns |
|---|---|
| [../SkillBite.md](../SkillBite.md) | Requirements, rules, acceptance criteria, open decisions |
| [../SkillBite-ERD.md](../SkillBite-ERD.md) | Entities, keys, relationships, token lifecycle |
| [requirements.md](requirements.md) | Requirement IDs mapped to entities and planned checks |
| [architecture.md](architecture.md) | Proposed system shape and data flows |
| [database.md](database.md) | How to read the ERD; what is not migrated yet |
| [api.md](api.md) | API rules that are known; contracts that are not |
| [security.md](security.md) | Secrets, sessions, authorization, incomplete checklist |
| [decisions/0002-confirmed-answers.md](decisions/0002-confirmed-answers.md) | Accepted answers to the open questions |
| [decisions/README.md](decisions/README.md) | How to add the next ADR |
| [testing.md](testing.md) | Planned layers and scenarios; none executed |
| [engineering.md](engineering.md) | Build order, gates, and deferred operations |
| [validation.md](validation.md) | BRD–ERD gaps that were not closed |

## Where the next change goes

- A business rule goes in `SkillBite.md`, then a row in `requirements.md`.
- A data-model change goes in `SkillBite-ERD.md`.
- An accepted technical choice becomes a new file in `decisions/`.
- Application code, tests, migrations, and CI wait until ADR 0001 is accepted or the user names the stack.

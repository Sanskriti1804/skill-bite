# Architecture decisions

An architecture decision record (ADR) states a choice that later code must follow. A proposal is not an accepted decision.

## Naming

`documentation/decisions/NNNN-short-title.md`

- `NNNN` is a four-digit sequence, starting at `0001`.
- Do not renumber an existing file.

## Required sections

- Title and status (`open`, `accepted`, or `replaced`).
- Context.
- Decision. Write “None” when the record only compares options.
- Alternatives.
- Consequences.
- Related BRD or ERD items.

## Current records

| ID | Status | File |
|---|---|---|
| 0001 | Replaced for the stack baseline. Hosting is still open. | [0001-technology-stack.md](0001-technology-stack.md) |
| 0002 | Accepted answers to Q-01–Q-26, except Q-05 and Q-25. | [0002-confirmed-answers.md](0002-confirmed-answers.md) |

Add a new ADR when a choice is actually made, including database engine, API style, video storage, push provider, and authentication library. Do not mark a recommendation as accepted inside the ADR.

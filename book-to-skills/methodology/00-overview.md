# RIA-TV++ Methodology Overview

This document is the design rationale behind the SOP book-to-skills runs — it explains *why*, not *how*. For the execution steps, read `SKILL.md` and `methodology/01-*` through `07-*`.

## Naming

**RIA-TV++** =
- **RIA** — Zhao Zhou's RIA bookmark reading method: Reading / Interpretation / Appropriation
- **TV** — Triple Verification, borrowed from nuwa-skill's triple-verification approach
- **++** — the extensions for agent execution: E (Execution: executable steps) + B (Boundary)

## Sources of inspiration

| Source | What we borrowed |
|---|---|
| Mortimer Adler, *How to Read a Book* | Stage 0: the three stages of analytical reading (structural / interpretive / critical) |
| Zhao Zhou's RIA bookmark reading method | Stage 2: the R-I-A1-A2 skeleton, especially A2 → trigger |
| Niklas Luhmann's Zettelkasten | Atomize + link + rewrite in your own words |
| Tiago Forte's Progressive Summarization | The "verifiable compression chain" idea behind Stage 4 |
| nuwa-skill | Stage 1's parallel extractors + Stage 1.5's triple verification |
| darwin-skill | Stage 4's `test-prompts.json` format + evolvability |

## Fundamental insight

**Existing reading methodologies distill books for human readers, not for agent executors.**

| Dimension | For a human reader | For an agent to use (book-to-skills' target) |
|---|---|---|
| Key field | story / quotable line / emotional hook | trigger / executable steps / stop criteria |
| Failure mode | forgotten after reading | mis-triggers → never invoked, or invoked on the wrong occasion |
| Success criterion | the reader feels they "got something out of it" | a real problem actually gets solved |

So every "extension" in RIA-TV++ — TV / E / B / test-prompts — exists to solve the new problems that this shift in target creates.

## Pipeline

```
          ┌─────────────────────────────┐
          │ Stage 0: Whole-Work          │  Adler's four passes
          │ Comprehension (Adler pass)   │
          └───────────────┬─────────────┘
                          │ BOOK_OVERVIEW.md
                          ▼
          ┌─────────────────────────────┐
          │ Stage 1: Parallel            │  5 subagents running at once
          │ Extraction                   │
          └───────────────┬─────────────┘
                          │ candidates/
                          ▼
          ┌─────────────────────────────┐
          │ Stage 1.5: Triple            │  V1 cross-corroboration /
          │ Verification                 │  V2 predictive power / V3 uniqueness
          └───────────────┬─────────────┘
                          │ passing units + rejected/
                          ▼
          ┌─────────────────────────────┐
          │ Stage 2: RIA++               │  R / I / A1 / A2 / E / B
          │ Construction                 │
          └───────────────┬─────────────┘
                          │ each skill's SKILL.md
                          ▼
          ┌─────────────────────────────┐
          │ Stage 3: Zettelkasten        │  linking + INDEX.md + GLOSSARY.md
          │ Linking                      │
          └───────────────┬─────────────┘
                          │
                          ▼
          ┌─────────────────────────────┐
          │ Stage 4: Pressure            │  test-prompts.json + blind
          │ Testing (darwin-compatible)  │  testing + full rebuild
          └───────────────┬─────────────┘
                          │
                          ▼
          ┌─────────────────────────────┐
          │ Stage 5: Delivery             │  DIGEST.md + install into
          │                               │  the skills directory
          └───────────────┬─────────────┘
                          │
                          ▼
          Can be fed straight into darwin-skill for automatic evolution
```

## Invariants (no iteration may violate these)

1. **Atomic**: one skill handles one methodology unit — never "one skill to rule them all"
2. **Traceable**: every skill must cite its source, pointing to a chapter in the source book (a timestamp / part number for video)
3. **Verifiable**: every skill must pass Triple Verification and Pressure Testing
4. **Evolvable**: every skill ships with a darwin-compatible `test-prompts.json`
5. **User-involved**: the user must confirm the skeleton after Stage 0, and confirm the shortlist after Stage 1.5
6. **Deliverable**: the pipeline's endpoint is "the user can actually invoke it" — skills must be installed into the skills directory, and the reader-facing need is served by `DIGEST.md`

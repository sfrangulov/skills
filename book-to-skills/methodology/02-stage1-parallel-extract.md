# Stage 1 — Parallel Extraction (5 Subagents at Once)

## Goal

Rather than reading through once from a single angle, **scan the whole book from 5 different angles at once**, maximizing candidate-unit coverage.

## Why parallel

- **Coverage**: a single angle misses things. Whatever the framework extractor can't recognize as a "counter-example," the counter-example extractor will.
- **Speed**: Claude Code's Agent tool supports parallel calls — no reason not to use it.
- **Independence**: each extractor judges independently, avoiding cross-contamination — Triple Verification only works if V1 cross-corroboration genuinely means "appeared independently."

## The 5 subagents

Each subagent receives:
- `BOOK_OVERVIEW.md` (Stage 0's output, providing global context)
- the book text (or a path to it)
- its corresponding extractor prompt (`extractors/<type>-extractor.md`)

and all 5 are spawned **simultaneously** through the Agent tool in a single call — not serially.

**Serial fallback**: when the current environment doesn't support parallel subagents, run the same 5 extractor prompts serially — each pass executes one extractor's job with a clean slate, uninfluenced by the previous extractor's judgments — the output format is unchanged.

## Chunking strategy for long text (when it exceeds a single subagent's context)

A dense multi-volume collection, or the transcript of a multi-hour video, can exceed what a single subagent can read in one pass. When that happens:

1. **Chunk it**: split along natural boundaries — chapters, volumes, video parts — sized so each chunk plus `BOOK_OVERVIEW.md` is comfortable for one subagent to read in full (rule of thumb: ≤50k words per chunk)
2. **Global anchor**: every chunk must carry `BOOK_OVERVIEW.md` along with it — it's the anchor the extractor uses to judge what role a given passage plays in the whole book, and it can't be skipped
3. **Scan chunk by chunk**: the extractor pulls candidates chunk by chunk, tagging each candidate with which chunk it came from (the `source_chapter` field carries this naturally)
4. **Merge across chunks**: once every chunk is scanned, the extractor runs one merge pass of its own — the same methodology appearing across multiple chunks gets merged into a single entry, keeping every provenance record (these multi-provenance entries are exactly the evidence Stage 1.5's V1 cross-corroboration needs)
5. Only after merging does the result get written to `candidates/<type>.md`

| # | extractor | looks for | writes to |
|---|---|---|---|
| 1 | framework-extractor | mental models / decision frameworks / reasoning methods | `candidates/frameworks.md` |
| 2 | principle-extractor | principles / checklists / rules / assertions | `candidates/principles.md` |
| 3 | case-extractor | real cases the author used in the book | `candidates/cases.md` |
| 4 | counter-example-extractor | failures / counter-examples / traps the author warns against | `candidates/counter-examples.md` |
| 5 | glossary-extractor | key-concept dictionary | `candidates/glossary.md` |

## Minimum fields per candidate unit

Whichever extractor produced it, every candidate unit must include:

```yaml
id: f01                            # type prefix + sequence number
title: Fixed time, variable scope   # short title
type: framework                    # framework / principle / case / counter-example / term
source_chapter: Shape Up — "Appetite"  # location in the book
source_quote: |                    # source quote, ≤100 words
  "Set the appetite first, then shape the solution to fit it — never the other way around."
summary: |                         # in your own words, 5-10 lines
  ...
tags: [scope, appetite]            # for linking later
```

## Self-check before submitting output

Every extractor asks itself, before submitting a candidate:
1. Does this unit have clear grounding **in the book**? (not something I made up)
2. Is it within my extractor's own remit? (don't overreach into another extractor's territory)
3. Has some other extractor already pulled this elsewhere? (duplication isn't a problem — Stage 1.5 will merge it)

## Not this stage's job

- **No filtering** — better to over-collect; leave filtering to Stage 1.5's Triple Verification
- **No writing skills** — only candidates come out of this stage, no SKILL.md
- **No cross-unit linking** — that's Stage 3's job

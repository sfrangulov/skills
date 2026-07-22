---
name: book-to-skills
description: Distill a book, long-video transcript, podcast, course, or interview into a coherent set of executable agent skills. Use when the user asks to "distill this book into skills", "turn this video/podcast/course into agent skills", or wants the frameworks, principles, and methodologies in long-form content extracted into atomic, reusable skills an agent can invoke in real situations. NOT for plain summarization, book reviews, or role-playing the author.
---

# book-to-skills — a meta-skill that distills a book into a set of executable agent skills

## Mission

Break the methodology buried inside a book into a set of **atomic skills an agent can invoke in real situations**, so the reader actually puts them to work.

> **Terminology**: throughout this document and everything under `methodology/` and `extractors/`, "book" is shorthand for any long-form source being distilled — a book, a long-video transcript, a podcast transcript, a course, an interview, a long article, a document set.

**Boundaries**:
- ✅ Do: distill methodologies / decision frameworks / checklists / principles / concept systems
- ❌ Don't: write book summaries / reviews / author-persona role-play (for that, use nuwa-skill)

## Core methodology: RIA-TV++

A seven-stage pipeline (Stages 0-5, plus a verification gate at 1.5) with parallel extraction, triple verification, and darwin-compatible testing. See `methodology/00-overview.md` for the full walkthrough.

```
Stage 0: Whole-Work Comprehension (Adler pass) → BOOK_OVERVIEW.md
Stage 1: Parallel Extraction (5 subagents)     → pool of candidate units
Stage 1.5: Triple Verification                 → passing units (light confirmation checkpoint)
Stage 2: RIA++ Construction                    → each skill's SKILL.md
Stage 3: Zettelkasten Linking                  → INDEX.md + GLOSSARY.md
Stage 4: Pressure Testing (darwin-compatible)  → test-prompts.json + full rebuild / cull
Stage 5: Delivery                              → DIGEST.md digest + install into the skills directory
```

## When to invoke this skill

The user says something like:
- "Distill Shape Up into skills"
- "Turn Buffett's shareholder letters into an investing skill pack"
- "Distill this podcast transcript into skills: <path>"
- "Make The Art of War's methodology into usable agent skills"

## Input requirements

Before you start, you **must** confirm with the user:
1. **Source text**: a path to a PDF / EPUB / TXT / subtitle file / transcript, or accessible plain text. Do **not** distill "from memory" without the text — stop and ask the user for it instead. (For a video or podcast, get the transcript first with yt-dlp or a similar transcript tool.)
2. **Source metadata**: for a book, "title + author + publication year"; for a video / podcast / course, "title + author (creator / host / lecturer) + release date". Used for directory naming and audit.
3. **First pilot?**: if this is the user's first run with book-to-skills, distill one source to validate the flow before doing a batch.

**Field mapping for non-book sources**: "chapter" fields such as `source_chapter` take a timestamp or part number for video, an episode number for podcasts, a lecture number for courses — anything that keeps the claim traceable.

No source at hand? README.md's Starter Corpus lists legally free books to distill first.

## Output structure

```
books/<slug>/
├── PIPELINE_STATE.md          # pipeline state: current stage + per-skill progress (for checkpoint resume)
├── BOOK_OVERVIEW.md           # Stage 0 output: thesis / skeleton / terms / critique
├── verified.md                # Stage 1.5 output: units that passed Triple Verification + rationale
├── INDEX.md                   # Stage 3 output: skill overview + reference graph
├── GLOSSARY.md                # Stage 3 output: glossary shared across the whole book
├── DIGEST.md                  # Stage 5 output: reader-facing digest
├── candidates/                # Stage 1 output: raw candidate pool (audit)
├── rejected/                  # Stage 1.5 culled units + reasons (audit)
├── <skill-slug-1>/
│   ├── SKILL.md
│   ├── test-prompts.json      # darwin-skill compatible format
│   └── test-results.md        # Stage 4 pass rate + failure analysis
└── <skill-slug-2>/
    └── ...
```

## Execution flow (strict order)

**Checkpoint resume**: before starting, check whether `books/<slug>/PIPELINE_STATE.md` exists. If it does, read it and resume from the recorded stage — don't start over. After finishing each stage, update that file (current stage / finished artifacts / per-skill status / next step); a simple checklist in markdown is enough.

### Stage 0 — Whole-Work Comprehension

1. Read the book text the user provided. Read large files in chunks.
2. Run the four Adler passes (structure / interpretation / critique / application) from `methodology/01-stage0-adler.md`.
3. Fill in `templates/BOOK_OVERVIEW.md.template` and write `books/<slug>/BOOK_OVERVIEW.md`.
4. Show the output to the user for confirmation: "Did I read the skeleton right? Anything you want emphasized?" Move to Stage 1 only after they confirm.

### Stage 1 — Parallel Extraction

Spawn 5 subagents via the Agent tool (one message, 5 parallel calls):

| subagent | prompt it reads | output |
|---|---|---|
| Framework extractor | `extractors/framework-extractor.md` | decision frameworks / mental models |
| Principle extractor | `extractors/principle-extractor.md` | principles / checklists / rules |
| Case extractor | `extractors/case-extractor.md` | real cases the author used in the book |
| Counter-example extractor | `extractors/counter-example-extractor.md` | failure modes the book warns against |
| Glossary extractor | `extractors/glossary-extractor.md` | key-concept dictionary |

Each subagent reads the book, extracts, and writes its output to `books/<slug>/candidates/<type>.md` independently.

- **Long text**: for content that exceeds one subagent's context, apply the chunking strategy in `methodology/02-stage1-parallel-extract.md`.
- **Serial fallback**: when the current environment doesn't support parallel subagents, run the same 5 extractor prompts serially — the output format is unchanged.

### Stage 1.5 — Triple Verification

Read `methodology/03-stage1.5-triple-verify.md` and run each candidate unit through:

- **V1 Cross-corroboration**: do at least 2 independent passages in the book back it up?
- **V2 Predictive power**: can you use it to answer a new question the book never states outright?
- **V3 Uniqueness**: is it more than generic common sense any smart person would land on?

Units that pass go to `books/<slug>/verified.md`. Units that fail go to `books/<slug>/rejected/` with the reason — keep the audit trail, and let the user pull one back later.

**Light confirmation checkpoint** ★: once filtering is done, show the user the list of "N passing candidate titles + M culled": "These N will become skills — anything to recover or cut?" Get confirmation before Stage 2 — Stages 2–4 are the most time-consuming part, and this checkpoint heads off a lot of rework.

### Stage 2 — RIA++ Construction

For each passing unit, fill in `templates/SKILL.md.template`:

- **R (Reading)**: source quote ≤100 words per passage
- **I (Interpretation)**: rebuild the methodology's skeleton in your own words (don't lift the source's wording verbatim)
- **A1 (Past Application)**: cases the author actually used in the book
- **A2 (Future Trigger)** ★: the situation in which the user needs this → the skill's `description` field
- **E (Execution)**: 1-2-3 executable steps
- **B (Boundary)**: when it doesn't apply / author blind spots carried over from the Stage 0 critique

See `methodology/04-stage2-ria-plus.md` for the details. Note: at this point A2's "distinction from adjacent skills" is only a **first draft** (based on the unit list in verified.md); backfill the final version once Stage 3 has built the links.

### Stage 3 — Zettelkasten Linking

Per `methodology/05-stage3-zettelkasten.md`:
1. Find the reference relationships between skills (A depends on B / A contrasts with B / A composes with B).
2. Add a "Related skills" section at the end of each SKILL.md, and backfill A2's "distinction from adjacent skills".
3. Generate `INDEX.md` from `templates/INDEX.md.template` (with a mermaid reference graph).
4. Consolidate `candidates/glossary.md` into `books/<slug>/GLOSSARY.md` — it's the shared dictionary for every skill, and shouldn't stay buried in the audit directory.

### Stage 4 — Pressure Testing (darwin-compatible)

For each skill, per `methodology/06-stage4-pressure-test.md`:
1. Design 5–10 test prompts and write them to `test-prompts.json` per `templates/test-prompts.json.template`.
2. Include at least 3 kinds: **should-trigger** / **should-NOT-trigger (bait prompt)** / **boundary-ambiguous**. At least 1 bait prompt must be a scenario that should trigger a *different* skill from the same book (the cross-skill confusion test).
3. Prefer blind-testing each prompt with an independent subagent, with the main flow tallying results against the expectations. Anything that fails goes back for a **full rebuild at Stage 2** — no cosmetic patching.
4. Write each skill's test outcomes to `<skill-dir>/test-results.md`.

### Stage 5 — Delivery

Per `methodology/07-stage5-deliver.md`:
1. Generate `books/<slug>/DIGEST.md` — a reader-facing digest (per `templates/DIGEST.md.template`) that serves the "don't read the whole book, just give me the essence" need.
2. Ask the user where to install (user-level `~/.claude/skills/` or project-level `.claude/skills/` / `.cursor/skills/`), then copy or symlink the skills that passed there — **without this step, the skills you produced can't actually be invoked**.
3. Tell the user: "Done — you can feed this straight into darwin-skill for automatic evolution."

## Quality red lines (a violation blocks output)

1. Every skill must pass **all** three verification checks.
2. Every skill must have complete R / I / A1 / A2 / E / B sections.
3. Source quotes are ≤100 words per passage.
4. Every skill must have a `test-prompts.json` that includes bait prompts (should-NOT-trigger scenarios), at least 1 of which is a sibling skill from the same book.
5. The `description` field must state clear trigger conditions — not just "a skill about X".

## Ecosystem: nuwa-skill / book-to-skills / darwin-skill

- **nuwa-skill**: distills people (thinking style / expression DNA) — <https://github.com/alchaincyf/nuwa-skill>
- **book-to-skills** (this skill): distills books (methodology / frameworks / principles); an English adaptation of cangjie-skill
- **darwin-skill**: evolves any skill — <https://github.com/alchaincyf/darwin-skill>

The three mesh together: the `test-prompts.json` this skill produces follows darwin-skill's format exactly, so the skills you generate can plug straight into darwin for automatic evolution.

## Invocation conventions

- **Always pilot 1 book first** — unless the user explicitly says "batch".
- **Report progress between stages** — don't run silently and dump the results at the end.
- **Never distill from memory** — no text, stop and ask.
- **Keep the audit trail** — hold on to both candidates/ and rejected/.
- **Resume anytime** — update PIPELINE_STATE.md after each stage, and recover from the state file after an interruption.

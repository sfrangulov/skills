# book-to-skills

**A Claude Code skill that distills a book — or any long-form source — into a set of atomic, executable agent skills.**

Point it at a book, a video transcript, a podcast, a course, or an interview. Get back a folder of agent skills, each with a trigger condition, executable steps, and a boundary that says when NOT to use it. The methodology comes off the page and into the moment you actually need it.

---

## Why

You read a good book. Six months later, what's left? A vague sense it was worth it, a few quotes, a highlight file you never reopen. The methodology stays on the page. When the real situation shows up — a hard product call, a negotiation, a hiring decision — you don't reach for what the book taught, because it was never in a form you could reach for.

Summaries don't fix this. A summary compresses the book. It doesn't make the book operational. You still have to remember to apply it, and remember how.

book-to-skills produces structured reuse instead. It turns the book's frameworks, principles, and checklists into atomic agent skills. Each skill carries a trigger condition (when the user needs this), the steps to execute, and an explicit boundary. The skill fires when the situation matches, so the knowledge arrives at the moment of decision rather than sitting in a highlight file.

> Throughout this project, "book" is shorthand for any long-form source: a book, a long-video transcript, a podcast, a course, an interview, a document set.

---

## How It Works

The engine is **RIA-TV++**: a seven-stage pipeline that reads the whole work, extracts candidate units in parallel, verifies each one three ways, builds it into a skill, links the skills together, pressure-tests them, and installs the survivors.

```
┌───────────────────────────────────────────────────────────────┐
│  Source: a book / transcript / podcast / course / interview    │
└───────────────────────────────┬───────────────────────────────┘
                                 ▼
  Stage 0    Whole-Work Comprehension  (Adler four-pass read)
             └─▶ BOOK_OVERVIEW.md          ★ confirm the skeleton
                                 ▼
  Stage 1    Parallel Extraction  (5 subagents, one message)
             framework · principle · case · counter-example · glossary
             └─▶ candidates/
                                 ▼
  Stage 1.5  Triple Verification
             V1 cross-corroboration · V2 predictive power · V3 uniqueness
             └─▶ verified.md  +  rejected/   ★ light confirmation
                                 ▼
  Stage 2    RIA++ Construction   (R · I · A1 · A2 · E · B)
             └─▶ <skill>/SKILL.md
                                 ▼
  Stage 3    Zettelkasten Linking
             └─▶ INDEX.md  +  GLOSSARY.md
                                 ▼
  Stage 4    Pressure Testing  (darwin-compatible)
             should-trigger · bait prompt · boundary-ambiguous
             └─▶ test-prompts.json  +  test-results.md
                                 ▼
  Stage 5    Delivery
             └─▶ DIGEST.md  +  install into your skills directory
```

**Stage 0 — Whole-Work Comprehension.** Read the whole source through the four Adler passes (structure, interpretation, critique, application) and write `BOOK_OVERVIEW.md`: thesis, skeleton, key terms, and where the author is weak. You confirm the skeleton before anything is extracted.

**Stage 1 — Parallel Extraction.** Five subagents run at once through the Agent tool — framework, principle, case, counter-example, and glossary extractors — each writing its own file into `candidates/`. When parallel subagents aren't available, the same five prompts run serially with the same output.

**Stage 1.5 — Triple Verification.** Every candidate unit faces three checks: V1 cross-corroboration (at least two independent passages back it), V2 predictive power (it answers a question the book never states outright), V3 uniqueness (it beats generic common sense). Survivors land in `verified.md`; culled units go to `rejected/` with a reason, so you can pull one back later. A light confirmation checkpoint here heads off rework before the expensive stages.

**Stage 2 — RIA++ Construction.** Each surviving unit becomes a skill with six sections: **R** (source quote), **I** (rebuilt in your own words), **A1** (the author's own cases), **A2** (the trigger that becomes the skill's `description`), **E** (1-2-3 steps), **B** (boundary and author blind spots).

**Stage 3 — Zettelkasten Linking.** Map how skills depend on, contrast with, or combine with each other. Add a "Related skills" section to each one, generate `INDEX.md` with a reference graph, and consolidate the shared `GLOSSARY.md`.

**Stage 4 — Pressure Testing.** Each skill gets 5–10 test prompts covering should-trigger, bait prompts (should-NOT-trigger), and boundary-ambiguous cases — with at least one bait prompt that should fire a sibling skill from the same book. Anything that fails goes back to Stage 2 for a full rebuild, not a cosmetic patch. Test format matches darwin-skill exactly.

**Stage 5 — Delivery.** Write `DIGEST.md` for the reader who wants the essence without the whole book, then install the passing skills into the directory you choose so they can actually be invoked.

Progress is reported between stages, and the run is resumable: `PIPELINE_STATE.md` records the current stage and per-skill status, so an interrupted run picks up where it left off.

---

## Output structure

```
books/<slug>/
├── PIPELINE_STATE.md          # current stage + per-skill progress (checkpoint resume)
├── BOOK_OVERVIEW.md           # Stage 0: thesis / skeleton / terms / critique
├── verified.md                # Stage 1.5: units that passed Triple Verification
├── INDEX.md                   # Stage 3: skill overview + reference graph
├── GLOSSARY.md                # Stage 3: glossary shared across the whole book
├── DIGEST.md                  # Stage 5: reader-facing digest
├── candidates/                # Stage 1: raw candidate pool (audit)
├── rejected/                  # Stage 1.5: culled units + reasons (audit)
├── <skill-slug-1>/
│   ├── SKILL.md
│   ├── test-prompts.json      # darwin-skill compatible format
│   └── test-results.md        # Stage 4: pass rate + failure analysis
└── <skill-slug-2>/
    └── ...
```

---

## Starter Corpus — legally free books to distill first

| Category | Book | Where | License status |
|---|---|---|---|
| Investing & decisions | Warren Buffett's Shareholder Letters (1977-2024) | https://www.berkshirehathaway.com/letters/letters.html | official free |
| Investing & decisions | Charlie Munger, "The Psychology of Human Misjudgment" | https://fs.blog/great-talks/psychology-human-misjudgment/ | free transcript |
| Investing & decisions | The Almanack of Naval Ravikant | https://www.navalmanack.com/ | official free PDF |
| Product & startup | Shape Up (Basecamp) | https://basecamp.com/shapeup | official free |
| Product & startup | Getting Real (37signals) | https://basecamp.com/gettingreal | official free |
| Product & startup | Paul Graham, Essays | https://paulgraham.com/articles.html | official free |
| Product & startup | Sam Altman, Startup Playbook | https://playbook.samaltman.com/ | official free |
| Engineering | Site Reliability Engineering (Google) | https://sre.google/sre-book/table-of-contents/ | official free |
| Engineering | Software Engineering at Google | https://abseil.io/resources/swe-book | official free |
| Classics | The Art of War (Sun Tzu) | https://www.gutenberg.org/ebooks/132 | public domain |
| Classics | Meditations (Marcus Aurelius) | https://www.gutenberg.org/ebooks/2680 | public domain |
| Classics | The Autobiography of Benjamin Franklin | https://www.gutenberg.org/ebooks/148 | public domain |
| Classics | The Elements of Style (Strunk, 1918) | https://www.gutenberg.org/ebooks/37134 | public domain |

Recommended pilot: **Shape Up** — small, pure methodology, official free PDF.

---

## Installation

### Via skills.sh

```bash
npx skills add sfrangulov/skills --skill book-to-skills
```

### Manual installation

Clone the repo and copy the skill folder into your Claude Code skills directory:

```bash
git clone https://github.com/sfrangulov/skills.git
cp -r skills/book-to-skills ~/.claude/skills/
```

---

## Attribution

English adaptation of [cangjie-skill](https://github.com/kangarooking/cangjie-skill)
by [kangarooking](https://github.com/kangarooking) (MIT), ported from upstream
commit `355dd47a97ee` (2026-07-20). Pipeline architecture (RIA-TV++) is preserved
1:1; prose rewritten in English; book examples replaced with legally free
English-language sources. Sibling projects by the original ecosystem:
[nuwa-skill](https://github.com/alchaincyf/nuwa-skill) (distills people),
[darwin-skill](https://github.com/alchaincyf/darwin-skill) (evolves skills).
Not endorsed by the original author.

# Stage 5 — Delivery (DIGEST + Install)

## Goal

Get the pipeline's output into the hands of the two people who actually need it:

1. **The agent** — a skill must be installed into the host environment's skills directory, or it will never be invoked
2. **The human reader** — a `DIGEST.md` reader-facing digest serves the "I don't want to read the whole book, just give me the essence" need

Skip either of these and every stage before this one just produced a pile of files sitting in a repository.

## Step 1 — Generate DIGEST.md (a reader-facing digest)

### Why this happens last, not at Stage 0

Stage 0's `BOOK_OVERVIEW.md` is the **pipeline's global context** — it gets fed to every subagent, so it has to stay lean; it can't grow for readability's sake. The digest is written for a human reader at the very end of the process, when the most complete material is on hand:

- `BOOK_OVERVIEW.md` — the skeleton / key terms / critique
- `verified.md` — the methodologies that passed Triple Verification (already filtered of padding)
- Each skill's `SKILL.md` — the explanation / cases / boundaries for each methodology
- `candidates/cases.md` / `counter-examples.md` — the case pool and counter-example pool
- `GLOSSARY.md` — the glossary

**The digest is "the distillation re-presented," not "re-summarized"** — it only writes up content that passed verification, so it's naturally more concentrated than an ordinary book summary.

### Length and structure requirements

- **Length**: 5,000–10,000 words (scale to the content's actual size; a 20-minute video transcript doesn't need to be padded out to 5,000 words)
- **Organization**: organize sections around the source's own skeleton (`BOOK_OVERVIEW.md`'s top-level arguments), not around the skill list — the reader wants "what this book is about," not a manifest of the pipeline's output
- Give every core methodology its own short section: what problem it solves → its core logic → the source's most representative case → when it stops working
- Must include a **counter-examples / traps** section (from `counter-examples.md`) and an **author's limits** section (from the Stage 0 critical pass) — a digest that only reports the good news is marketing copy, not distillation
- End each methodology section with a link to its corresponding skill directory, so a reader who wants to go deeper has a path
- Quoting the source's memorable lines in moderation is fine (each quote still follows the ≤100-word quota)

Template: `templates/DIGEST.md.template`, output to `books/<slug>/DIGEST.md`.

### Quality self-check

- [ ] Someone who never read the source could, after reading the digest, restate its thesis, 3+ core methodologies, and 2+ traps
- [ ] Nothing that failed Triple Verification is presented as a core methodology
- [ ] There's a critique/limits section — it isn't wall-to-wall praise
- [ ] Every methodology section links to its skill

## Step 2 — Install the skills into the host environment

The output directory `books/<slug>/<skill-slug>/` is just a build artifact — the host (Claude Code / Cursor / etc.) won't load a skill from there. It must be installed:

1. **Ask the user where, once, up front** (not skill by skill):
   - User-level: `~/.claude/skills/<skill-slug>/` (usable from every project)
   - Project-level: `<project>/.claude/skills/<skill-slug>/` or `.cursor/skills/<skill-slug>/`
   - The user may only want the repository form (to publish to GitHub) — in that case, skip installation
2. **Install only the skills that passed Stage 4** — anything that didn't pass stays in the build directory for a rebuild
3. Copy (or symlink) the whole skill directory, including `SKILL.md` and `test-prompts.json`
4. After installing, spot-check 1–2 skills with a single should-trigger prompt to confirm the host can load and invoke them

## Step 3 — Wrap-up report

Tell the user:

> Done. Output: N skills (installed to <location>), `INDEX.md`, `GLOSSARY.md`, `DIGEST.md` (a reader-facing digest, ~X words).
> For continued evolution, feed this straight into darwin-skill: `darwin evolve books/<slug>/`
> It will use the `test-prompts.json` files here to drive ratcheting automatic evolution.

Finally, mark `PIPELINE_STATE.md` as fully complete.

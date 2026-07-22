# Stage 2 — RIA++ Construction

## Goal

Turn every methodology unit that passed Stage 1.5 into a `SKILL.md` that conforms to the Claude Code skill spec.

Template: `templates/SKILL.md.template`

## The six RIA++ sections

### R — Reading (source quote)

- A direct quote, ≤100 words
- Must cite its location (chapter / page / paragraph marker; a timestamp or part number for video, an episode number for a podcast)
- If the source is in a language other than English, quote the original passage plus your own translation — **don't lift an existing published translation** (translator copyright, and a published translation can distort the meaning)

### I — Interpretation (own-words rebuild)

- Rebuild the methodology's core skeleton **in your own words**
- 5–15 lines
- Check: after reading this section, could someone who never read the source understand what the methodology does? If not, rewrite.
- Forbidden: lifting the source's sentences verbatim / piling on rhetoric

### A1 — Past Application (author's own cases)

- Concrete cases where the author **personally** used this methodology in the source
- At least 1, at most 3
- Each case should spell out: what problem came up → how the methodology was applied → what conclusion it produced → what actually happened

This section's job is to give the agent concrete analogical material to draw on when the skill is invoked.

### A2 — Future Trigger ★ (the make-or-break section)

**This determines whether the skill actually gets used.**

Must state clearly:
1. **What situation will the user be in when this problem comes up?** (3–5 concrete scenarios)
2. **What are the language signals for these situations?** (what the user is likely to say)
3. **How does it differ from adjacent skills?** (so it doesn't compete with other skills for invocation)

A2's output goes straight into the skill frontmatter's `description` field — that's what Claude uses to decide whether to activate the skill.

Notes:
- "Distinction from adjacent skills" is only a **first draft** at this stage (inferred from the unit list in `verified.md`); Stage 3 finalizes it once the link relationships are built — don't hard-code adjacency here.
- No sibling-skill list exists yet at Stage 2, so this first draft may just flag "there will likely be a sibling skill on X — revisit at Stage 3" rather than naming a slug.

**Good A2 example** (from a "fixed time, variable scope" skill distilled out of Shape Up):
> When the user is scoping a new feature or project and instinctively starts by estimating how long the full idea will take; or asks "how do I fit all of this in"; not applicable to pure time-management or calendar-blocking questions.

**Bad A2 example**:
> When the user needs to plan something. ← too broad, will over-trigger

### E — Execution (executable steps)

- Turn the methodology into 1-2-3 steps
- Every step has a **checkable completion criterion**
- If there's a stop condition (after step 2, if X, skip to step 5), write it out explicitly

E's job is to give the agent a clear execution path when it invokes this skill — not "improvise from here."

### B — Boundary

- When **not** to use this skill (counter-scenarios)
- Failure modes the author warned about in the source
- The author's blind spots, carried over from the Stage 0 critical pass
- Adjacent methodologies that are easy to confuse this one with

B's job is to **prevent misuse**. A skill with no B section gets invoked when it shouldn't be, and ends up doing more harm than good.

## Frontmatter design

```yaml
---
name: <skill-slug>                    # kebab-case, unique
description: |                        # A2's condensed form, ≤300 words
  <when to use it + when not to + key triggers>
source_book: Shape Up — Ryan Singer
source_chapter: Chapter 3, "Fixed Time, Variable Scope"
tags: [scope, appetite, product-methodology]
related_skills: []                    # filled in at Stage 3
---
```

## Common failure modes

1. **I reads like a book excerpt** — if it reads like "in this chapter, the author says X," you're transcribing, not interpreting. Rewrite it.
2. **A2 is too broad** — a trigger like "when the user needs to make a plan" will never fire precisely. It needs an **identifiable language signal**.
3. **E has philosophy but no actions** — "stay objective" isn't a step; "list the 3 outcomes you least want to happen" is.
4. **Missing B** — a skill without a boundary gets over-invoked, and the user ends up disappointed.
5. **Jumping straight from I to E, skipping A1** — this loses the "the author actually used this" evidence, and the skill loses its authority.

# Stage 1.5 — Triple Verification Filtering

## Goal

From the pool of candidate units, filter out **the methodology units that genuinely deserve to become a standalone skill**. Anything that doesn't pass gets downgraded to an example, a citation, or a glossary term — not a skill of its own.

This is the quality gate that separates book-to-skills from a plain book-summary tool.

## Triple Verification (all three must pass)

### V1 — Cross-corroboration

**Question**: is this unit backed up in **at least 2 independent contexts** in the book?

- What "independent" means: not the same case restated in different words, but two different stories, different chapters, or different subjects making the same point
- **Pass**: Buffett's shareholder letters return to "circle of competence" across investment decisions, manager selection, and general career advice to shareholders — three independent contexts → pass
- **Fail**: a nice-sounding sentence that appears once, in one chapter, with no independent corroboration elsewhere in the book → downgrade to a quotable example

**Why**: something that recurs across multiple contexts is the stable methodology the author actually means to convey — not a phrase they reached for once.

### V2 — Predictive power

**Question**: can this unit be used to derive the answer to a question the book never directly discusses?

- Design a scenario the book doesn't directly address
- Try applying the methodology to analyze it
- **Pass**: it produces a meaningful, non-trivial conclusion → pass
- **Fail**: it only produces something like "try harder and you'll succeed" → the unit has no real explanatory power, downgrade it

**Why**: a genuine methodology must **extrapolate**. If it can only restate the book's own examples, it's description, not method.

### V3 — Uniqueness

**Question**: is this unit just common sense that any smart person would land on anyway?

- If you erased the author's name, would a smart person with no background in the field say the same thing? → fail
- It has to reflect the author's **distinctive angle, counterintuitive insight, or distinctive vocabulary** → pass
- **Pass**: Shape Up's rejection of a running backlog — deliberately not keeping one, on the theory that ideas worth doing will resurface on their own → pass, genuinely counterintuitive
- **Fail**: "manage your time well" — too generic; nobody needs a skill to tell them this

**Why**: common sense doesn't need a skill to carry it — Claude already knows it. Only the author's **differentiated insight** is worth encoding as a skill.

## Verification workflow

1. Merge Stage 1's 5 `candidates/*.md` files into one combined pool
2. Deduplicate: the same methodology extracted by multiple extractors gets merged into one entry
3. Run V1 / V2 / V3 against every candidate, recording the judgment and the reasoning for each
4. Units that pass go to `books/<slug>/verified.md`
5. Units that fail go to `books/<slug>/rejected/<id>.md` — **record which check it failed and why** (that's the audit value)
6. **Light confirmation checkpoint** ★: show the user "N passing candidate titles + M culled," and ask "these N will become skills — anything you want to recover or cut?" Get confirmation before moving to Stage 2 — Stages 2–4 are the most time-consuming part of the whole pipeline, and this one question heads off a lot of rework

## Output template (one entry in verified.md)

```yaml
id: f01
title: Fixed time, variable scope
type: framework
V1_cross_corroboration:
  passed: true
  evidence:
    - Chapter on setting appetite for a new feature
    - The betting table's scope cuts
    - The circuit breaker as a scope-forcing device
V2_predictive_power:
  passed: true
  novel_question: "How should a two-person team decide whether to take on a client's request for a custom integration?"
  derived_answer: "Set the appetite first (say, two weeks) independent of the request's apparent size, then shape the integration to fit that budget — cut or defer whatever doesn't fit, rather than open-endedly estimating the request as given"
V3_uniqueness:
  passed: true
  why_not_common: "Common sense says 'scope the work, then estimate how long it needs'; this unit inverts that order — fix the time first, then shape the scope to match"
→ proceeds to Stage 2
```

## Common failure modes

1. **Gaming V1** — counting the same example under a different phrasing as two independent occurrences. Requirement: it must be a different chapter, a different subject, and a different conclusion.
2. **Gaming V2** — passing off a question the book already discusses as if it were "novel." Requirement: the new question should look, at first glance, like something the book never addressed.
3. **Applying V3 too loosely** — treating "phrased more elegantly" as proof it isn't common sense. Requirement: judge whether the **substance** is counterintuitive, not the wording.

## Pass-rate expectations

In practice, a methodology-dense book runs a pass rate around 30–50%; a narrative or essay-driven book may see only 5–10%. Be suspicious of a pass rate that's too low (<5%) or too high (>80%):
- Too low: the extractors may be underperforming — rerun them
- Too high: the verification bar may be set too loosely

# Stage 0 — Whole-Work Comprehension (Adler's Analytical Reading)

## Goal

Before you start pulling the book apart, actually **read and understand it**. Skip this step and what you extract is just a pile of quotable lines — carrying the author's blind spots without anyone noticing.

Output: `books/<slug>/BOOK_OVERVIEW.md` (filled in from `templates/BOOK_OVERVIEW.md.template`).

## Four passes (the first three come from Adler; the fourth is this skill's own addition)

### Pass 1 — Structural

Identify the book's skeleton. Answer:

- **What kind of book is this?** (methodology / biography / philosophy / practical manual / …)
- **What's its thesis in one sentence?** — it has to genuinely compress to one sentence
- **How do its main parts combine into a whole?** — list 3–7 top-level arguments and mark how they relate (parallel / progressive / contrasting / rebutting)
- **What core problem is the author trying to solve?**

### Pass 2 — Interpretive

- **Key terms**: list the concept-words the author uses repeatedly with a specific meaning, and write one sentence per term capturing the author's own usage (not a dictionary definition)
- **Core propositions**: restate the author's 5–15 core claims in your own words
- **Argument chain**: how do these claims derive from one another? What evidence does the author use to support them?

### Pass 3 — Critical ★ the pass most often skipped, and the most important one

Adler's own line: you cannot say you agree or disagree with the author until you can locate the fault in the argument. Flip that around: **you also can't fully agree until you've located the author's limits.**

Must answer:
- **The author's era-bound limits**: when was this written? which premises may no longer hold?
- **The author's positional blind spots**: what does the author's identity, industry, or cultural background lead them to overlook?
- **Unproven assumptions**: what does the author treat as self-evident that actually needs arguing for?
- **The strongest counter-argument**: if someone set out to refute this book, what would their best argument be?

This pass's output becomes the direct source for every skill's **Boundary (B)** field.

### Pass 4 — Applicability (this skill's own addition)

- **What can become a skill?** — frameworks / checklists / principles / decision procedures
- **What shouldn't become a skill?** — pure historical material / pure narrative / pure sentiment (though it can still serve as an example for another skill)
- **Estimated skill count**: give a rough range — don't force a number
- **Estimated priority**: rank candidate skills by how much each one empowers an ordinary person

## Quality gate (must be satisfied before moving to Stage 1)

- [ ] The thesis can be stated in one sentence
- [ ] The skeleton lists 3–7 top-level arguments
- [ ] The key-term glossary has ≥5 entries
- [ ] The critical pass lists at least 3 of the author's limits (don't move on until this is done properly)
- [ ] `BOOK_OVERVIEW.md` has been shown to the user and confirmed

## Common failure modes

1. **Skipping the critical pass** — leads to skills that treat the author's biases as truth
2. **The skeleton is your own thinking, not the author's** — watch whether you're writing a summary or a reaction piece
3. **Defining terms from the dictionary or common sense instead of the author's specific usage** — an author's "circle of competence" and the dictionary's "circle of competence" are not the same thing

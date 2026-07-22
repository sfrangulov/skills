# Stage 3 — Zettelkasten Linking + INDEX

## Goal

Make the relationships between atomic skills explicit, turning them into a navigable network instead of a pile of isolated files.

## Three kinds of relationship

1. **depends-on**: using A presupposes understanding B first
   - Example: a "checklist decision" skill depends on a "multiple mental models" skill (the checklist's items come from the models)

2. **contrasts-with**: A and B are two alternative approaches — pick one depending on the situation
   - Example: "forward reasoning" contrasts with "inversion thinking"

3. **composes-with**: A and B are frequently used together
   - Example: "circle-of-competence judgment" composes with "margin of safety"

## Execution steps

1. List every skill produced by Stage 2.
2. Scan every pair, checking whether one of the three relationships above holds.
3. Fill each skill's frontmatter `related_skills` field:
   ```yaml
   related_skills:
     - slug: multi-mental-models
       relation: depends-on
     - slug: forward-reasoning
       relation: contrasts-with
   ```
4. Append a "Related skills" section to the end of each `SKILL.md`, explaining the relationships in plain prose.
5. **Backfill A2**: once the link relationships are settled, go back to each skill's A2 section and turn Stage 2's "distinction from adjacent skills" first draft into the final version (updating the frontmatter `description` field in the same step).
6. Generate `books/<slug>/INDEX.md` (template `templates/INDEX.md.template`).
7. Consolidate `candidates/glossary.md` into `books/<slug>/GLOSSARY.md` — it's the shared dictionary for every skill, so it belongs at the root of the output where it's visible, not buried in the audit directory; link it from `INDEX.md`.

## `INDEX.md` must include

- The source's basic information (author / year / one-sentence thesis)
- A list of every skill, grouped by topic
- A reference graph (a mermaid flowchart or graph)
- A recommended reading order (derived from the dependency relationships)

## Principle of restraint

**Don't force relationships that aren't there.** If two skills have no genuine dependency / contrast / composition relationship, leave `related_skills` empty. Sparse is better than a fabricated link.

A rule of thumb: a book that yields 10 skills should produce roughly 8–15 relationships. Fewer than 5 suggests the units were split too independently (possibly the wrong units were chosen); more than 25 suggests relationships are being forced into existence.

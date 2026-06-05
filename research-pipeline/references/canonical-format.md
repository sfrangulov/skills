# Canonical research-doc format (Stage 7b emit)

The final document form. Order: **frontmatter → body → `## Источники` → collapsed
provenance-callout.** Split principle: *queryable → frontmatter; readable citation →
body/Источники; machine audit → callout. No field duplicated needlessly.*

Verify-then-emit: the snapshot/coverage gates (`check_research_snapshots.py`,
`check_all.py`) parse the **working form** (`[^h:<sha8>]` + bare `provenance-manifest`),
so run them in Stage 7a BEFORE this transform. This canonical form is the at-rest doc;
downstream repos validate it with their own gate (e.g. `check-research-canonical.sh`).

## 1. Frontmatter (flat YAML — Obsidian Properties / Tolaria)

```yaml
---
type: research
title: "Human-readable title"        # = the first H1
created: YYYY-MM-DD                    # was PROVENANCE Generated/Created
updated: YYYY-MM-DD                    # = created for frozen docs; bump on edit
status: canonical                     # canonical | superseded | draft
method: research-pipeline             # research-pipeline | deep-subagent | manual-recon | ...
beads: s-xxx                          # primary beads id (omit if none)
related: [s-xxx, ...]                 # related ids (omit if none)
source_urls:                          # flat list — queryable "docs by source X"
  - https://...
tags: [research]
---
```

Flat scalars/lists only (no nested objects). Omit keys with no value.

## 2. Body

- Clean prose. Citations are markdown footnotes `[^slug]` (slug = a short stable
  token from the source: domain+topic, e.g. `anthropic-prompt`, `gpt5-guide`). The
  SAME source → the SAME slug everywhere. **Never `[^h:<sha8>]` in the final form.**
- Render-safety: code-span strictly one line; no triple-backtick inside a single
  span; `<placeholder>` only inside a valid code-span.
- No `provenance-manifest` block and no `<!-- PROVENANCE -->` in the body.

## 3. `## Источники`

Clickable footnote definitions (resolve only from the body), one per distinct slug:

```
[^slug]: [label](url) — locator/section.
```

Every `[^slug]` used in the body MUST have a definition here — zero orphans.
Recon-only docs (no citations) omit this section.

## 4. Collapsed provenance-callout (very end)

```
> [!note]- Provenance & source manifest — <method> (machine audit)
> <provenance prose verbatim: method, grounding, stage-payoff, supersedes>
>
> ```provenance-manifest
> <TSV lines verbatim>
> ```
```

Collapsed (`-`) by default: out of the reading flow, expand for audit. SHA / timestamp /
tool live here (repro anchor), `> `-prefixed, verbatim.

## 5. Lossless rule

Body prose must be char-identical to the working form after stripping footnote
markers (`[^...]`) and the moved provenance/manifest. Whitelisted changes only:
`[^h:<sha8>]`→`[^slug]` relabel, provenance/manifest → callout, structural fields →
frontmatter, whitespace reflow. Any other delta → manual review, do not ship.

## 6. Doc variants

- **Cited research** — manifest + footnotes → full form (§1–4).
- **Recon-only** — provenance without citations → frontmatter + collapsed callout,
  **no** `## Источники`.
- **Notes** (`docs/notes/`) — light: frontmatter (`type: note`) only; no callout required.

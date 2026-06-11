# Reconnaissance (Stage -1)

Runs **before** Stage 0, executed by the lead (the main thread — only it
may query the user; subagents cannot). Output feeds the Stage 0 effort
tier and is consumed by the Stage 6 adversary. It exists because
freshness, project-personalization, and breadth are lost when they are
*emergent* expectations instead of *contracted* ones — this stage
contracts them without weakening the verbatim canon.

## -1a — Scoping (gap-driven, ≤3 questions)

Reconcile the request against this mandatory checklist:

- **objective** — the one question the work answers
- **scope / boundaries** — explicitly in and out
- **freshness horizon** — how current sources must be (e.g. "current
  flagship models only", or "any official version")
- **project-payload** — path to a personal/project context file to
  cross-reference, if any

Ask the user **only the missing items**, at most **3 questions**. If the
request already answers them, **or the user is unavailable** (autonomous
run), ask **0** questions and record the derived assumptions explicitly
in the recon-manifest preamble — never silently.

## -1b — Source-triage (autonomous)

On the refined scope, probe the source landscape (discovery only — no
canonization here). For every candidate source, judge: is it material to
a load-bearing claim, what is its source class, how current is it. Emit
the recon-manifest.

## recon-manifest

A fenced ` ```recon-manifest ` block in the document. Optional free-text
preamble lines starting with `#` (record -1a assumptions here). Then one
TSV line per source, fields in this exact order:

```
material	url	source_class	freshness	why	verdict_slot
```

- `material` — `yes` | `no`. `yes` puts the line under the Stage 7 gate.
- `url` — the source URL (no tab/newline).
- `source_class` — `official` | `primary` | `authoritative-secondary` |
  `general` (the Stage 3 source-discipline priority order; as in subagent-spec.md).
- `freshness` — recon judgment: `current` | `stale?` | `unknown`,
  optionally `current:<version>` (e.g. `current:GPT-5.5`).
- `why` — one phrase: why it is material. Advisory; read by the lead and
  the Stage 6 adversary. Not gated.
- `verdict_slot` — filled by canonization time: `snapshotted:<sha8>` |
  `gap:weakened` | `gap:dropped`. (Empty until then.)

`source_class`, `freshness`, `why` are **judgment** and are deliberately
**not** gated (faking that gate would repeat the v1.1 mistake — see
SKILL.md "Known limitations"). The only mechanical obligation
is: a `material=yes` line must, by canonization, carry
`verdict_slot=snapshotted:<sha>` (sha present in the provenance-manifest)
**or** `gap:weakened` / `gap:dropped` with a matching note in the body.
A material source the recon named must not silently vanish.

## Example

```recon-manifest
# -1a assumptions (user unavailable): scope = official vendor docs only;
# freshness horizon = current flagship models; payload = none.
yes	https://docs.anthropic.com/.../prompt-engineering	official	current:Opus-4.7	core Anthropic guidance	snapshotted:310825b9
yes	https://example.gov/regulator-report	official	stale?	deeper regulator source	gap:weakened
no	https://random-blog.example/opinion	general	unknown	background only	
```

---
name: oss-product-selection
description: |
  Picks the next open-source product to ship when the goal is personal brand growth, not revenue. Trigger whenever the user is deciding which OSS tool, npm CLI, dev utility, or side project to build next — including phrases like "what should I open-source next", "picking my next product", "OSS portfolio strategy", "expanding my portfolio", "choose my next side project for brand", "help me decide between tool ideas", "is this a good idea to ship", "viral dev tool ideation", "indie hacker product selection", or when they describe an existing portfolio and ask what to add. Trigger even when the user does not say "OSS" — any time they weigh multiple build ideas for brand, audience, or career reasons qualifies. Runs 7 phases with hard gates — constraints, asset inventory, broad ideation, competitive/platform/pain/hype scans, two-axis brand-vs-product scoring, naming, reality check and spec. Prevents premature ideation, skipped competitive research, naming collisions, and the platform shipping a native equivalent.
---

# OSS Product Selection

A structured workflow for picking the next open-source product to build when the goal is **personal brand growth** rather than revenue. Most "what should I build next?" advice optimizes for monetization or product-market fit. That advice is wrong here. Brand-driven OSS has a different success function: stars, downloads, narrative coherence with prior work, audience fit, and signaling value. This skill bakes those criteria in and protects against the specific mistakes that derail brand-led product selection.

## When this skill applies

Trigger this skill when the user is choosing among multiple possible OSS products to build, with brand-building (not revenue) as the dominant goal. The user usually has 1–3 products already shipped and is deciding what to ship next. Common framings: "what should I open-source next", "I have these three ideas, which one", "expanding my portfolio with X", "help me figure out my next side project for brand", "is `<idea>` a good thing to OSS".

## When this skill does not apply

Skip this skill when:

- The user wants help **building** an already-chosen product (use coding skills instead).
- The user is choosing a startup or revenue-bearing product (different success function — use product-management or consulting-problem-solving).
- The user wants pure idea generation with no commitment to ship (this skill front-loads constraints because shipping is the assumed outcome).
- The user already shipped and wants growth/launch tactics, not selection (handoff territory).

## Core principles

These five principles drive every gate and operation in the workflow. Hold them in mind while running the skill.

**1. Brand fit and product fit are independent.** A product can have great brand fit (perfect narrative coherence with prior work) and weak product fit (no real users would touch it), or vice versa. Collapsing them into one score destroys signal. Score them on separate axes; let the user weigh them.

**2. Conditions that produced past wins might not transfer.** A successful prior product worked because of a specific combination of timing, ecosystem gap, audience receptivity, and narrative novelty. Before recommending an extension or sequel, explicitly check whether those conditions still hold. Platforms ship native equivalents; gaps close; hype waves end.

**3. Competitive and platform scans are not optional.** It is tempting to fall in love with an idea before checking the landscape. Resist. Phase 4 is mandatory before any scoring, and the scans run in parallel because sequential adds hours.

**4. Hard gates beat soft checkpoints.** Each phase ends with an explicit user approval. Without "yes, proceed", the workflow does not advance. This is the main thing that makes selection rigorous instead of a free-form brainstorm.

**5. Reality check before commit.** The output of this skill is a committed product spec, not a wishlist. Three litmus tests gate the commit: would the user actually use this 5+ times in 6 months, can it be demoed without compliance issues, and does the 30-second pitch hold up. Fail any one and the option does not ship.

## Workflow: 7 phases with hard gates

Each phase has the same structure: **INPUT** (what to ask the user — usually one question at a time, never all at once), **WORK** (what to do, including any research operations to invoke), **REVIEW GATE** (explicit approval before progressing), **OUTPUT** (a markdown file in the working directory).

Operations referenced as `OP-NICHE`, `OP-PLATFORM`, etc. have full specs in `references/operations.md`. Read that file when you reach a phase that uses operations — do not try to recall the schemas from memory.

### Phase 1: Why & Constraints

The most common failure mode is jumping to ideation before the success function is locked. This phase exists to prevent that. Do not let the user skip it; do not let yourself skip it. If the user wants to brainstorm immediately, gently redirect — "before we generate options, I need three things from you, otherwise we have no way to score them later".

**INPUT** — ask one question at a time, in order:

1. *Brand goal — what does "winning" look like concretely?* "Get more famous" is not enough. Push for a specific shape: "X stars within Y weeks", "narrative as the Z person", "speaking opportunity at W conference", "audience growth from N to M followers".
2. *Hard constraints — what is non-negotiable?* Time per week, money budget, compliance limits (e.g., client confidentiality if the user is a consultant), energy, family commitments. These will be used as kill criteria later.
3. *Success criteria — measurable and brand-aligned.* Should contain a number and a deadline. "Some traction" is not measurable.

**REVIEW GATE**: User explicitly approves all three. Quote them back and ask "are these locked in for the rest of this exercise?". Without explicit "yes", stop here.

**OUTPUT**: `01-why-constraints.md` — three sections (brand goal, constraints, success criteria), each with the user's locked answer.

### Phase 2: Asset Inventory & Condition Check

Before generating new options, audit what exists and check whether the conditions that made past products work still hold today.

**WORK**:

1. List the user's shipped or in-progress products with whatever metrics they have (stars, downloads, retention, launch reception, whether it landed culturally).
2. Identify the conditions that made past wins possible. Usually a combination: timing, audience receptivity, ecosystem gap, narrative novelty. Ask the user; don't guess.
3. Invoke **OP-CONDITIONS** to compare those conditions then versus now.

**REVIEW GATE**: User confirms which conditions transfer to today and which do not. This shapes which categories of ideas are still viable in Phase 3.

**OUTPUT**: `02-asset-inventory.md` — table of past products + conditions then-vs-now + transferability verdict per condition.

### Phase 3: Diverge — Broad Option Generation

Generate options across MECE categories. The point of this phase is breadth; do not filter, do not rank, do not eliminate yet. Filtering belongs in Phase 4.

**WORK**: Generate at least 10 options total, with at least one option in each of these four categories:

- **Extension** — fourth/fifth product in the user's current family, same pattern as past wins.
- **Adjacent** — same ecosystem as prior work but different category.
- **Universal** — broader cross-ecosystem audience, less tied to current niche.
- **New domain** — fresh start in a different domain, hedges against platform risk and pattern fatigue.

For each option give a one-line value proposition. No marketing copy yet.

**REVIEW GATE**: User approves the option list, or asks for more in a specific category. The user does NOT pick a winner yet.

**OUTPUT**: `03-options.md` — 10+ options, grouped by category, one-line value prop each.

### Phase 4: Niche & Platform Scan (HEAVY parallel)

This is the heaviest phase. Done sequentially it takes hours; done in parallel it takes 5–10 minutes. Always parallelize.

**WORK** — invoke operations in parallel where possible. Read `references/operations.md` first.

For the top N options the user wants to investigate (typically 5–7):

- **OP-NICHE** — one subagent per option, fully parallel. Maps existing tools, saturation, coverage gaps.
- **OP-PAIN** — one subagent per option (or per channel within an option), parallel. Validates audience pain.

Once per category in the option list (not per option):

- **OP-PLATFORM** — one subagent. Scans the upstream platform for features about to ship that would obsolete the option.
- **OP-HYPE** — one subagent. Maps recent viral content, hype phase, crowded angles, open angles.

If the user has 5 options across 2 categories: that's 5 OP-NICHE + 5 OP-PAIN + 2 OP-PLATFORM + 2 OP-HYPE = 14 subagents in parallel. Send them all in a single tool turn.

After the scans return, synthesize a saturation matrix. Use `assets/templates/saturation-matrix.md` as a starting template.

**REVIEW GATE**: User reviews eliminations and approves which options survive to scoring.

**OUTPUT**: `04-niche-scan.md` — per-option saturation, platform risk, pain validation, hype phase. Eliminations with rationale.

### Phase 5: Two-Axis Scoring

Score the surviving options on two independent axes. Do not multiply or average them — present them separately so the user can weigh them by hand.

**WORK**:

- **Brand fit (1–5)** — narrative coherence with prior work, compounding effect on existing audience, audience match, signaling value (does this make the user look like the X person they want to be).
- **Product fit (1–5)** — real use case strength (would real users actually adopt), retention potential (used once vs used weekly), viral hook (is the screenshot self-explanatory or does it need 3 paragraphs of setup), build effort feasibility within the locked constraints.
- **Optional 3rd axis — cross-product synergy bonus** — does this strengthen prior products' positioning or create cross-sell pathways. Use only if the user has 2+ shipped products.

For each option produce a short justification per axis. Do not collapse to a single number.

**REVIEW GATE**: User reviews scoring. They can re-weight axes ("brand matters 2x more than product right now"), override individual scores with reasoning, or push back on the rubric. After dialog, agree on the top 2–3 candidates.

**OUTPUT**: `05-scoring.md` — table with brand fit, product fit, synergy bonus per option; ranked top 2–3 candidates.

### Phase 6: Naming & Positioning (parallel)

Naming is its own phase, not an afterthought. Names get taken, names collide with malware campaigns, names cause negative-SEO. Do this work before commit, not after.

**WORK** — for each finalist (1–3 options from Phase 5), in parallel:

- Generate 3–5 candidate names per finalist.
- Invoke **OP-NAME** with all candidates. The operation runs 5 sub-axes in parallel: npm registry check, github org/user check, domain availability, social handle availability, negative-SEO scan (malware, scams, conflicting brands).
- Invoke **OP-VALIDATE** — search GitHub issues, forums, Reddit for explicit feature requests matching the option, to validate demand strength.

Each finalist therefore spawns roughly 6 parallel subagents (5 OP-NAME sub-axes + 1 OP-VALIDATE).

**REVIEW GATE**: User picks a name per finalist (or rejects all candidates and asks for more).

**OUTPUT**: `06-naming.md` — recommended name + positioning per finalist; rejected names with rationale.

### Phase 7: Reality Check & Commit

The final gate. Three litmus tests; all three must pass. Fail any one and the option goes back to Phase 3 (rebrainstorm) or Phase 5 (rescore from a different angle).

**WORK** — walk the user through each test:

1. **Personal use test** — would the user genuinely use this tool 5+ times in the next 6 months? Without dogfooding, there is no feedback loop, no authentic launch story, no organic posts. If the answer is "probably not", the option fails.

2. **Demo feasibility test** — can a public demo be produced on the user's own data without compliance violations (especially client confidentiality if the user is a consultant)? If the demo would require client data, the launch is hobbled before it begins.

3. **30-second pitch test** — can the user explain the tool in 30 seconds without "well, you see..." backstory? Have them try it out loud or in writing. If the pitch needs setup, the launch hook is too weak.

**Commit deliverables** — once all three pass:

- **Minimum viable spec** — what is in v0.1, what is explicitly cut. The cut list matters as much as the included list.
- **Kill criteria** — what would make the user abandon. Examples: "no momentum after 2 weeks of launch posts", "platform ships native equivalent before v0.1", "build estimate exceeded 2x".

**REVIEW GATE**: Approve and ship the spec, or reject and route back to Phase 3 / Phase 5.

**OUTPUT**: `07-spec.md` — committed spec using `assets/templates/product-spec.md`.

## Anti-patterns this workflow prevents

These are the actual failure modes that motivated each phase. Reference them when explaining the workflow to a user who wants to skip steps.

1. **Idea generation before problem definition.** Phase 1 is a hard gate for this reason. Without locked constraints and success criteria, scoring later is meaningless.

2. **Skipping competitive research.** Phase 4 is mandatory and runs in parallel. The cost of running it is small; the cost of launching into a saturated niche or a soon-to-be-native feature is large.

3. **Copying past success structure without checking conditions.** Phase 2's OP-CONDITIONS exists because the conditions that made a prior product win (timing, ecosystem gap, hype wave) often do not still hold. Validate before extending.

4. **Platform shipping a native equivalent right after launch.** OP-PLATFORM in Phase 4 systematically scans the upstream platform's changelog, release notes, and open feature requests. This catches "the platform announced this last week" before the user invests build time.

5. **Endless idea generation with no convergence.** The 7-phase structure with explicit review gates produces convergence pressure. After Phase 5, the option count drops to 2–3.

6. **Brand metrics and product metrics smushed together.** Phase 5's two-axis scoring keeps them separate. Single-score rubrics destroy the signal.

7. **Constraints surfaced late.** Phase 1 locks constraints. They are NOT revisited in Phase 5 — if the constraint is wrong, that is a Phase 1 problem, not a scoring problem.

8. **"Sounds great" mistaken for "would actually use".** Phase 7's personal use test catches this. So does the 30-second pitch test.

9. **Naming as afterthought.** Phase 6 is dedicated and runs before commit. Names that turn out to be malware-adjacent or already taken are caught here, not after launch.

10. **Sequential operations that could parallelize.** Phase 4 (5+ subagents in parallel) and Phase 6 (~6 subagents in parallel per finalist) are explicitly parallelized. Single tool turn, multiple subagent calls.

## Subagent strategy

The right parallelization changes the time cost from hours to minutes.

| Phase | Subagent count | Why |
|-------|----------------|-----|
| 1, 3, 5, 7 | 0 (solo) | Deliberation, not research |
| 2 | 1 (OP-CONDITIONS) | Single deep scan |
| **4** | **N + 3 parallel** (OP-NICHE × N + OP-PLATFORM + OP-PAIN + OP-HYPE) | Massive parallel; this is where time is saved |
| **6** | **6 parallel per finalist** (OP-NAME × 5 sub-axes + OP-VALIDATE) | Independent searches, fully parallelizable |

5 options × 4 operations in Phase 4 = 9+ subagents in parallel. Sequential takes an hour+; parallel takes 5–10 minutes.

## Output files

The workflow produces seven markdown files, one per phase, in the working directory. Use exactly these filenames:

- `01-why-constraints.md`
- `02-asset-inventory.md`
- `03-options.md`
- `04-niche-scan.md`
- `05-scoring.md`
- `06-naming.md`
- `07-spec.md`

Each file is the durable output of its phase; the user may reference earlier files when revisiting decisions.

## Handoff after Phase 7

Once `07-spec.md` is committed, the selection workflow is done. Natural handoffs:

- **Build phase** — coding skills, repo scaffolding.
- **Launch tactics** — distribution, content strategy, opening posts. Not in scope here.
- **Re-entry** — if the user kills the product per kill criteria, they re-enter at Phase 3 with the same locked Phase 1 constraints (no need to redo Phase 1 unless brand goals shifted).

## Working notes

- Always work in a dedicated directory (e.g., `oss-selection-<date>/`). The seven phase files are durable artifacts the user will reference later.
- The workflow assumes the user is a partner in the loop, not a passive recipient. Treat each REVIEW GATE as a real gate; do not advance without explicit approval.
- Adapt operation prompts to the specific user. The templates in `references/operations.md` are starting points, not rigid contracts. A user building Claude Code tooling needs different OP-PLATFORM scans than one building Cursor extensions.
- If the user pushes back on a phase or wants to revisit an earlier decision, route back cleanly: rebrainstorm → Phase 3, rescore → Phase 5, rename → Phase 6. Do not let the workflow dissolve into free-form discussion.

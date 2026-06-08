# OSS Product Selection

**A Claude Code skill that decides which open-source product to ship next — when the goal is your brand, not revenue.**

Most "what should I build next?" advice optimizes for monetization or product-market fit. For brand-led OSS that advice is *wrong*: the success function is stars, downloads, narrative coherence with your prior work, audience fit, and signaling value. This skill bakes those criteria in and protects against the specific mistakes that derail brand-driven product selection.

---

## Who this is for

You have 1–3 products already shipped and you're deciding what to ship next, with **brand-building (not revenue) as the dominant goal**. Common framings:

> "What should I open-source next?"
> "I have these three ideas — which one?"
> "Help me figure out my next side project for brand."
> "Is `<idea>` a good thing to OSS?"

It triggers even when you never say "OSS" — any time you're weighing multiple build ideas for brand, audience, or career reasons.

**Not for:** building an already-chosen product (use coding skills), choosing a revenue-bearing startup (different success function — use product-management or consulting frameworks), or pure idea generation with no intent to ship (this skill front-loads constraints because shipping is the assumed outcome).

---

## The 7-phase flow

Each phase has the same rhythm: **you provide input → the skill does the work → an explicit review gate → a markdown artifact**. Nothing advances without your "yes".

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 1. Why &     │─▶│ 2. Asset     │─▶│ 3. Diverge   │─▶│ 4. Niche &   │
│  Constraints │  │  Inventory   │  │  (10+ ideas) │  │  Platform    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────┬───────┘
   lock the          conditions         broad, MECE,      HEAVY parallel
 success function    then-vs-now        no filtering      scans (5–14 agents)
                                                                │
            ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐
            │ 7. Reality   │◀─│ 6. Naming &  │◀─│ 5. Two-Axis  │
            │  Check &     │  │  Positioning │  │  Scoring     │
            │  Commit      │  │  (parallel)  │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘
              3 litmus tests    npm/gh/domain/    brand fit vs
              → committed spec   social/neg-SEO    product fit, separate
```

| Phase | What it does | Output |
|:------|:-------------|:-------|
| **1. Why & Constraints** | Lock the brand goal, hard constraints, and measurable success criteria *before* any ideation. Hard gate. | `01-why-constraints.md` |
| **2. Asset Inventory** | Audit shipped products and check whether the conditions that made past wins work still hold today. | `02-asset-inventory.md` |
| **3. Diverge** | Generate 10+ options across four MECE categories (Extension / Adjacent / Universal / New domain). Breadth only — no ranking yet. | `03-options.md` |
| **4. Niche & Platform Scan** | The heavy phase, fully parallel: map saturation, validate audience pain, scan the upstream platform for native equivalents about to ship, map the hype phase. | `04-niche-scan.md` |
| **5. Two-Axis Scoring** | Score survivors on **brand fit** and **product fit** as *independent* axes — never collapsed into one number. | `05-scoring.md` |
| **6. Naming & Positioning** | Per finalist, run npm / GitHub / domain / social-handle / negative-SEO checks in parallel before you fall in love with a name. | `06-naming.md` |
| **7. Reality Check & Commit** | Three litmus tests (would you use it 5+ times, can it be demoed without compliance issues, does the 30-second pitch hold) gate a committed spec with kill criteria. | `07-spec.md` |

---

## Core principles

1. **Brand fit and product fit are independent.** Collapsing them into one score destroys signal. Score them on separate axes; you weigh them.
2. **Past conditions might not transfer.** A prior win worked because of specific timing, ecosystem gap, and audience receptivity. Check whether those still hold before recommending a sequel.
3. **Competitive and platform scans are not optional.** Phase 4 is mandatory and runs in parallel — sequential would take hours.
4. **Hard gates beat soft checkpoints.** Every phase ends with explicit approval. This is what makes selection rigorous instead of a free-form brainstorm.
5. **Reality check before commit.** The output is a committed spec, not a wishlist. Fail any one litmus test and the option doesn't ship.

---

## What it protects you from

The phases exist to kill specific, recurring failure modes:

- **Ideating before the success function is locked** → Phase 1 is a hard gate.
- **Skipping competitive research** and launching into a saturated niche → Phase 4 is mandatory.
- **Copying a past win's structure** without checking if its conditions still hold → Phase 2's condition check.
- **The platform shipping a native equivalent right after launch** → Phase 4 scans the upstream changelog and open feature requests.
- **Brand metrics and product metrics smushed together** → Phase 5's two-axis scoring keeps them separate.
- **"Sounds great" mistaken for "would actually use"** → Phase 7's personal-use and 30-second-pitch tests.
- **Naming as an afterthought** (taken names, malware-adjacent collisions, negative-SEO) → Phase 6 runs before commit.

---

## Installation

### Via skills.sh

```bash
npx skills add sfrangulov/skills --skill oss-product-selection
```

### Manual

```bash
git clone https://github.com/sfrangulov/skills.git
cp -r skills/oss-product-selection ~/.claude/skills/
```

---

## Usage

Trigger it naturally in Claude Code:

> "I've shipped three Claude Code skills — what should I open-source next to keep building my brand?"

> "Help me decide between these tool ideas for my portfolio."

Or invoke it directly:

> `/oss-product-selection`

The skill walks you through each phase, asks one question at a time, and writes a markdown artifact per phase into your working directory — ending with a committed product spec and kill criteria.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI, desktop app, or IDE extension
- A Claude model with tool use (Opus, Sonnet, or Haiku) — Phases 4 and 6 fan out parallel subagents

---

## License

MIT — see [LICENSE](../LICENSE).

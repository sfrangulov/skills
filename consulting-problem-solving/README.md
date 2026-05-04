# Consulting Problem Solving

**A Claude Code skill that turns Claude into your consulting associate.**

Give it a messy business problem. Get back structured analysis, evidence-based recommendations, and presentation-ready deliverables — built through the same methodology used by top-tier strategy firms.

---

## How It Works

You play the **consulting partner** — the decision-maker with domain expertise.
Claude plays the **consulting associate** — bringing analytical frameworks, structured thinking, and execution.

Every step follows the same rhythm: you provide direction, Claude builds, you review and approve before moving forward. Nothing advances without your explicit sign-off.

### The 8-Step Process

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  1. Define   │─▶│ 2. Structure │─▶│ 3. Prioritize│─▶│ 4. Work Plan │
│    Problem   │  │    (MECE)    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────┬───────┘
       FRAME ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─
                                                             │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐
│8. Communicate│◀─│ 7. Recommend │◀─│ 6. Synthesize│◀─│  5. Analyze  │
│              │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
     DELIVER              ◀─  ─  ─  ANALYZE  ─  ─  ─  ─  ─  ─  ─  ─
```

You can run the full process end-to-end, or invoke any single step on its own.

---

### Step 1: Define the Problem

> *Deliverable: Problem statement (`.md`)*

Problem framing is half the solution. Claude asks you to describe the situation, what success looks like, what's in and out of scope, key constraints, and any initial hypotheses you already have. From your answers, Claude extracts a **precise key question** — a single sentence that the entire engagement will answer — and structures a problem definition document covering context, scope boundaries, success criteria, stakeholders, and constraints.

This is the most important step. A well-framed question prevents weeks of analysis pointed at the wrong target.

**You provide:** The situation in your own words, what "solved" looks like, boundaries, hunches.
**Claude produces:** A structured problem statement anchored to one key question. You review and approve before anything else begins.

---

### Step 2: Structure the Problem

> *Deliverable: Issue tree (`.md` + optional `.svg`)*

Claude decomposes the key question into an **issue tree** — a hierarchical breakdown where every level is MECE (Mutually Exclusive, Collectively Exhaustive). No overlaps, no gaps.

You choose the decomposition framework, or Claude suggests one based on the problem type:

| Framework | Best For |
|:----------|:---------|
| **Profitability** (Revenue vs. Cost) | Margin compression, P&L diagnosis |
| **Market Entry** (Attractiveness vs. Capability vs. Economics) | New market or segment evaluation |
| **Operational Improvement** (Quick wins vs. Medium-term vs. Structural) | Efficiency and process problems |
| **Customer/Growth** (Existing vs. New customers vs. New products) | Growth strategy, retention |
| **Custom** | Anything that doesn't fit a standard frame |

Each major branch gets a **testable hypothesis** — a specific, falsifiable claim that analysis will confirm or disprove. The tree typically goes 2-3 levels deep with explicit MECE validation at every level.

---

### Step 3: Prioritize

> *Deliverable: Priority matrix (`.md`)*

Not every branch of the issue tree deserves equal attention. Claude helps you assess each branch on two dimensions:

- **Impact**: How much would solving this branch move the needle on the key question?
- **Feasibility**: Can we actually investigate this with available data, time, and resources?

Branches are ranked into priority tiers:

| Tier | Criteria | Action |
|:-----|:---------|:-------|
| **P1** | High impact + high/medium feasibility | Investigate fully |
| **P2** | High impact + low feasibility, or medium impact + high feasibility | Find proxies or defer |
| **P3+** | Lower combinations | Park with rationale |

The output is typically 2-4 P1 focus areas. If you have more than that, you haven't prioritized enough. Nothing gets parked without your explicit agreement, and parked items include the rationale so they can be revisited.

---

### Step 4: Build the Work Plan

> *Deliverable: Work plan (`.xlsx`)*

Claude translates priority branches into a concrete analysis plan — a spreadsheet with three tabs:

**Summary tab** — Project name, key question, workstream overview.

**Detailed Analysis Plan** — Each row is one analysis:

| Column | Purpose |
|:-------|:--------|
| Workstream | Which P1 branch this serves |
| Analysis Name | Descriptive label |
| Question Answered | The specific question this analysis resolves |
| Approach | Quantitative (trends, segmentation, benchmarking, financial modeling) or qualitative (best practice, process mapping, risk assessment) |
| Data Needed | What inputs are required |
| Source | Where the data comes from |
| Dependencies | Which other analyses must complete first |
| Hypothesis | What we expect to find |

**Data Inventory tab** — Surfaces data gaps and workarounds upfront so you aren't surprised mid-analysis.

A typical engagement has 15-25 analyses. More than 30 suggests insufficient prioritization. Dependencies are mapped so independent analyses can run in parallel while gating analyses happen first.

---

### Step 5: Conduct Analyses

> *Deliverables: Analysis workbook (`.xlsx`) + Findings document (`.md`)*

This is where the analytical work happens. For each analysis in the work plan, Claude:

1. States the question being answered
2. Executes the analysis (with your data, or with clearly flagged assumptions if data isn't available)
3. Applies the **"so what?" test** — what does this finding mean for the key question?
4. Assesses the hypothesis — **Confirmed**, **Partially confirmed**, or **Disproven**
5. Identifies follow-up questions

**Data quality is ruthlessly enforced:**

- Every data point gets a source citation (e.g., "Company 10-K FY2024", "Bureau of Labor Statistics")
- Data older than 18 months in fast-moving domains gets flagged
- Numbers are cross-checked for internal consistency
- When data isn't available, Claude never silently estimates — it presents suggested values with reasoning and sensitivity ranges (low / base / high)
- Two solid, cross-validated data points beat ten loosely sourced ones

The **analysis workbook** has a summary tab (one row per analysis with finding and confidence level), detailed tabs per analysis, and an assumptions tab. The **findings document** is a narrative that connects findings to the key question, identifies emerging themes, and surfaces open questions.

---

### Step 6: Synthesize Findings

> *Deliverable: Synthesis document (`.md`)*

Synthesis is not summary. Summary says "here's what we found." Synthesis says "here's what it all **means together**."

Claude lays out all findings and looks for patterns:

| Pattern | What It Means |
|:--------|:-------------|
| **Convergent** | Multiple independent findings point the same direction — strongest basis for action |
| **Tension** | Findings point different directions — synthesis resolves the contradiction |
| **Sequencing** | Findings suggest a time-ordered path — do A before B |
| **Conditional** | The answer depends on an unresolved variable — recommendations must account for both scenarios |

The output follows a clear structure:

- **The Answer** — 1-2 sentences, decision-oriented, directly addressing the key question
- **Supporting Logic** — 3-5 insights, each backed by specific evidence from Step 5
- **How the Pieces Fit Together** — the narrative thread connecting insights into a coherent argument
- **What Could Make Us Wrong** — a risk table with likelihood, impact, and mitigation for each
- **Confidence Assessment** — overall confidence, strongest and weakest parts of the argument

Claude asks for your interpretive lens: what jumps out to you, what surprises you, how stakeholders might react, and whether there are framing sensitivities that matter.

---

### Step 7: Develop Recommendations

> *Deliverable: Recommendation brief (`.md`)*

Every recommendation must pass the **SMART+E test**: Specific, Measurable, Actionable, Relevant, Time-bound, and Evidence-backed.

Claude presents **2-3 options** before finalizing — each with pros, cons, and expected impact — and leans toward one with a rationale, but you make the call.

The approved recommendation is structured as:

- **Core Recommendation** — the headline action with rationale, impact estimate, and confidence level
- **Supporting Recommendations** (1-3) — each with What / Why / Expected Impact / Timeline / Owner
- **Implementation Roadmap** — phased so each stage delivers independent value:

| Phase | Timeline | Focus |
|:------|:---------|:------|
| **Immediate** | 0-3 months | Quick wins that build momentum and credibility |
| **Near-term** | 3-12 months | Structural changes with measurable impact |
| **Medium-term** | 1-3 years | Transformational moves that compound earlier gains |

- **Impact Summary** — investment required, annual impact, payback period, and confidence per recommendation
- **Risks and Mitigations** — anticipated objections ("tried before", "too risky", "too expensive", "politically difficult") with pre-built responses
- **Next Steps** — 3-5 concrete actions with owners

The brief also includes a **slide-ready summary** appendix — imperative statements, one-line impacts, and phase-by-phase actions — ready for Step 8.

---

### Step 8: Communicate

> *Deliverable: Slide content (`.md`) or vertical document content (`.md`)*

The final step turns analysis into a compelling narrative. You choose the output format:

**Slides track** — Distilled, scannable, one message per slide. Action titles (complete sentences stating the insight, not topic labels like "Market Analysis"). Bullets capped at 12 words. Tables and structured elements instead of walls of text. Every slide with numbers includes a source footer.

**Vertical document track** — Narrative prose with full argument depth. Section headings that advance the argument. Paragraphs that follow a contract: topic sentence, evidence (2-3 sentences), implication. Active voice, short sentences for key claims, specific language throughout.

Both tracks go through a **mandatory gate structure**:

**Gate 1 — Storyline.** Claude presents the headline sequence and narrative structure. You choose from six playbooks:

| Playbook | Structure | Best For |
|:---------|:----------|:---------|
| **Answer-First** (Pyramid) | Conclusion &rarr; Arguments &rarr; Evidence | Aligned audiences, senior leaders, time-constrained |
| **Evidence-First** (Build) | Observations &rarr; Pattern &rarr; Conclusion | Skeptical audiences who need to see the proof |
| **Narrative Arc** (SCR) | Situation &rarr; Complication &rarr; Resolution | Persuasion and buy-in |
| **Transformation** | Current State &rarr; Future State &rarr; Path | Change management |
| **Comparative Evaluation** | Options &rarr; Criteria &rarr; Winner | Board decisions between alternatives |
| **Sequential/Process** | Phase 1 &rarr; Phase 2 &rarr; ... &rarr; Phase N | Implementation plans |

You approve the storyline before anything is written.

**Gate 2 — Sceptical Review.** A separate review agent stress-tests the approved storyline against the synthesis and recommendations. It checks for common-sense failures, "so what?" gaps, number sanity, logical coherence, data-dump tendencies, and vague recommendations. Results come back as a numbered list of proposed changes with severity ratings (MUST FIX / SHOULD FIX / CONSIDER). You accept or reject each item — nothing is changed without your approval.

**Gate 2b — Content** (slides track only). Claude distills all content per the slide content rules and saves it to the engagement folder. You review and revise until approved.

After all gates pass, the approved content is handed off to a downstream builder skill for visual rendering and styling.

---

## What Makes This Different

**You stay in control.** Claude doesn't disappear into a black box and return a 40-page deck. At every step, you provide input, review the output, and approve before anything moves forward. Your domain knowledge shapes every deliverable.

**Synthesis, not summary.** Step 6 doesn't just list findings — it weaves them into a coherent argument. "Here's what it all *means together*" is fundamentally different from "here's what we found."

**Narrative-first, not data-first.** Arguments are built on insight and logic. Numbers emphasize points — they never construct them. Every slide must make sense with the numbers removed.

**Built-in skepticism.** Before any final deliverable is built, a sceptical review agent stress-tests your storyline for logical gaps, unsupported claims, data-dump tendencies, and vague recommendations. You accept or reject each proposed change.

**Full traceability.** YAML frontmatter links every recommendation back through insights, findings, analyses, branches, and the original key question. You can trace any conclusion to its evidence.

**Two output tracks.** Choose between a **slides track** (distilled, one-message-per-slide, scannable) or a **vertical document track** (narrative prose with full argument depth) — each with purpose-built content rules.

---

## Installation

### As a Claude Code Skill

```bash
# From your project directory
claude install-skill https://github.com/wudpeker/consulting-problem-solving
```

### Manual Installation

Clone into your Claude Code skills directory:

```bash
git clone https://github.com/wudpeker/consulting-problem-solving.git \
  ~/.claude/skills/consulting-problem-solving
```

---

## Usage

Start a conversation with Claude Code and trigger the skill naturally:

> "Help me think through our market entry strategy for Southeast Asia"

> "I need a structured approach to figure out why customer retention is dropping"

> "Build me a recommendation deck for the board on whether we should acquire TargetCo"

Or invoke it directly:

> `/consulting-problem-solving`

Claude will set up an engagement folder, walk you through each step, and produce deliverables along the way.

### Trigger Phrases

The skill activates when you mention: *strategy consulting, problem solving framework, issue tree, MECE, hypothesis-driven, pyramid principle, 80/20 analysis, root cause analysis, business case analysis, strategic recommendation, structured thinking* — or simply ask for help systematically breaking down a complex problem.

---

## Example Workflow

**You:** "We're losing enterprise customers to a competitor that launched 6 months ago. Help me figure out what's going on and what to do about it."

**Step 1** — Claude asks about context, scope, and what success looks like. Produces a problem definition anchored to a precise key question.

**Step 2** — You choose a decomposition framework (or Claude suggests one). The problem splits into a MECE issue tree — e.g., *Product gaps vs. Pricing vs. Sales execution vs. Competitor strengths*.

**Step 3** — Together you assess which branches have the highest impact and are most feasible to investigate. Two or three become P1 focus areas.

**Step 4** — Claude builds a work plan: 15-20 specific analyses, each tied to a question, an approach, and a data source.

**Step 5** — Analyses run. Each finding gets a "so what?" test and a confidence level. Hypotheses are confirmed, partially confirmed, or disproven.

**Step 6** — Findings are synthesized into a coherent narrative — not a list, but an argument.

**Step 7** — Phased recommendations with impact sizing, implementation roadmaps, and risk mitigations.

**Step 8** — You choose slides or a document. Claude builds a storyline, runs the sceptical review, and produces presentation-ready content that a downstream builder skill (like `pptx` or `docx`) can render into a polished deliverable.

---

## Principles

| Principle | What It Means |
|:----------|:-------------|
| **User leads, Claude executes** | You have the domain knowledge and accountability. Claude has the frameworks and analytical rigor. |
| **MECE at every level** | Mutually Exclusive, Collectively Exhaustive. No overlaps, no gaps. Validated explicitly. |
| **Hypothesis-driven** | Form hypotheses early, test them in analysis, pivot when evidence says so. |
| **"So what?" relentlessly** | Every finding, every slide, every paragraph must answer: what does this mean for the decision? |
| **80/20 ruthlessly** | Focus on the 20% of issues driving 80% of impact. If you have more than 3-4 P1 items, you haven't prioritized. |
| **Data integrity** | Fewer high-confidence figures beat many loosely sourced ones. Every number gets a source. |
| **Consulting-grade prose** | Strunk & White integrated at every step. Active voice, definite language, omit needless words. |

---

## Repository Structure

```
consulting-problem-solving/
├── SKILL.md                              # Main skill definition and orchestration
└── references/
    ├── 01-define-problem.md              # Step 1: Problem definition guide
    ├── 02-structure-problem.md           # Step 2: MECE decomposition guide
    ├── 03-prioritize.md                  # Step 3: Impact/feasibility prioritization
    ├── 04-work-plan.md                   # Step 4: Analysis work plan structure
    ├── 05-analyze.md                     # Step 5: Analysis execution and data quality
    ├── 06-synthesize.md                  # Step 6: Synthesis methodology
    ├── 07-recommend.md                   # Step 7: Recommendation development
    ├── 08-communicate.md                 # Step 8: Communication orchestrator
    ├── 08-slides-content.md              # Step 8: Slides track content rules
    ├── 08-slide-content-format.md        # Step 8: Slide content spec format
    ├── 08-vertical-content.md            # Step 8: Vertical document content rules
    └── writing-style.md                  # Strunk & White consulting prose standards
```

---

## Integration with Other Skills

This skill owns **content and structure**. It does not produce visual output. After Step 8, hand the approved content to a builder skill for rendering:

- **Slides** &rarr; `pptx`, `html-landing-page`, or similar deck builder
- **Documents** &rarr; `docx`, `pdf`, or similar document builder
- **Styling** &rarr; `theme-factory` or `brand-guidelines` for visual identity

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI, desktop app, or IDE extension
- Claude model with tool use capability (Opus, Sonnet, or Haiku)

---

## License

MIT

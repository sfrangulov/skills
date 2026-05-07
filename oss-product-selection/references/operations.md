# Research Operations

This file specifies all 7 research operations referenced from `SKILL.md`. Each operation has a contract: trigger phase, parallelization profile, inputs, an adaptable subagent prompt template, and a strict output schema.

The prompt templates are starting points, not rigid contracts. Adapt them to the specific user and ecosystem. The output schemas, in contrast, ARE rigid — downstream synthesis depends on consistent shape across subagent results.

## Table of contents

- [OP-NICHE — competitive landscape per option](#op-niche)
- [OP-PLATFORM — upstream feature roadmap](#op-platform)
- [OP-PAIN — audience pain validation](#op-pain)
- [OP-HYPE — viral / saturation context](#op-hype)
- [OP-CONDITIONS — then-vs-now ecosystem comparison](#op-conditions)
- [OP-NAME — multi-axis naming availability](#op-name)
- [OP-VALIDATE — feature request / issue tracker validation](#op-validate)
- [Parallelization patterns](#parallelization-patterns)
- [Adapting the templates](#adapting-the-templates)

---

## OP-NICHE
**Competitive landscape per option.**

- **Trigger phase**: 4
- **Parallelization**: 1 subagent per option, fully parallel (send all in one tool turn)
- **Inputs**: option name, category, hypothesized value proposition, target ecosystem

**Subagent prompt template** (adapt to the specific option):

> You are researching competitive landscape for a candidate OSS product. Search npm, GitHub, awesome-* lists, recent dev posts (Reddit, Hacker News, dev.to, Twitter/X) for tools that already do — or partially do — what this product would do.
>
> Product idea: `<option-name>` — `<one-line value prop>`
> Category: `<category>`
> Target ecosystem: `<ecosystem>`
>
> For each existing tool you find: name, repo URL, star count, last release date, and what coverage gap (if any) it leaves open. Also identify what features none of the existing tools cover — these are the opening for our candidate.
>
> Return a saturation score (1–5: 1 = wide-open, 5 = totally saturated) and a one-line verdict: clear / crowded / saturated.

**Output schema** (strict):

```yaml
existing_tools:
  - name: string
    repo_url: string
    stars: number
    last_release: ISO-date
    coverage_gap: string  # what this tool fails to cover
saturation_score: 1-5
coverage_gaps: [string]   # features no existing tool covers
verdict: clear | crowded | saturated
top_competitor: string    # repo_url of the closest match
```

---

## OP-PLATFORM
**Upstream feature roadmap — does the platform plan to ship this natively?**

- **Trigger phase**: 4
- **Parallelization**: 1 subagent per *category* (not per option)
- **Inputs**: ecosystem (e.g., Claude Code, Cursor, Cline, VSCode), idea categories under that ecosystem, recent timeframe (default 6 months back, scan 6 months forward)

**Subagent prompt template**:

> You are scanning whether the upstream platform is about to ship a feature that would obsolete a candidate OSS product. Read recent changelogs, release notes, blog posts, and open feature requests / RFCs.
>
> Platform: `<ecosystem>`
> Categories of interest: `<list>`
>
> For each category, look for:
> - Features the platform shipped in the last 6 months that overlap (history of moving in this direction).
> - Open feature requests with high engagement that match the category.
> - Public roadmap items, RFCs, or beta announcements signaling the feature is coming in the next 6 months.
>
> Return a per-category platform risk verdict: low (no signal), medium (some signal but not imminent), high (likely to ship within 6 months — high obsolescence risk).

**Output schema** (strict):

```yaml
platform: string
recent_native_features:
  - feature: string
    date: ISO-date
    overlap_categories: [string]
adjacent_open_feature_requests:
  - title: string
    url: string
    engagement: number  # upvotes / reactions / comments
    overlap_categories: [string]
platform_risk_per_category:
  <category-name>: low | medium | high
notes: string  # freeform observations
```

---

## OP-PAIN
**Audience pain validation — is the problem real?**

- **Trigger phase**: 4
- **Parallelization**: 1 subagent per channel (Reddit / HN / Twitter or X / Discord servers / dev.to). Run all channels in parallel for a single option, or split per option × channel.
- **Inputs**: option name, hypothesized pain, target audience, channels to search

**Subagent prompt template**:

> You are validating whether the target audience genuinely complains about the problem this OSS product would solve. Search the specified channels for posts where users express the exact pain.
>
> Product idea: `<option-name>` — `<value prop>`
> Hypothesized pain: `<pain statement>`
> Target audience: `<audience>`
> Channels to search: `<list>`
>
> For each channel, find concrete posts (not synthesized — actual URLs, dates, complaint text). Note the engagement (comments, upvotes). If you cannot find evidence after a thorough search, say so explicitly — do not invent or generalize.
>
> Return a pain intensity score (1–5: 1 = no evidence, 5 = strong recurring complaints) and a verdict: validated / weak / unvalidated.

**Output schema** (strict):

```yaml
option: string
pain_evidence:
  - channel: string
    url: string
    date: ISO-date
    op_complaint: string  # original poster's complaint, paraphrased briefly
    engagement: number    # upvotes / comments
pain_intensity: 1-5
verdict: validated | weak | unvalidated
unsearched_channels: [string]  # if any couldn't be searched, list here
```

---

## OP-HYPE
**Viral / saturation context — what's already milked, what's still open?**

- **Trigger phase**: 4
- **Parallelization**: 1 subagent per category
- **Inputs**: category, recent timeframe (typically last 3–6 months)

**Subagent prompt template**:

> You are mapping the hype landscape for a category to identify what angles are already taken (saturated) and what angles are still open. Look at viral content (high-engagement posts, repos with sudden star spikes, popular threads) in the last 3–6 months.
>
> Category: `<category>`
> Timeframe: `<window>`
>
> For each viral item: name, peak date, channel where it went viral, what angle it took. Then categorize the overall hype phase: pre-wave (early signals, room to lead), peak (already saturated, hard to enter), post-wave (audience moved on).
>
> Identify "crowded angles" (variations of the same idea that have already hit the audience) and "open angles" (adjacent angles in the same category that nobody has taken).

**Output schema** (strict):

```yaml
category: string
timeframe: string
recent_viral_items:
  - name: string
    peak_date: ISO-date
    channel: string
    angle: string
hype_phase: pre-wave | peak | post-wave
crowded_angles: [string]
open_angles: [string]
notes: string
```

---

## OP-CONDITIONS
**Then-vs-now ecosystem comparison — do conditions that produced past wins still hold?**

- **Trigger phase**: 2
- **Parallelization**: 1 subagent
- **Inputs**: previous successful product (name, launch date), conditions the user believes made it work

**Subagent prompt template**:

> You are comparing the ecosystem conditions that produced a past OSS win against today's conditions. The goal is to flag any condition that has changed in a way that would weaken a sequel or extension.
>
> Past product: `<name>`, launched `<date>`
> Hypothesized conditions for that win: `<list>`
>
> For each condition:
> - State what was true at launch.
> - State what's true today.
> - Note the delta and its likely impact on a successor product.
>
> Then return an overall transferability verdict: high (conditions largely intact), medium (some erosion, sequel still viable in modified form), low (key conditions gone — extension is likely to flop).

**Output schema** (strict):

```yaml
past_product: string
launch_date: ISO-date
conditions_then: [string]
conditions_now: [string]
delta:
  - condition: string
    then: string
    now: string
    impact: string  # likely effect on a successor
transferability: high | medium | low
notes: string
```

---

## OP-NAME
**Multi-axis naming availability scan.**

- **Trigger phase**: 6
- **Parallelization**: 5 sub-axes parallel per name set (npm, github, domain, social, negative-SEO)
- **Inputs**: 3–5 candidate names

This operation is unusual — it spawns 5 parallel sub-subagents, one per axis. Use a single coordinating subagent that fans out, OR (preferred in practice) spawn the 5 sub-subagents directly from the main loop.

### Sub-axis: npm
> Check npm registry for each candidate name. Report: is the package name available, is it taken (and if so, by what — active package, abandoned, name squat). Also check neighbor names (the name with common suffixes/prefixes like `-cli`, `@user/name`, `npx-name`).

### Sub-axis: github
> Check GitHub for each candidate name as a repo name (org/user/repo combinations) and as an org/user handle. Report any conflicts and any high-star repos that share the name even partially.

### Sub-axis: domain
> Check domain availability for each candidate: `.com`, `.io`, `.dev`, `.sh`, `.app`. Note registered status, current use (parked / live site / for sale).

### Sub-axis: social
> Check handle availability on Twitter/X, Mastodon, Bluesky, and the platform's relevant community channel (Discord, Reddit). Note conflicts with people or brands using the same handle.

### Sub-axis: negative-SEO
> Search Google and Bing for each candidate name plus modifiers like "malware", "scam", "vulnerability", "trademark", "lawsuit", "cult", "controversy". Flag anything that would hurt the brand or get the project mistakenly associated with bad actors.

**Output schema** (strict — synthesized after all 5 sub-axes complete):

```yaml
candidates:
  - name: string
    npm: green | yellow | red
    github: green | yellow | red
    domain: green | yellow | red
    social: green | yellow | red
    negative_seo: green | yellow | red
    notes: string
recommended: string         # name with full rationale
discarded:
  - name: string
    reason: string
```

Color semantics: green = clean, yellow = workable but noted concern, red = blocker.

---

## OP-VALIDATE
**Feature request / issue tracker validation — does latent demand exist?**

- **Trigger phase**: 6
- **Parallelization**: 1 subagent per finalist
- **Inputs**: option name, value prop, related platforms / ecosystems

**Subagent prompt template**:

> You are checking whether the proposed OSS product corresponds to actual feature requests users have already made. Search GitHub issues, Stack Overflow, Discord forums, Reddit, dev.to for explicit requests matching the value prop.
>
> Option: `<name>` — `<value prop>`
> Related platforms: `<list>`
>
> For each request found: URL, date, engagement (upvotes / comments / reactions), and whether the match is exact, partial, or speculative. Bias toward direct quotes — if the user says "I wish there was a tool that did X", that's the strongest signal.
>
> Return a demand signal strength score (1–5) and a verdict: explicit_demand (recurring requests with high engagement), latent (occasional asks, low engagement), speculative (no clear evidence, only your inference).

**Output schema** (strict):

```yaml
option: string
explicit_requests:
  - url: string
    date: ISO-date
    engagement: number
    exact_match: yes | partial | no
    quote: string  # short verbatim, ideally the user's own words
demand_signal_strength: 1-5
verdict: explicit_demand | latent | speculative
notes: string
```

---

## Parallelization patterns

The whole point of these operations is that they parallelize. Here are the common shapes:

**Phase 4 — broad scan, 5 options across 2 categories**

Single tool turn, 14 subagents:
- 5 × OP-NICHE (one per option)
- 5 × OP-PAIN (one per option)
- 2 × OP-PLATFORM (one per category)
- 2 × OP-HYPE (one per category)

**Phase 6 — naming + validation, 2 finalists**

Single tool turn per finalist, 6 subagents per finalist:
- 5 × OP-NAME sub-axes (npm, github, domain, social, negative-SEO)
- 1 × OP-VALIDATE

For 2 finalists: 12 subagents total, can be done in one mega-turn or split per finalist.

When in doubt, batch larger. Subagent overhead per call is higher than the cost of running parallel.

---

## Adapting the templates

The templates assume generic OSS positioning. Adapt for these axes:

- **Ecosystem specificity** — Claude Code skills vs Cursor extensions vs VSCode plugins vs general npm CLIs all have different surfaces to scan. Replace generic "platform" references with the actual platform.
- **Audience specificity** — "developers" is too broad. If the user is targeting "consultants who code part-time", "AI engineers building agents", or "indie hackers in Spanish-speaking markets", surface that in the OP-PAIN channel selection and OP-HYPE searches.
- **Compliance constraints** — if the user has client-confidentiality limits, OP-PAIN and OP-VALIDATE can't search private channels. Note this explicitly in the prompt.
- **Time horizon** — a builder shipping in 4 weeks needs a tighter OP-PLATFORM scan window than one shipping in 6 months.

The output schemas, in contrast, are **not** for adapting. Keep them rigid so synthesis at the end of Phase 4 / Phase 6 doesn't have to reconcile shape mismatches across N subagent results.

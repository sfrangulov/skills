# Adversarial pass (Stage 6)

The last stage before canonization. A single synthesizer is biased toward
its own draft; it cannot be its own judge. This stage is **mandatory, not
conditional on "I didn't find counter-evidence"** — absence of a counter-
search is not absence of counter-evidence.

## Procedure

1. The synthesizer marks **load-bearing claims** — the ones downstream code
   or decisions will lean on. Non-load-bearing claims skip this stage.
2. A **separate sub-agent**, mandate = **refute** (red-team, not confirm).
   Per load-bearing claim:
   - **(a) Overreach check vs its own snapshot.** Does the source actually
     assert this, or did synthesis widen it? ("shows" where the source says
     "suggests"; a snippet-only claim that was never opened.)
   - **(b) One counter-search.** Is there an authoritative ¬claim?
3. Verdict per claim:
   - `survived` — holds against (a) and (b).
   - `weakened` — narrow scope / rephrase to what the snapshot supports
     (e.g. snippet-only → `weakened [unopened source]`).
   - `refuted` — drop, or invert; counter-evidence goes into the manifest.

## Canonization rule

Only `survived` / `weakened` enter the document. `refuted` → remove, **or**
reframe as an explicit open contradiction. An honest "there is no consensus
here" is a first-class output — never silently average disagreeing sources.

## Epistemic-status tag

Machine-readable artifact of this pass, on every load-bearing claim:

```
[primary|secondary|inferred, verified?, survived|weakened|refuted]
```

A downstream agent does **not** re-verify a `survived` claim (saves
re-running the funnel) and can see at a glance what is safe to build code on
versus what is a hypothesis. This cheaply kills single-synthesizer
confirmation bias.

## Mechanical backstop (v1.8)

The protocol above is prose; its canonization rule is enforced.
`check_research_snapshots.py` flags, as `COVERAGE`:

- a claim carrying a `refuted` epistemic-status tag still canonized as a
  normal claim (drop it or reframe as an explicit open contradiction);
- an epistemic-shaped tag `[class, verified?, verdict]` whose `verdict`
  is outside `{survived|weakened|refuted}` — a malformed/absent verdict
  means the adversarial pass silently did not conclude.

Inert when the doc uses no epistemic-status tag → FP≈0. Deciding *which*
claims are load-bearing is a research judgment and is deliberately **not**
gated (same honesty boundary as the different-URL depth limitation — see
SKILL.md "Known limitations"; faking that gate would repeat the v1.1/s-ag3
mistake).

## Re-synthesis: record the dispatched pass

When this pass is re-run over an existing cache (re-scope / translate) it
must be a *dispatched* sub-agent, never an inline self-check — an inline
re-attack silently coarsens load-bearing findings. Record it machine-readably
so the v1.5 gate sees it happened — one line in the doc:

```
adversary-dispatch: subagent=<id> report=<sha8> verdict=<survived|weakened|refuted>
```

This is the ref-side definition of the contract SKILL.md Stage 0 enforces (a
declared re-synthesis carrying no such line is the inline coarsening the gate
flags).

**Reusable step, not a separate skill.** This adversarial stage was a
candidate to spin out as its own skill. Decision: it stays a reusable
*step* of this pipeline. It is intrinsic to Stage 6 (it consumes the
funnel's flagged remainder and feeds canonization) and has no standalone
use outside a source-grounded pipeline; a separate skill would fragment
the contract and duplicate the snapshot/manifest coupling. The
machine-readable epistemic-status tag + the v1.8 backstop *are* the
reusable interface.

Pattern reuse: daymade `contradiction-finder` + first-class "Key
Controversies"; ARS `synthesis_overclaim` defect class (overreach).

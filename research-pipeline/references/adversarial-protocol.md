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
[primary|secondary|inferred, verified?, survived|weakened]
```

A downstream agent does **not** re-verify a `survived` claim (saves
re-running the funnel) and can see at a glance what is safe to build code on
versus what is a hypothesis. This cheaply kills single-synthesizer
confirmation bias.

Pattern reuse: daymade `contradiction-finder` + first-class "Key
Controversies"; ARS `synthesis_overclaim` defect class (overreach).

# Stage 4 — Pressure Testing (darwin-compatible)

## Goal

Before a skill actually ships, run it against a batch of test prompts to verify **how precisely it gets invoked** and **how good the output is once it's invoked**.

Anything that fails must go back for a **full rebuild** — not cosmetic patching of the `description` field, but redoing Stage 2's A2 / E / B.

## Why this is non-negotiable

A2 (the trigger) is the hardest part of distilling a book. However well-crafted a skill is, an inaccurate trigger means it might as well not exist. Pressure testing is the **only** way to catch trigger problems before release.

## Evaluation principle: independent-subagent blind testing first

Pressure testing should simulate a real invocation as closely as possible: does an agent who took no part in the distillation process, and can't see the expected answer, naturally activate this skill when faced with the user's prompt?

Preferred method:
- Spawn a clean subagent per test prompt — or, when resources are constrained, one clean subagent per skill's whole prompt set
- Give the subagent only: the skill's path or content, the user prompt, and (optionally) a list of adjacent skills
- Withhold from the subagent: `type`, `expected_behavior`, `notes`, the passing criteria, or any judgment from the main flow
- Require the subagent to output: `would_trigger`, `reason`, `if_triggered_action`
- The main flow then compares the subagent's output against `test-prompts.json`'s expectations line by line, and tallies the pass rate

If the current environment has no subagent capability, fall back to self-testing from the main flow, and mark the result in `test-results.md` as a fallback — less trustworthy than independent blind testing.

## `test-prompts.json` format (darwin-skill compatible)

```json
{
  "skill": "premeditatio-malorum",
  "version": "0.1.0",
  "source_book": "Meditations — Marcus Aurelius",
  "darwin_compatible": true,
  "test_cases": [
    {
      "id": "should-trigger-01",
      "type": "should_trigger",
      "prompt": "I'm stuck deciding whether to take this new project — I've listed a bunch of upsides but still feel unsure",
      "expected_behavior": "Invoke premeditatio-malorum; ask 'what's the worst outcome you're trying to avoid?'",
      "notes": "Positive scenario: an indecisive decision"
    },
    {
      "id": "should-not-trigger-01",
      "type": "should_not_trigger",
      "prompt": "Can you look up this API's parameters for me?",
      "expected_behavior": "Pure information lookup — no decision skill should fire",
      "notes": "Bait: a non-decision scenario"
    },
    {
      "id": "edge-01",
      "type": "edge_case",
      "prompt": "I'm trying to figure out what to make for dinner",
      "expected_behavior": "An everyday trivial choice — should not trigger (even though it's literally a 'decision')",
      "notes": "Boundary: distinguishing a serious decision from a routine choice"
    }
  ],
  "minimum_pass_rate": 0.8,
  "notes": "3-5 should_trigger cases + 2-3 should_not_trigger cases + 1-3 edge_case cases. Every should_not_trigger case must pass (zero tolerance for bait misses), and at least one of them must be a scenario belonging to a sibling skill from the same book (the cross-skill confusion test)."
}
```

## All three test classes are mandatory

| Class | Count | Purpose |
|---|---|---|
| `should_trigger` | 3–5 | does it fire when it should |
| `should_not_trigger` (bait prompt) | 2–3 | does it hold back when it shouldn't fire |
| `edge_case` (boundary-ambiguous) | 1–3 | is its judgment sound on genuinely ambiguous scenarios |

**A skill with no bait prompt gets sent straight back.** Testing only positive cases always makes a skill look good — but once deployed, it misfires.

**Cross-skill confusion test (non-negotiable)**: at least 1 bait prompt must be a scenario that "should trigger a different skill from the same book." When a single source yields 10+ skills, those skills competing for the same invocation is the single most common real-world failure after deployment — testing only "completely unrelated scenarios" will never surface it. For the blind test, hand the subagent the full name + description list of every skill in the pack, and have it answer "which one (if any) should fire" as a multiple-choice question, rather than a yes/no judgment about this one skill alone.

## Execution flow

1. For each skill, write its `test-prompts.json` per the template.
2. Run each test case as an independent blind test: hide `type` / `expected_behavior` / `notes`, and have the subagent judge "would this skill be invoked," recording its judgment and reasoning.
3. The main flow grades the results against `test-prompts.json`:
   - `should_trigger`: the subagent should clearly invoke this skill, and the resulting action should match `expected_behavior`
   - `should_not_trigger`: the subagent should not invoke this skill — zero tolerance for a bait-prompt miss
   - `edge_case`: the subagent's judgment should match the boundary reasoning defined in `expected_behavior`
4. Tally the pass rate:
   - **100% pass** → accept
   - **≥80% pass** → analyze the failing cases and decide whether to fix A2 or fix the test (but be wary of rationalizing away a real failure by blaming the test)
   - **<80% pass** → **a full rebuild of Stage 2 is required**, not a small patch
5. After fixing, rerun until it passes.

## Deciding "fix the skill or fix the test"

- If the failing case reveals **ambiguity in the skill's trigger description**: fix the skill
- If the failing case is a **legitimate scenario you hadn't considered before**: the skill probably needs to be fixed to cover it or explicitly exclude it
- If the failing case is a **scenario you over-engineered just to manufacture a bait prompt**: fix the test (but record why)

## Output

- `<skill-dir>/test-prompts.json` — darwin-compatible format
- `<skill-dir>/test-results.md` — this run's pass rate and failure analysis (for audit)

## Next step

Once every skill passes, move to Stage 5 (delivery), covered in `07-stage5-deliver.md`: generate the reader-facing `DIGEST.md` digest, install the skills into the user's skills directory — and only then suggest darwin-skill for automatic evolution.

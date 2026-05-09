# Voiceover Script — Demo v1

**Duration:** 60 seconds
**Voice:** ElevenLabs / Rachel (Multilingual v2)
**Pace:** ~2.5 words/sec

---

## Segment table with timings

| # | Scene | Timecode | Duration | Words | Text |
|---|---|---|---|---|---|
| 1 | intro | 0:00–0:08 | 8s | ~20 | Acme Analytics — the operating system for your fleet. Real-time visibility, predictive alerts, one workspace. |
| 2 | kpiHighlight | 0:08–0:14 | 6s | ~15 | Network load: ninety-five point two percent. Critical threshold. No spare capacity. |
| 3 | alertHighlight | 0:14–0:22 | 8s | ~20 | The system detects overload risk on the central corridor six months ahead of the event. |
| 4 | scenarioCountUp | 0:22–0:36 | 14s | ~35 | At forty percent traffic growth, load reaches one hundred and five percent. Queue: one thousand fifty units. Thirty percent of transit lost. |
| 5 | cascadePulse | 0:36–0:48 | 12s | ~30 | Cascade onto adjacent nodes. The model proposes three measures: capacity expansion, flow redistribution, tariff regulation. |
| 6 | diagnostic | 0:48–0:58 | 10s | ~25 | Of five projects in the investment program, three rank as high priority. Three more critical nodes fall outside the current plan. |
| 7 | outro | 0:58–1:00 | 2s | ~5 | Acme. Answers for the whole network. |

---

## Full text for ElevenLabs (paste as one block)

```
Acme Analytics — the operating system for your fleet. Real-time visibility, predictive alerts, one workspace.

Network load: ninety-five point two percent. Critical threshold. No spare capacity.

The system detects overload risk on the central corridor six months ahead of the event.

At forty percent traffic growth, load reaches one hundred and five percent. Queue: one thousand fifty units. Thirty percent of transit lost.

Cascade onto adjacent nodes. The model proposes three measures: capacity expansion, flow redistribution, tariff regulation.

Of five projects in the investment program, three rank as high priority. Three more critical nodes fall outside the current plan.

Acme. Answers for the whole network.
```

---

## ElevenLabs settings

- **Model:** Eleven Multilingual v2
- **Stability:** 0.5
- **Similarity:** 0.75
- **Style:** 0.3
- **Speaker Boost:** ON

---

## Notes

- Spell numbers out when they're spoken ("ninety-five", not "95") — TTS pronounces them more naturally
- Acronyms get pronounced letter-by-letter (e.g. "TEU" as "tee-ee-you"). Spell them phonetically if they should sound that way, or replace with the full term
- Double newlines between sentences create natural pauses
- For extra emotion, prefix a segment with `[Confidently]` / `[Serious]` (Eleven Multilingual supports prompt-style direction)

---

## Sync checklist

After generating the mp3, open it in Audacity:
1. Measure the actual duration of each segment
2. If the gap is > 0.5s, update `SCENE_TIMINGS` in `src/timing.ts`
3. Re-record Playwright (`pnpm record`) with updated `durationMs`
4. Re-render Remotion (`pnpm render`)
5. Final assembly with `final-assembly.sh`

---
name: 05-voiceover-elevenlabs
description: Voiceover script with frame-perfect timings, ElevenLabs TTS, sync with overlay scenes
---

# Voiceover via ElevenLabs

## What it is

Voiceover is the main thing that separates a "functional screencast" from a "marketing video". The voice holds attention, explains what's happening on screen, and sells the value.

**ElevenLabs** is the best AI TTS as of 2026. Voice cloning from a 30s sample, realistic prosody, supports many languages including Russian, German, Spanish, French.

## Workflow

```
1. Write the script with timings  →  voiceover/script.md
2. Segment by scene               →  one segment per scene
3. Generate via ElevenLabs        →  voiceover/voice.mp3
4. Adjust scene durations         →  re-record / re-render phase 3/4
5. Final mix                      →  phase 6
```

## Script with timings

The key artifact is `voiceover/script.md`. It binds scene timings to text.

```markdown
# Voiceover for Demo v1 (60s)

| Segment | Scene | Time | Duration | Text |
|---|---|---|---|---|
| 1 | intro | 0:00–0:08 | 8s | AIDA Analytics — the national transport platform of Kazakhstan. |
| 2 | kpi | 0:08–0:14 | 6s | Network load: 95.2%. Critical threshold. No spare capacity. |
| 3 | alert | 0:14–0:22 | 8s | The system detects overload risk on the TMTM corridor six months ahead. |
| 4 | scenario | 0:22–0:36 | 14s | At 40% traffic growth, load hits 105%. 30% transit loss. Cascade onto adjacent nodes. |
| 5 | cascade | 0:36–0:48 | 12s | The model proposes three measures: capacity expansion, flow redistribution, tariff regulation. |
| 6 | diagnostic | 0:48–0:58 | 10s | Of five projects in the investment program, three rank as high priority. Three more nodes fall outside the plan. |
| 7 | outro | 0:58–1:00 | 2s | AIDA — answers for the whole network. Minutes, not months. |
```

## The 2.5 words/second rule

At ~2.5 words/sec (English):
- 6s segment ≈ 15 words
- 8s segment ≈ 20 words
- 10s segment ≈ 25 words
- 14s segment ≈ 35 words

If the text doesn't fit — **shorten the text**, don't stretch the scene. Long pauses between phrases beat machine-gun delivery.

## ElevenLabs — two paths

### A. Web UI (fast, no code)

1. Go to https://elevenlabs.io
2. Voices → pick a stock voice (for English: "Rachel", "Adam", "Antoni"; for Russian: "Anna", "Boris", "Mark" are reliable)
3. Text to Speech → paste the whole script
4. Settings:
   - Model: **Eleven Multilingual v2** (covers most languages)
   - Stability: 0.5 (balance of neutrality and emotion)
   - Similarity: 0.75
   - Style: 0.3 (light expressiveness)
5. Generate → download mp3 → `voiceover/voice.mp3`

**Price:** ~$5/month Starter plan = 30k characters ≈ 30 minutes of audio.

### B. API (programmatic)

```bash
pnpm add elevenlabs
```

```ts
import { ElevenLabsClient } from "elevenlabs";
import { writeFileSync } from "node:fs";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel; for non-English, pick a multilingual voice
const text = `
AIDA Analytics — the national transport platform of Kazakhstan.
Network load: ninety-five point two percent. Critical threshold.
...
`;

const audio = await client.textToSpeech.convert(voiceId, {
  text,
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.3,
  },
});

const chunks: Buffer[] = [];
for await (const chunk of audio) chunks.push(chunk);
writeFileSync("voiceover/voice.mp3", Buffer.concat(chunks));
```

## Voice cloning — your own voice

If you want your own voice in the video:
1. Record 1–2 minutes of clean speech (quiet room, USB mic)
2. ElevenLabs → Voice Lab → Add Voice → Instant Clone → upload the sample
3. Use the resulting voice ID like any other
4. Clone quality depends on the sample — 30s minimum, 1–3 minutes ideal. Emotional range in the sample = more expressiveness in the TTS

## Syncing with overlays

After generating the voiceover you may notice that:
- Segment 4 is actually 16s, not 14s → the overlay ends before the words

Two paths from there:
- **Stretch the overlay scenes** — change `SCENE_TIMINGS` in `src/timing.ts`
- **Shorten the voiceover text** — regenerate that segment

Don't try to speed-change the audio (>1.05×) — it sounds chipmunk-y.

## Alternative: OpenAI TTS

Cheaper ($15 per million chars), less realistic:
```ts
import OpenAI from "openai";
const openai = new OpenAI();
const audio = await openai.audio.speech.create({
  model: "tts-1-hd",
  voice: "onyx",  // alloy/echo/fable/onyx/nova/shimmer
  input: scriptText,
});
const buffer = Buffer.from(await audio.arrayBuffer());
writeFileSync("voiceover/voice.mp3", buffer);
```

## Alternative: live voice

If you have no TTS budget or want maximum naturalness:
1. Record voiceover in QuickTime / GarageBand / Voice Memos
2. Denoise: `ffmpeg -i raw.m4a -af "afftdn=nf=-25" voice.mp3`
3. Normalise loudness: `ffmpeg -i voice.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 voice-norm.mp3`

## Pitfalls

### Timings don't line up the first time

Normal. Plan:
1. Generate the voiceover at the assumed timings
2. Open in Audacity / Logic — measure actual durations
3. Adjust `SCENE_TIMINGS` in `src/timing.ts` to match the audio
4. Re-record Playwright (`pnpm record`) with matching `durationMs`
5. Re-render Remotion (`pnpm render`)

The cycle takes 5–10 minutes.

### Mispronunciations / wrong stress

TTS sometimes misreads words (especially names, technical terms, non-English words in English text). Fixes:
- Replace the word with a synonym
- Use IPA / SSML phonetics (not universally supported)
- Record problem words separately and stitch with ffmpeg

### Pauses between sentences

Eleven Multilingual v2 already adds natural pauses. To force one explicitly use `<break time="500ms"/>` in SSML, or just `\n\n` (double newline).

### Whisper / volume / emotion

Eleven Turbo / Multilingual support these via **prompt prefix**:
```
[Whispering] Listen. Something is wrong with the system.
[Confidently] AIDA — the national transport platform.
```
Doesn't always land — iterate.

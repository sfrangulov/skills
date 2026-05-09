---
name: 01-architecture
description: Pipeline overview, inputs, prerequisites, output artifact
---

# Pipeline architecture

## Inputs

One of:
1. **Standalone HTML** with React + Babel inline (e.g. `transport-analytics_demo_v2_presentation.html`) — fastest path, no build step required
2. **Live web app** (Next.js / Vite / etc.) — run it locally or point at a prod URL
3. **Static React build** in `dist/`, openable via `file://`

## Output

`out/demo-final.mp4` — 1920×1080, 30fps, ~30–90s, h264 + AAC, ready for publishing (LinkedIn, YouTube, presentations).

## 5 pipeline phases

| # | Phase | What we do | Artifact | First run | Re-runs |
|---|---|---|---|---|---|
| 1 | **Source** | Prepare source: HTML/URL, test data | URL | varies | 0 (existing) |
| 2 | **Zoom hook** | Add `useZoomScenes` + SCENES config | `<script>` block in HTML / hook.js | 30 min | 0 |
| 3 | **Recorder** | Playwright script presses keys, writes mp4 | `public/recording.mp4` | 20 min | 1 min/run |
| 4 | **Overlays** | Remotion project: intro, callouts, count-up, outro | `out/demo.mp4` (no audio) | 60 min | 5–10 min/run |
| 5 | **Audio** | Voiceover (ElevenLabs) + music + ducking | `out/demo-final.mp4` | 30 min | 5 min/run |

**Total first run: ~2.5 hours.** Each subsequent iteration: 15–20 minutes (edit SCENES → re-record → re-render → re-mix).

## Prerequisites

```bash
# Verify everything is installed
node --version    # >= 20
pnpm --version    # >= 9
ffmpeg -version   # any modern build
```

Install if missing:
```bash
brew install node ffmpeg pnpm
# Playwright browsers install themselves via the script
```

API keys (optional):
- **ElevenLabs API key** — for programmatic TTS voiceover. Without a key you can still generate via the web UI.
- **OpenAI API key** — fallback TTS

## Where things live

```
<project>/
├── transport-analytics_demo.html  (phase 1: source)
└── video/demo-v1/                 (phases 2–5)
    ├── public/
    │   └── recording.mp4          (phase 3 output)
    ├── src/                       (phase 4: Remotion)
    │   ├── Root.tsx
    │   ├── DemoComposition.tsx
    │   ├── timing.ts
    │   ├── scenes/
    │   └── components/
    ├── scripts/
    │   └── record-demo.ts         (phase 3 script)
    ├── voiceover/                 (phase 5)
    │   ├── script.md
    │   ├── voice.mp3
    │   └── music.mp3
    └── out/
        ├── demo.mp4               (phase 4 output, no audio)
        └── demo-final.mp4         (phase 5 output, FINAL)
```

## Which approach to use

**Phase 3 only (Playwright)** — quick internal screencast without polish. You get a functional video in ~5 minutes.

**Phases 3 + 4** — marketing video without voiceover. Logo, tagline, callouts overlaid on the recording.

**All 5 phases** — presidential-grade demo with voiceover. Goes to stakeholders.

**Alternative to all of this** — Screen Studio (~$89, native macOS). If you do this once a year, just buy Screen Studio. If you do it regularly (releases, marketing, multiple products), this pipeline pays for itself.

## Limitations

- **Does not replicate Screen Studio polish** — beauty cursor, smooth camera moves between points. The pipeline gets you ~70% of Screen Studio quality at 100% reproducibility
- **Not great for interactive demos** that need typed input into form fields — Playwright can do it, but synchronising typing with zoom scenes is tricky
- **Voiceover sync is manual** — you have to listen to the cut and adjust either the SCENES timings or the voice script

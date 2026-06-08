# Demo Video Pipeline

**A Claude Code skill that turns a web UI into a polished 30–90s demo video — cinematic zooms, overlay graphics, voiceover, and music — fully from the terminal.**

No screen-recording-and-praying. The pipeline drives your React or HTML app headlessly, records a clean take with key-driven cinematic zooms, layers motion graphics on top in Remotion, adds a frame-synced voiceover, and mixes the final mp4 with audio ducking. Every stage is a reusable script, so re-recording after a UI change is cheap.

---

## When to use

You need a **polished demo video** (~30–90s) of a web interface with:

- Cinematic zoom transitions between key scenes
- Overlay graphics — callouts, count-up numbers, pulse highlights, intro/outro
- Professional voiceover (live or TTS)
- Music and sound effects

**Trigger phrases:** *"record a demo of the system", "make a video showing X", "product walkthrough", "presidential demo video", "screencast for the landing page", "Product Hunt video", "demo with voiceover and callouts".*

**Not for:** simple screen capture (use Screen Studio / QuickTime), long tutorials (10+ minutes — different format), or live streams.

---

## The pipeline

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│ 1. React/   │ → │ 2. useZoom   │ → │ 3. Playwright│ → │ 4. Remotion │ → │ 5. ffmpeg +  │
│   HTML app  │   │   Scenes hook│   │   recorder   │   │   overlays  │   │  voiceover   │
└─────────────┘   └──────────────┘   └──────────────┘   └─────────────┘   └──────────────┘
  existing UI     key-driven         headless mp4         intro/outro,      final mp4 with
                  cinematic zoom      1920×1080 30fps      callouts, motion  voice + music + duck
```

Each stage needs ~30 minutes of setup, then **gets reused** on every re-record — the scripts are idempotent.

| Stage | What it produces | Rule file |
|:------|:-----------------|:----------|
| **2. Zoom hook** | A universal `useZoomScenes` hook: target selectors, numeric override, scene config | `rules/02-zoom-hook.md` |
| **3. Recorder** | Headless Playwright recording with keyboard-driven scenes, webm → mp4 | `rules/03-playwright-recorder.md` |
| **4. Overlays** | Remotion graphics on top: Logo, CalloutLabel, CountUp, PulseBox on a Sequence timeline | `rules/04-remotion-overlays.md` |
| **5. Voiceover** | Script with frame-perfect timings, ElevenLabs API or web UI, synced to Remotion | `rules/05-voiceover-elevenlabs.md` |
| **6. Assembly** | Final ffmpeg mix: video + voiceover + music + ducking | `rules/06-final-assembly.md` |

---

## How it starts — Step 0 Intake

Before any code, the skill collects five answers that fork the pipeline at every level (10× cheaper upfront than retrofitting):

1. **Source** — file path, URL, or a project to run.
2. **Target platform** — sets aspect ratio and loudness: 16:9 (LinkedIn/YouTube), 1:1 (mobile feed), 9:16 (Reels/TikTok/Shorts), or uncapped internal.
3. **Voiceover language** — sets the per-second word budget (Russian needs ~25% fewer words than English).
4. **Ambition** — `Quick screencast` (~10 min) · `Polished marketing reel` (~1.5 h) · `Full presidential demo` (~2.5 h).
5. **Story** — the one-line product pitch, the 3–5 key moments, and what the viewer should remember by the last second.

---

## Companion skills

This skill orchestrates the pipeline; two companion skills carry the deep API knowledge. **Load both at the start of the session** (not as references):

- **`remotion-best-practices`** — the official `@remotion/skills`. `useCurrentFrame()` rules, `interpolate` / `spring`, audio, captions, transitions. *Skipping it is the #1 way to lose an hour — e.g. CSS animations inside Remotion silently render a frozen frame.*
- **`playwright-best-practices`** — locator strategy, auto-waiting, SPA `waitForFunction` patterns, network mocking, CI.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI, desktop app, or IDE extension
- **Node 20+**, **pnpm**, **ffmpeg**
- Playwright Chromium (`npx playwright install chromium`)
- **ElevenLabs API key — optional.** TTS via the web UI works too; or skip voiceover entirely for the quick-screencast tier.

---

## Installation

### Via skills.sh

```bash
npx skills add sfrangulov/skills --skill demo-video-pipeline
```

### Manual

```bash
git clone https://github.com/sfrangulov/skills.git
cp -r skills/demo-video-pipeline ~/.claude/skills/
```

The [templates/](templates/) directory has drop-in files for the whole pipeline — the zoom hook, the Playwright recorder, a Remotion project skeleton, overlay components, a voiceover script template, and the ffmpeg ducking assembly script.

---

## Usage

Trigger it in Claude Code:

> "Record a polished demo video of my dashboard at localhost:3000 for our landing page."

> "Make a 60-second Product Hunt reel of this app with voiceover and callouts."

Or invoke it directly:

> `/demo-video-pipeline`

The skill runs intake, bootstraps the recorder + Remotion project, adapts the scene config to your app, records, generates the voiceover, renders overlays, and mixes the final mp4.

---

## Before you ship — non-negotiable QA

The pipeline regularly produces videos that look correct in Remotion Studio and break subtly in the final mp4. Every time:

1. **Frame sweep** — `ffmpeg -i out/demo-final.mp4 -vf "fps=1/4" preview/f-%02d.png`, then open every PNG: does any overlay cover the content the voiceover refers to? Is a pulse/callout pointing at empty space? Do chip values match what the UI actually shows in that frame?
2. **Duration sanity** — `ffprobe` duration within 0.3 s of `markers.totalDurationMs / 1000`.
3. **Mobile playback** — AirDrop to a phone and play once; codec issues only show on real devices.
4. **Listen at platform LUFS** — voice never inaudible against music; music never pushed to silence.

---

## License

MIT — see [LICENSE](LICENSE).

---
name: demo-video-pipeline
description: End-to-end automated pipeline for recording polished 30-90s demo videos of React or HTML web apps. Universal keyboard-driven zoom hook with cinematic scenes → Playwright headless recording → Remotion overlay graphics (intro, callouts, count-up numbers, pulse highlights) → ElevenLabs voiceover with frame-perfect timings → final mp4 with audio mixing and ducking. Use whenever the user wants to record a product walkthrough, marketing video, screencast with voiceover, demo for LinkedIn, YouTube or product launch, executive presentation, sales video, onboarding video, feature announcement, or any short polished video showing a web UI. Triggers on phrases like "record a demo", "make a screencast", "video for landing page", "product hunt video", "show this UI in a video", "walkthrough video", "demo with voiceover", "screen recording with zooms and callouts".
license: MIT
metadata:
  author: sfrangulov
  version: "1.2.0"
  tags: video, demo, recording, playwright, remotion, elevenlabs, screencast, presentation, react
---

## Companion skills — load these BEFORE you start

Two other skills carry the deep API knowledge for the tools in this pipeline. Without them, you will spin on basics this skill does not repeat. **As soon as this skill triggers, invoke the Skill tool for both of these:**

- `remotion-video-creation` — 29 rules covering Remotion's API: animations, audio, captions, transitions, the `interpolate` / `spring` patterns, gotchas around `<Video>` / `<OffthreadVideo>`. Load it before touching anything in `src/` (phase 4).
- `playwright-best-practices` — covers the locator strategy, auto-waiting, network mocking, debugging flaky tests, and CI patterns. Load it before writing `scripts/record-demo.ts` (phase 3) — the SPA waiting / `waitForFunction` patterns in rules/03 are a thin slice of what this skill knows.

Skipping this is the #1 way to lose an hour rediscovering things. Real example: forgetting `remotion-video-creation` led to using CSS animations inside Remotion (silently produces a frozen frame in the rendered mp4 — Remotion only honours `useCurrentFrame()`-driven animation).

## When to use

Use this skill when you need to record a **polished demo video** (~30–90s) of a web interface with:
- Cinematic zoom transitions between key scenes
- Overlay graphics on top (callouts, count-up numbers, highlights, intro/outro)
- Professional voiceover (live or TTS)
- Music and sound effects

**Trigger phrases:** "record a demo of the system", "make a video showing X", "presidential demo video", "product walkthrough", "rebuild that demo reel", "screencast for the landing page".

**Not for:** simple screen capture (use Screen Studio / QuickTime), long video tutorials (10+ minutes — different format), live streams.

## Pipeline overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. React/HTML   │ →  │ 2. useZoomScenes │ →  │ 3. Playwright   │ →  │ 4. Remotion  │ →  │ 5. ffmpeg +  │
│    app/page     │    │    hook          │    │    recorder     │    │    overlays  │    │  voiceover   │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────┘    └──────────────┘
   existing UI        cinematic key-driven      headless mp4         intro/outro,        final mp4 with
                      zoom + scene config       1920x1080 30fps      callouts, motion    voice + music
```

Each phase needs ~30 minutes of setup, then **gets reused** on every re-record. Scripts are idempotent.

## How to use

Read the rule files in phase order — each phase produces one artifact:

- [rules/01-architecture.md](rules/01-architecture.md) — pipeline overview, when to use what, prerequisites (ffmpeg, pnpm, node)
- [rules/02-zoom-hook.md](rules/02-zoom-hook.md) — universal `useZoomScenes` hook: target selectors, numeric override, scene config
- [rules/03-playwright-recorder.md](rules/03-playwright-recorder.md) — headless recording with keyboard-driven scenes, webm → mp4 transcode
- [rules/04-remotion-overlays.md](rules/04-remotion-overlays.md) — overlay graphics on top of mp4: Logo, CalloutLabel, CountUp, PulseBox, Sequence timeline
- [rules/05-voiceover-elevenlabs.md](rules/05-voiceover-elevenlabs.md) — voiceover script with frame-perfect timings, ElevenLabs API/web UI, sync with Remotion
- [rules/06-final-assembly.md](rules/06-final-assembly.md) — final ffmpeg assembly: video + voiceover + music + ducking

## Quick start (TL;DR)

```bash
# 0. Load companion skills first (Skill tool):
#      remotion-video-creation, playwright-best-practices

# 1. Add the zoom hook to your HTML/app (see rules/02)

# 2. Bootstrap recorder + remotion project
mkdir -p video/demo-v1/{public,scripts,src/{scenes,components}}
cd video/demo-v1
pnpm init
pnpm add remotion @remotion/cli @remotion/media react react-dom
pnpm add -D playwright tsx typescript @types/node @types/react @types/react-dom
npx playwright install chromium

# 3. Copy templates from this skill into the project (use the path where the
#    skill is installed — e.g. .claude/skills/demo-video-pipeline/templates/
#    or wherever your skill manager puts it). Copy the entire templates/ tree:
#      - useZoomScenes.snippet.js     → reference for adding the hook to your app
#      - record-demo.ts               → scripts/record-demo.ts
#      - Root.tsx, DemoComposition.tsx, theme.ts, timing.ts → src/
#      - scenes/*                     → src/scenes/
#      - components/*                 → src/components/
#      - package.json, tsconfig.json, remotion.config.ts → project root (merge with your own)
#      - voiceover-script.template.md → voiceover/script.md
#      - final-assembly.sh            → scripts/final-assembly.sh

# 4. Adapt SCENES config to your app

# 5. Record
pnpm record   # → public/recording.mp4

# 6. Generate voiceover (rules/05) → voiceover/voice.mp3

# 7. Render final
pnpm dev      # preview Remotion overlays
pnpm render   # → out/demo.mp4

# 8. Mix audio (see rules/06 for the ducking variant)
bash scripts/final-assembly.sh

# 9. MANDATORY before showing the user — extract and review preview frames
mkdir -p preview && ffmpeg -y -i out/demo-final.mp4 -vf "fps=1/4" preview/f-%02d.png
# Open every PNG. For each: does the overlay cover content? does the pulse
# land on its target after the scroll? do the chip values match what the UI
# is actually showing in that frame?
```

## Templates

The [templates/](templates/) directory contains drop-in files:

- `useZoomScenes.snippet.js` — hook + SCENES config example
- `record-demo.ts` — Playwright recorder
- `package.json` / `tsconfig.json` / `remotion.config.ts` — Remotion project skeleton
- `Root.tsx` / `DemoComposition.tsx` / `timing.ts` / `theme.ts` — Remotion entrypoints
- `scenes/Scene1Intro.tsx` — minimal example scene (skeleton you extend)
- `components/Logo.tsx` / `CalloutLabel.tsx` / `CountUp.tsx` / `PulseBox.tsx` — overlay components
- `voiceover-script.template.md` — voiceover script with placeholder timings
- `final-assembly.sh` — ffmpeg mix with ducking

## Known pitfalls

- **`@remotion/cli` is mandatory** in dependencies — without it `pnpm dev` / `pnpm render` fail with `command not found`
- **Playwright `recordVideo` writes webm**, you need ffmpeg to convert it to mp4
- **`@remotion/media` Video** requires the file to be in `public/` at dev start — otherwise 404 with no graceful fallback
- **CSS transitions/animations are FORBIDDEN inside Remotion** — all animation must go through `useCurrentFrame()` + `interpolate()` / `spring()`
- **`getBoundingClientRect()` for the zoom target** accounts for the current transform — if a zoom is already applied, divide by `currentScale`
- **Cinematic zoom != fit-to-element** — auto-fit gives a correct but boring frame. Off-center origin (`oy: 99` or `ox: 3`) creates drama. Numeric override beats target ~60% of the time
- **The HUD scene indicator** in the recording can be distracting — either hide it before the production take, or keep it as "scene markers" to help align voiceover later
- **ffmpeg ducking direction matters** — sidechaincompress order is `[main][sidechain]`, so the music must be the main input and the voice the sidechain. The other order ducks the voice instead — see rules/06 for the correct filter
- **`tsx` injects a `__name` helper that breaks `page.evaluate` callbacks** — running the recorder via `tsx scripts/record-demo.ts` causes any non-trivial `page.evaluate` to fail in the browser with `ReferenceError: __name is not defined`. Esbuild adds the helper for stack-trace names; Playwright stringifies the closure and ships it across without the helper. Fix once at session start: `await page.addInitScript(() => { (globalThis as any).__name = (fn: any) => fn; });`. Different cause from the CSP/string-eval issue below — same symptom area, opposite remediation
- **`page.mouse.wheel` beats `el.scrollTop = N` on real SPAs** — virtualised lists and controlled-scroll containers silently revert programmatic scrollTop on the next React render. The mp4 ends up frozen on the same view all session. Use the native wheel input. The `scrollTop` helper still works for static demo HTML
- **`recordVideo` writes a 1–3 s pre-roll** — the file starts at `context.newPage()`, which is earlier than your scene markers (you usually wait for fonts/login/data first). Remotion will then run overlays ahead of the underlying content. Capture `videoStart = Date.now()` before `newPage()` and write `headTrimMs = recordStart - videoStart` into `markers.json`; the markers schema already shifts everything off that field. No ffmpeg trim needed
- **`waitUntil: "networkidle"` is a trap on real SPAs** — chat sockets, SSE, polling never go quiet. Use `"commit"` + an explicit `page.waitForFunction` on a real KPI value (e.g. `/3,06.*hours/`), not on a heading (skeletons keep the heading). See rules/03
- **`page.waitForFunction(fn, {timeout})` silently uses the 30s default** — the second positional arg is the predicate's input, not options. Correct call: `page.waitForFunction(fn, null, { timeout: 90000 })`. Headless renders data-heavy KPIs 5–10× slower than headed, so 90s+ timeouts are the norm
- **String-eval is blocked inside `page.evaluate`** — sandbox CSPs and security hooks block dynamic-code constructors. Pass real closures, not stringified callbacks
- **Reconnoiter with the Playwright MCP server before writing the recorder** — click around the live page, capture screenshots, find the real selectors and the actual time-to-content. Saves 2–3 recording iterations
- **Open at the entry, not the deep link** — start the recording at `/`, click into the navigation, land on the feature. Three cheap seconds turn a "cut" into a "tour"

## Before you ship the video

These checks are not optional — the pipeline regularly produces videos that look correct in Remotion Studio and break in subtle ways in the final mp4. Run them every time:

1. **Frame sweep.** `ffmpeg -i out/demo-final.mp4 -vf "fps=1/4" preview/f-%02d.png` and open every PNG. For each frame ask: does any overlay cover the content the voiceover refers to? Is a pulse / callout pointing at empty space (target hasn't arrived after scroll yet)? Do chip values match the values the UI is actually displaying in that frame?
2. **Duration sanity.** `ffprobe -v error -show_entries format=duration out/demo-final.mp4` should land within 0.3 s of `markers.totalDurationMs / 1000`. Anything bigger means the audio mux pulled `-shortest` to the wrong stream or the pre-roll wasn't trimmed.
3. **Mobile playback.** AirDrop the mp4 to a phone and play it once. Codec-compat issues hit only on real devices, never in QuickTime preview.
4. **Listen at platform LUFS.** Open in QuickTime, listen end-to-end with system volume at 50%. Voice should never be inaudible against the music; music should never feel pushed down to silence.

## See also

- `remotion-video-creation` and `playwright-best-practices` — load both at the start of the session, not as references (see "Companion skills" at the top)
- ElevenLabs API: https://docs.elevenlabs.io/api-reference/text-to-speech
- VHS (terminal recording alternative): https://github.com/charmbracelet/vhs

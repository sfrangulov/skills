---
name: 04-remotion-overlays
description: Remotion overlay project — intro/outro, callouts, count-up numbers, pulse highlights on top of mp4
---

# Remotion overlay project

## ⚠️ Load `remotion-best-practices` first

Before writing any code in this phase, invoke the Skill tool to load `remotion-best-practices` (the official `@remotion/skills` from remotion-dev). It carries 36 rules on Remotion's API — animations, audio, captions, transitions, `interpolate` / `spring`, `<Video>` / `<OffthreadVideo>` gotchas, `staticFile`, font loading, MapLibre embeds, silence detection, DOM measuring, and rendering. This rule file does not repeat any of that; it shows the *project shape* for a demo-overlay setup. Without `remotion-best-practices` loaded you will end up using CSS animations (silently dead in Remotion), miss `premountFor`, mis-time springs, and generally fight the framework.

## What it is

Remotion is a React framework for rendering video. You write components like normal React and render to mp4. The idea here: layer overlay graphics on top of the mp4 captured by Playwright.

## Project layout

```
video/demo-vN/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.ts             # registerRoot
│   ├── Root.tsx             # <Composition> registry
│   ├── DemoComposition.tsx  # main composition: Video + Sequences
│   ├── timing.ts            # SCENE_TIMINGS (single source of truth)
│   ├── theme.ts             # colors, fonts
│   ├── scenes/              # one .tsx per overlay scene
│   │   ├── Scene1Intro.tsx
│   │   ├── Scene2Kpi.tsx
│   │   └── ...
│   └── components/          # reusable: Logo, CalloutLabel, CountUp, PulseBox
├── public/
│   └── recording.mp4        # background from phase 3
└── out/
    └── demo.mp4             # output without audio
```

## Setup

```bash
mkdir -p video/demo-v1/{public,scripts,src/{scenes,components}}
cd video/demo-v1
pnpm init -y
pnpm add remotion @remotion/cli @remotion/media react react-dom
pnpm add -D @types/react @types/react-dom typescript
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts DemoV1 out/demo.mp4",
    "record": "tsx scripts/record-demo.ts"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

## Composition

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";

export const RemotionRoot = () => (
  <Composition
    id="DemoV1"
    component={DemoComposition}
    durationInFrames={60 * 30}  // 60s @ 30fps
    fps={30}
    width={1920}
    height={1080}
  />
);
```

```tsx
// src/DemoComposition.tsx
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { SCENE_TIMINGS } from "./timing";
import { Scene1Intro } from "./scenes/Scene1Intro";
// ... import the rest of your scenes

export const DemoComposition: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Video
      src={staticFile("recording.mp4")}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    <Sequence
      from={SCENE_TIMINGS.intro.from}
      durationInFrames={SCENE_TIMINGS.intro.duration}
      premountFor={30}
    >
      <Scene1Intro />
    </Sequence>
    {/* ... remaining scenes */}
  </AbsoluteFill>
);
```

## Timings — single source of truth

You have two options. Pick one and stick with it.

### Option A: hand-written `timing.ts` (simple)

```ts
// src/timing.ts
export const FPS = 30;
const sec = (s: number) => s * FPS;

export const SCENE_TIMINGS = {
  intro:        { from: sec(0),  duration: sec(8) },
  kpiHighlight: { from: sec(8),  duration: sec(6) },
  alertHighlight:{ from: sec(14), duration: sec(8) },
  // ...
} as const;
```

**Important:** these numbers must match the `durationMs` in the Playwright recorder. If the recorder holds `key: "1"` for 8000ms, the Remotion overlay for scene 1 must be 8 seconds (240 frames).

This is the lightest path but it drifts: every time you tweak the recorder you must remember to update `timing.ts` too.

### Option B: derive everything from `public/markers.json` (recommended for anything beyond a one-shot)

The recorder writes the actual scene start / end timestamps to `public/markers.json` after the take (see rules/03). Remotion reads it and derives all `from` / `duration` values. No drift, ever.

Schema (see `templates/markers.json` for a full example):
```json
{
  "fps": 30,
  "headTrimMs": 0,
  "totalDurationMs": 60000,
  "scenes": [
    { "id": "intro",          "startMs": 0,     "durationMs": 8000 },
    { "id": "kpiHighlight",   "startMs": 8000,  "durationMs": 6000 },
    { "id": "alertHighlight", "startMs": 14000, "durationMs": 8000 }
  ]
}
```

`headTrimMs` lets you slice off a slow head in ffmpeg without re-running anything — every scene shifts automatically.

Reading it in Remotion:
```ts
// src/timing.ts
import markers from "../public/markers.json";

const FPS = markers.fps;
const msToFrames = (ms: number) => Math.round((ms - markers.headTrimMs) / 1000 * FPS);

export const SCENE_TIMINGS = Object.fromEntries(
  markers.scenes.map((s) => [
    s.id,
    { from: msToFrames(s.startMs), duration: msToFrames(s.startMs + s.durationMs) - msToFrames(s.startMs) },
  ]),
) as Record<string, { from: number; duration: number }>;
```

Then `<Sequence from={SCENE_TIMINGS.intro.from} durationInFrames={SCENE_TIMINGS.intro.duration}>` keeps working unchanged.

## Animations (Remotion rules)

**FORBIDDEN:** CSS transitions, CSS animations, Tailwind animation classes — they don't render to the final mp4.

**ALLOWED:** only via `useCurrentFrame()` + `interpolate()` / `spring()`:

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Linear fade
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Spring scale
  const scale = spring({ frame, fps, config: { damping: 200 } });

  // Easing curve
  const x = interpolate(frame, [0, fps], [-100, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  return <div style={{ opacity, transform: `scale(${scale}) translateX(${x}px)` }}>...</div>;
};
```

Spring presets:
```tsx
const smooth = { damping: 200 };               // smooth, no bounce
const snappy = { damping: 20, stiffness: 200 }; // snappy UI
const bouncy = { damping: 8 };                  // playful
```

## Composition duration — derive it, don't hardcode it

The Root.tsx template uses `calculateMetadata` to derive `durationInFrames` from `public/markers.json`. That kills the last hardcoded number in the project: re-record with a different scene mix → markers update → composition resizes automatically next render.

```tsx
import { Composition, type CalculateMetadataFunction } from "remotion";
import markers from "../public/markers.json";

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const visibleDurationMs = markers.totalDurationMs - markers.headTrimMs;
  return {
    durationInFrames: Math.ceil((visibleDurationMs / 1000) * markers.fps),
    fps: markers.fps,
  };
};

<Composition
  id="DemoV1"
  component={DemoComposition}
  durationInFrames={1}        // overridden by calculateMetadata
  fps={markers.fps}
  width={1920}
  height={1080}
  calculateMetadata={calculateMetadata}
/>
```

This is the official Remotion pattern — see `calculate-metadata.md` in the loaded `remotion-best-practices` companion skill for the full API. The pattern also lets you derive width/height/props dynamically — useful if you generate vertical (9:16) and horizontal (16:9) variants from the same composition.

If you ever want **audio** to drive the duration instead of the recording (i.e. the final video is exactly as long as the voiceover), the `voiceover.md` rule in the same companion shows the pattern: load the mp3 with `getAudioDuration` and use it inside `calculateMetadata`. See rules/05 for when to pick that path.

## Sync overlays to in-scene actions, not to scene start

A scene rarely shows a static frame for its full duration — it usually starts with a recorder action (scroll, click, tab switch) that takes 1–2 s to settle. If your overlay renders at frame 0 of the `<Sequence>`, it appears over the *unsettled* state and looks misaligned.

Two real cases:
- **Scroll scene.** `wheelScrollSpa(page, "main", 1100)` runs ~1.5 s. A `PulseAnchor` over the row that ends up in view will hover over moving content for the first 45 frames @ 30fps, then the row arrives underneath an already-rendered pulse. Reads as "the overlay appeared in the wrong place".
- **Click scene.** `page.click("Scenario B")` triggers a React recompute that takes ~1.5 s before new tile values render. A `DeltaChip` showing the new value appears next to the *old* tile value — cognitive dissonance.

Fix: every overlay component takes a `startDelay` in frames and offsets its lifecycle. Scene wrappers like `<FadeInOut>` should accept it directly:

```tsx
const FadeInOut: React.FC<{
  children: React.ReactNode;
  totalFrames: number;
  startDelay?: number;
  inFrames?: number;
  outFrames?: number;
}> = ({ children, totalFrames, startDelay = 0, inFrames = 14, outFrames = 14 }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startDelay;
  if (localFrame < 0) return null;
  const remain = totalFrames - startDelay;
  const opacity = interpolate(
    localFrame,
    [0, inFrames, remain - outFrames, remain],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <div style={{ opacity }}>{children}</div>;
};
```

Empirical defaults at 30 fps:

| Scene type | `startDelay` | Why |
|---|---|---|
| Scroll scene (`wheelScrollSpa`) | 50 frames (1.67 s) | 1.5 s scroll + 0.2 s buffer |
| Click / tab-switch scene | 45–75 frames (1.5–2.5 s) | Click + React recompute of KPIs |
| Static-view scene (no in-scene action) | 0 or 14 (just enter-fade) | Nothing to wait for |

For multi-chip cascades (e.g. four KPI deltas appearing in sequence after a click), stagger them: `delayFrames = 45, 70, 95, 120`. The click-latency offset stays — the cascade adds on top.

## Anchors come from `markers.json`, not from your editor

Coordinates measured at `scrollTop=0` in DevTools won't match the live page after a scroll. The recorder writes per-scene anchors into `markers.json` (see rules/03 → "Per-scene anchors"); read them in your scene component:

```tsx
import markers from "../public/markers.json";

export const SceneTop15: React.FC = () => {
  const a = markers.anchors.criticalItems;
  return (
    <FadeInOut totalFrames={SCENE_TIMINGS.criticalItems.duration} startDelay={50}>
      <PulseAnchor {...a.table} variant="critical" />
      <CalloutLabel x={a.firstRow.x + a.firstRow.width + 16} y={a.firstRow.y} title="Highest priority" variant="critical" />
    </FadeInOut>
  );
};
```

Hardcoded `x={60} y={520}` is a smell — it means the overlay isn't anchored to a real DOM element and will drift the moment the layout changes.

### One rect shape — never abbreviate

Always use the DOM-native shape `{ x, y, width, height }` everywhere: `markers.json` writes it, scene components read it, overlay components (`PulseBox`, `CalloutLabel`) accept it. **Do not** introduce shorter aliases like `{ x, y, w, h }` — spreading them silently produces `width: undefined, height: undefined` and overlay components render `0×0` boxes that you can't see. TypeScript won't catch it because the props type widens through `as any` casts inevitable in this code. The cure is to never need a converter helper in the first place.

## Big text panels are floating panels

`SectionTitle` / large hero captions / multi-line summaries that aren't anchored to a UI element are floating panels. They look amateurish on top of real product UI — the eye can't tell whether the text is referring to something, and if so, what.

Use them only over zones that are guaranteed empty:
- **Intro / outro scenes** sitting on top of a dimmer (`background: rgba(0,0,0,0.85)`)
- **Vignettes** with a known dark zone (top 200px or bottom 200px on most dashboards)
- **Black-letterbox transitions** between major scenes

Default for everything else: anchor a small chip (`DeltaChip`, `CalloutLabel`) to a specific UI element, position from that element's rect. Before shipping any scene with a `SectionTitle`, open the rendered preview frame and confirm it isn't sitting on top of something the voiceover refers to.

## Reusable overlay components

See the templates in [templates/](../templates/):

- **`Logo.tsx`** — fade-in + spring-scale logo
- **`CalloutLabel.tsx`** — card with title/subtitle, slide-in from the right, color by variant (default/critical/warning/success)
- **`CountUp.tsx`** — animated counter from A to B with easing, supports decimals/prefix/suffix
- **`PulseBox.tsx`** — outline around an element + pulsing copy (highlight in frame)

Overlay coordinates are in pixels relative to the 1920×1080 canvas.

## Studio (preview)

```bash
pnpm dev
# opens http://localhost:3000 (Remotion Studio)
```

In the studio:
- Scrub the timeline → see overlays layered on top
- Hot reload — edit coordinates in `Scene*.tsx` → updates in the browser
- "Render preview frame" button — exports the current frame as png

## Render

```bash
pnpm render
# → out/demo.mp4 — 1920×1080 mp4 without audio (~30–60s render time depending on length and complexity)
```

Render parameters in `remotion.config.ts`:
```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);  // parallel frame render
```

## Pitfalls

### `@remotion/cli` is mandatory
Without it `pnpm dev` / `pnpm render` fail with `command not found: remotion`. Always add it to dependencies.

### `@remotion/media` Video needs the file at start
If `public/recording.mp4` is missing — 404 with no graceful fallback. Fix:
- Run the Playwright recorder BEFORE `pnpm dev`
- Or hide the Video conditionally with a placeholder fallback (see template)

### Overlay coordinates drift
If the background recording has crop / different aspect ratio, your `Scene*.tsx` coordinates won't line up. Always record at 1920×1080 (or whatever resolution your Composition uses).

### Fonts don't load
Remotion renders server-side. Google Fonts aren't picked up automatically. Fix:
```tsx
import { loadFont } from "@remotion/google-fonts/Geist";
const { fontFamily } = loadFont();
// use fontFamily in style
```

### Slow renders
A 60s video @ 30fps = 1800 frames. Each frame has Chromium render JSX → screenshot. On an M-series Mac that's ~1 frame/sec = 30 minutes. Speed-ups:
- `Config.setConcurrency(8)` — more parallelism
- `--codec=h264-mkv` — faster than mp4
- Drop heavy effects (blur, large box-shadows)

## Live-URL digital zoom (no `useZoomScenes` hook)

When you can't inject the keyboard zoom hook into the page (staging, prod, third-party), record raw at full viewport and add the cinematic zooms in Remotion instead. Quality holds up to ~2.5× on a 1920p source — past that, lossy artifacts start showing.

Pattern: wrap `<OffthreadVideo>` in a div that animates `transform: scale(...) translate(...)` per scene.

```tsx
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { OffthreadVideo } from "remotion";

const ZoomedRecording: React.FC<{
  scale: number;
  ox: number; // origin x %, 0–100
  oy: number; // origin y %, 0–100
  duration: number;
}> = ({ scale, ox, oy, duration }) => {
  const frame = useCurrentFrame();
  // Ease in over the first 18 frames (0.6s @ 30fps), hold, ease back near the end
  const s = interpolate(
    frame,
    [0, 18, duration - 18, duration],
    [1, scale, scale, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${s})`,
          transformOrigin: `${ox}% ${oy}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile("recording.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// In the composition, replace the plain <Video> with one ZoomedRecording per scene:
<Sequence from={SCENE_TIMINGS.intro.from} durationInFrames={SCENE_TIMINGS.intro.duration}>
  <ZoomedRecording scale={1.0} ox={50} oy={50} duration={SCENE_TIMINGS.intro.duration} />
</Sequence>
<Sequence from={SCENE_TIMINGS.kpiHighlight.from} durationInFrames={SCENE_TIMINGS.kpiHighlight.duration}>
  <ZoomedRecording scale={2.0} ox={17} oy={2} duration={SCENE_TIMINGS.kpiHighlight.duration} />
</Sequence>
```

Trade-offs vs the in-page hook:
- ✅ Works on any URL, including ones you don't own
- ✅ Same overlay/voiceover pipeline applies as-is
- ❌ Pure digital zoom — no ground-truth pixel detail past the source resolution
- ❌ You give up the camera-style CSS easing the in-page hook gets for free; mimic it with `Easing.bezier(0.25, 0.1, 0.25, 1)` in `interpolate`

A ready-to-extend scene template is at `templates/scenes/SceneLiveZoom.tsx`.

## Iterating on overlays

Workflow:
1. `pnpm dev` — Remotion Studio open
2. Scrub to the frame you care about (e.g. 22s — alert scene)
3. Open `src/scenes/SceneAlert.tsx` in your editor
4. Move `x` / `y` coordinates of the CalloutLabel → hot reload shows the result
5. When it looks right, move on to the next scene

The edit loop for an overlay coordinate is ~30 seconds. The whole of phase 4 for a 60s video is 1–2 hours the first time, 20–30 minutes on later iterations.

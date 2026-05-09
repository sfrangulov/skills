---
name: 04-remotion-overlays
description: Remotion overlay project — intro/outro, callouts, count-up numbers, pulse highlights on top of mp4
---

# Remotion overlay project

## What it is

Remotion is a React framework for rendering video. You write components like normal React and render to mp4. The idea here: layer overlay graphics on top of the mp4 captured by Playwright.

**Related skill:** `remotion-video-creation` (29 detailed rules) — load it when you're working on the Remotion code.

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

**Important:** these timings must match the `durationMs` in the Playwright recorder (phase 3). If the recorder holds `key: "1"` for 8000ms, the Remotion overlay for scene 1 must be 8 seconds (240 frames).

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

## Iterating on overlays

Workflow:
1. `pnpm dev` — Remotion Studio open
2. Scrub to the frame you care about (e.g. 22s — alert scene)
3. Open `src/scenes/SceneAlert.tsx` in your editor
4. Move `x` / `y` coordinates of the CalloutLabel → hot reload shows the result
5. When it looks right, move on to the next scene

The edit loop for an overlay coordinate is ~30 seconds. The whole of phase 4 for a 60s video is 1–2 hours the first time, 20–30 minutes on later iterations.

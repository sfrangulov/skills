---
name: 03-playwright-recorder
description: Headless recording via Playwright — keyboard scenes, webm → mp4, idempotent script
---

# Playwright recorder

## What it does

A headless Chromium opens the HTML/URL, waits for mount, presses keys in sequence with delays, writes a webm, and converts it to mp4 via ffmpeg.

**Does not use** Screen Studio, OBS, native screen recording, or beauty cursor. This is just headless Chrome — Playwright captures the page's render directly, no UI overlays.

## Dependencies

```bash
pnpm add -D playwright tsx @types/node typescript
npx playwright install chromium
brew install ffmpeg  # if missing
```

## Basic script

```ts
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const DEMO_HTML = path.join(ROOT, "..", "..", "your-demo.html"); // or http://localhost:3000
const RECORDINGS_DIR = path.join(ROOT, "recordings");
const OUT_MP4 = path.join(ROOT, "public", "recording.mp4");

const SCENES = [
  { key: "1", durationMs: 8000, label: "Overview" },
  { key: "3", durationMs: 6000, label: "KPI" },
  { key: "4", durationMs: 8000, label: "Alert" },
  // ...
];

async function main() {
  rmSync(RECORDINGS_DIR, { recursive: true, force: true });
  mkdirSync(RECORDINGS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await page.goto(`file://${DEMO_HTML}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // warmup: React mount + map tiles + assets

  for (const scene of SCENES) {
    console.log(`🎬 [${scene.key}] ${scene.label}`);
    await page.keyboard.press(scene.key);
    await page.waitForTimeout(scene.durationMs);
  }

  await context.close();
  await browser.close();

  // webm → mp4
  const webm = path.join(RECORDINGS_DIR, readdirSync(RECORDINGS_DIR).find(f => f.endsWith(".webm"))!);
  execFileSync("ffmpeg", [
    "-y",
    "-i", webm,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-movflags", "+faststart",
    OUT_MP4,
  ], { stdio: "inherit" });

  console.log(`✅ ${OUT_MP4}`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

See the full version in [templates/record-demo.ts](../templates/record-demo.ts).

Run:
```bash
pnpm tsx scripts/record-demo.ts
# or via the npm script
pnpm record
```

## Timings

Pick `durationMs` for each scene so that:
1. **There's time to read the voiceover line** — usually 6–12 seconds per scene
2. **The zoom transition can finish** — CSS transition is 0.8s, so allow at least 2s after the keypress
3. **The total is close to the target video length** — for a 60s pipeline aim at 55–58s

Typical timings:
- Intro/Overview: 6–8s
- Mid scene with detail: 8–12s
- Action / animation reveal: 4–6s
- Outro: 2–3s

## webm → mp4 ffmpeg parameters

| Parameter | Value | Why |
|---|---|---|
| `-c:v libx264` | h264 | Compatible with every player |
| `-preset slow` | slow | Best compression, +20% encode time |
| `-crf 18` | 18 | Visually lossless. CRF 23 is the standard, 18 is for promo material |
| `-pix_fmt yuv420p` | yuv420p | Compatible with QuickTime, iOS, browser |
| `-r 30` | 30fps | Cinematic, saves space vs 60fps |
| `-movflags +faststart` | faststart | Moves moov atom to the start → streams without waiting for the full download |

For a **smaller file** (web): `-crf 23 -preset medium`. For **archive quality**: `-crf 15 -preset veryslow`.

## HUD scene indicator in the recording

For the production take you can hide the HUD with one line:
```ts
await page.addStyleTag({ content: `.scene-hud { display: none !important; }` });
```

Or leave it on as scene markers — `1` `2` `3` show up in the corner and help you align the voiceover in Audacity (visible on the timeline).

## Common issues

### `command not found: remotion`
`@remotion/cli` must be in `package.json` (not just `remotion`). Without that package the binary isn't installed.

### Recording is empty / black
- Check that `viewport` matches `recordVideo.size`
- Make sure `await page.goto(...)` waited for `networkidle` (not `domcontentloaded`)
- Increase warmup to 5s for heavy pages with maps / charts

### Fonts look jagged
Headless Chromium sometimes starts rendering before fonts are ready:
```ts
await page.evaluate(() => document.fonts.ready);
```
Run this after `goto`.

### MapLibre / Leaflet tiles haven't loaded yet
The map renders incrementally. The first seconds of the recording will have white squares. Fixes:
1. Increase warmup `waitForTimeout(5000)`
2. Wait for a specific element: `await page.waitForSelector('.maplibregl-canvas')`
3. Wait for network idle: `waitUntil: "networkidle"` is already set and helps

### TypeScript: `__dirname` undefined in ESM
If the project is ESM (`"type": "module"` in `package.json`):
```ts
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

## Idempotency

The script is safe to re-run — it:
1. Removes `recordings/` first
2. Overwrites the output mp4
3. Has no global state

That lets you iterate `change SCENES → re-record → check` in 60–90 seconds.

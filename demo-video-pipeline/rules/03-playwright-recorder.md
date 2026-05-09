---
name: 03-playwright-recorder
description: Headless recording via Playwright — keyboard scenes, webm → mp4, idempotent script
---

# Playwright recorder

## ⚠️ Load `playwright-best-practices` first

Before writing any code in this phase, invoke the Skill tool to load `playwright-best-practices`. This rule file covers the recording-specific patterns; that skill covers the rest of Playwright (locators, auto-waiting strategy, network mocking, debugging, CI). The two are complementary — skip the load and you will reinvent things badly.

## What it does

A headless Chromium opens the HTML/URL, waits for mount, presses keys in sequence with delays, writes a webm, and converts it to mp4 via ffmpeg.

**Does not use** Screen Studio, OBS, native screen recording, or beauty cursor. This is just headless Chrome — Playwright captures the page's render directly, no UI overlays.

## Reconnoiter the page first (Playwright MCP)

Before writing a single line of recorder code, walk the live page through the Playwright MCP server. Click the same buttons the recorder will press, screenshot the resulting layouts, copy the actual selectors, and time how long each panel takes to fill with real data. Two reasons:

1. **Selectors lie**. The thing you'd guess from the design (`.kpi-card`) is rarely what the code shipped (`[data-testid="metric-tile"]`). Twenty seconds in MCP saves three failed recordings.
2. **Some drill-downs have no data**. Before spending 30 minutes waiting for a sparkline to render, confirm the row you're targeting actually has values. Empty states render fast and look terrible.

Pattern: MCP-walk → write `SCENES` → write recorder → record. Skip the walk and you'll burn 2–3 iterations rediscovering this.

## Open at the entry, not the deep link

Tempting: `page.goto("/dashboard/fleet/alert/42")`. Result: a 60-second video that opens *inside* a feature, with no context.

Better: `page.goto("/")` → click a nav item → click into the alert. Three extra seconds and the video reads as a guided tour instead of a hard cut. Voiceover gets a place to set up the "what is this product" line before the first KPI.

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

## Waiting on real SPAs (the hard part)

For static demo HTML you can get away with `page.goto(url, { waitUntil: "networkidle" })` + `waitForTimeout(3000)`. Real SPAs need a different strategy.

### `networkidle` is a trap on chat / SSE / polling apps

`networkidle` waits for 500ms of zero network activity. Chat sockets, server-sent events, telemetry, and 30-second polls never go quiet, so the wait either times out or returns at random when the network briefly stalls. Use:

```ts
await page.goto(url, { waitUntil: "commit" });   // just wait for the response headers
// then explicitly wait for what you actually care about:
await page.waitForFunction(
  () => /3,06.*hours/.test(document.body.innerText),
  null,
  { timeout: 90000 },
);
```

### Anchor on a value, not a heading

Headings, nav labels and section titles render before the data — they're part of the skeleton. Wait for a substring of the **actual KPI value** ("3.06 hours", "$1,247", "95.2%"). When that string appears the panel is genuinely populated.

### `page.waitForFunction` arg gotcha

```ts
// ❌ WRONG — { timeout } is treated as the predicate's input, default 30s applies
await page.waitForFunction(fn, { timeout: 90000 });

// ✅ RIGHT — arg goes second, options third
await page.waitForFunction(fn, null, { timeout: 90000 });
```

This silently fails on every data-heavy page. The check passes locally where you've cached a build, then fails in CI / on cold renders. **Always pass `null` (or the real arg) as the second positional.**

### Headless renders 5–10× slower than headed for KPI-heavy dashboards

Same machine, same code, same network — pure rendering cost. Charts, virtualised tables, big data grids all take longer to paint when there's no display. Two strategies:

1. **Bigger timeouts** — start at `90000` and raise as needed. Better than trying to "speed up the page".
2. **Record everything and trim later** — give yourself a generous head buffer, write timestamps to `markers.json` (see below), and slice with `ffmpeg -ss` after the fact instead of fighting waits.

### `storageState` doesn't warm React state

A common (failed) optimization: log in once, save `storageState`, reuse across runs to "warm" the page. It works for cookies and localStorage, but the React app, the data fetch, the Suspense boundaries — all start cold every time you open a new context. There is no way to skip the first paint. Accept it and either trim the head in ffmpeg or include the load as a "loading…" beat in the video.

### String-eval is forbidden inside `page.evaluate`

Hardened sandboxes (and the Anthropic security hook) block dynamic-code constructors. Pass real closures only:

```ts
// ❌ Will be rejected
await page.evaluate(`window.foo()`);

// ✅ Works — real closure, captured from the outer scope
const target = ".kpi-card";
await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView(), target);
```

## Smooth scroll for hidden content

SPAs often hide 70%+ of a page inside `overflow: auto` containers. Scrolling them by hand looks great on camera. Use the helper bundled in `templates/record-demo.ts`:

```ts
async function smoothScroll(page, selector, deltaY, durationMs) {
  await page.evaluate(
    ({ sel, dy, dur }) => new Promise<void>((resolve) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (!el) return resolve();
      const start = el.scrollTop;
      const t0 = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        el.scrollTop = start + dy * (1 - Math.cos(Math.PI * t)) / 2;
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    }),
    { sel: selector, dy: deltaY, dur: durationMs },
  );
}

// usage
await smoothScroll(page, ".right-panel", 600, 4000);
```

Cosine-eased, so the start and end feel like a camera move, not a `scrollTo`. A 4-second smooth scroll is itself a usable scene.

## markers.json — single source of truth for timings

Instead of hand-syncing `durationMs` in the recorder with `SCENE_TIMINGS` in Remotion, the recorder writes a `public/markers.json` with the actual timestamps of every scene boundary. Remotion reads it and derives all `from` / `durationInFrames` values. Two big wins:

1. No drift between phase 3 and phase 4 — they share the same numbers.
2. You can ship `headTrimMs` in the same file. Trim the boring head in ffmpeg, set `headTrimMs`, and every scene shifts automatically.

See `templates/markers.json` for the schema and `rules/04` for how Remotion consumes it.

## Common issues

### `command not found: remotion`
`@remotion/cli` must be in `package.json` (not just `remotion`). Without that package the binary isn't installed.

### Recording is empty / black
- Check that `viewport` matches `recordVideo.size`
- For static demo HTML, `waitUntil: "networkidle"` is fine; for live SPAs use `"commit"` + an explicit `waitForFunction` (see "Waiting on real SPAs" above)
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
3. Wait for an actual rendered tile via `waitForFunction` checking image counts inside the canvas wrapper

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

/**
 * Playwright headless recorder.
 *
 * Drives keyboard scenes (or clicks/scrolls) in your demo HTML/URL,
 * records video at 1920x1080, transcodes webm → mp4 via ffmpeg, and
 * writes public/markers.json so the Remotion composition can read scene
 * timings AND per-scene DOM anchor rects as ground truth.
 *
 * Usage:
 *   pnpm tsx scripts/record-demo.ts
 *
 * Configure SCENES + DEMO_TARGET below.
 */
import { chromium, type Page } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

// EITHER local HTML file:
const DEMO_TARGET = `file://${path.resolve(ROOT, "..", "..", "your-demo.html")}`;
// OR live URL:
// const DEMO_TARGET = "http://localhost:3000";

const RECORDINGS_DIR = path.join(ROOT, "recordings");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_MP4 = path.join(PUBLIC_DIR, "recording.mp4");
const MARKERS_JSON = path.join(PUBLIC_DIR, "markers.json");

const FPS = 30;
const VIEWPORT = { width: 1920, height: 1080 };

type Rect = { x: number; y: number; width: number; height: number };
type SceneAnchors = Record<string, Rect>;

type Scene = {
  /** Stable id used by markers.json + Remotion timing.ts. */
  id: string;
  /** Keyboard key to press (when using the in-page useZoomScenes hook). */
  key?: string;
  /** Hold this scene for N ms before advancing. */
  durationMs: number;
  /** Human-readable label for the console log. */
  label: string;
};

const SCENES: Scene[] = [
  { id: "intro",           key: "1", durationMs: 8000,  label: "Overview" },
  { id: "kpiHighlight",    key: "3", durationMs: 6000,  label: "KPI tight zoom" },
  { id: "alertHighlight",  key: "4", durationMs: 8000,  label: "Top alert" },
  { id: "scenarioCountUp", key: "7", durationMs: 6000,  label: "Scenario params" },
  { id: "cascadePulse",    key: "8", durationMs: 8000,  label: "Scenario results" },
  { id: "diagnostic",      key: "5", durationMs: 12000, label: "Recommendations panel" },
  { id: "outro",           key: "1", durationMs: 2000,  label: "Outro — back to overview" },
];

/* ─────────────────────────────────────────────────────────────
 * smoothScrollStatic — direct scrollTop animation with a cosine ease.
 * Use on STATIC HTML demos. On real React/Vue/Svelte SPAs, React
 * resets scrollTop on re-render — use wheelScrollSpa instead.
 * ───────────────────────────────────────────────────────────── */
async function smoothScrollStatic(
  page: Page,
  selector: string,
  deltaY: number,
  durationMs: number,
) {
  await page.evaluate(
    ({ sel, dy, dur }) =>
      new Promise<void>((resolve) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return resolve();
        const start = el.scrollTop;
        const t0 = performance.now();
        const tick = () => {
          const t = Math.min(1, (performance.now() - t0) / dur);
          // cosine ease-in-out
          el.scrollTop = start + dy * (1 - Math.cos(Math.PI * t)) / 2;
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      }),
    { sel: selector, dy: deltaY, dur: durationMs },
  );
}

/* ─────────────────────────────────────────────────────────────
 * wheelScrollSpa — synthetic wheel events. Use on REAL SPAs.
 * Native wheel events fire on whatever scroll-container is under the
 * cursor and aren't fought by React's render cycle.
 * ───────────────────────────────────────────────────────────── */
async function wheelScrollSpa(
  page: Page,
  selectorForCursor: string,
  totalDeltaY: number,
  opts: { steps?: number; perStepMs?: number } = {},
) {
  const { steps = 30, perStepMs = 50 } = opts;
  // Move the cursor inside the target so wheel events hit the right container.
  const box = await page.locator(selectorForCursor).first().boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
  }
  const stepDelta = totalDeltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepDelta);
    await page.waitForTimeout(perStepMs);
  }
}

/* ─────────────────────────────────────────────────────────────
 * waitForKpi — robust wait for SPA-style data fetches.
 * - waitUntil: "commit" because networkidle never fires on socket apps
 * - waitForFunction with explicit (fn, null, { timeout }) — the second
 *   positional is the predicate's input, not options. The 30s default
 *   bites silently.
 * - Anchor on a real value substring, not on a heading.
 * ───────────────────────────────────────────────────────────── */
async function waitForKpi(
  page: Page,
  pattern: RegExp,
  timeoutMs = 90_000,
) {
  await page.waitForFunction(
    (src) => new RegExp(src).test(document.body.innerText),
    pattern.source,
    { timeout: timeoutMs },
  );
}

/* ─────────────────────────────────────────────────────────────
 * captureRect — measure a DOM element and return its rect in the
 * full DOM shape ({x, y, width, height}). Always use the full shape
 * — never abbreviate to {w, h}; PulseBox / CalloutLabel and everything
 * downstream expects width/height, and silent 0×0 boxes are the
 * single highest-friction footgun in the pipeline.
 * ───────────────────────────────────────────────────────────── */
async function captureRect(page: Page, selector: string): Promise<Rect | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      x: Math.round(b.x),
      y: Math.round(b.y),
      width: Math.round(b.width),
      height: Math.round(b.height),
    };
  }, selector);
}

async function main() {
  rmSync(RECORDINGS_DIR, { recursive: true, force: true });
  mkdirSync(RECORDINGS_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });

  console.log(`▶ Target: ${DEMO_TARGET}`);
  console.log(`▶ Output: ${OUT_MP4}`);

  // recordVideo starts the moment we open the page; capture the time stamp
  // BEFORE that so we can write headTrimMs into markers.json and shift every
  // scene start in Remotion automatically. No ffmpeg trim needed.
  const videoStart = Date.now();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();

  // tsx (esbuild) injects __name(fn, "name") helpers into compiled closures
  // so stack traces stay readable. Playwright stringifies the closure when it
  // ships it to the browser — but __name isn't defined on the page side, and
  // every page.evaluate({a, b}) => ...) blows up with "ReferenceError: __name
  // is not defined". Stub it as a passthrough at session start.
  await page.addInitScript(() => {
    (globalThis as any).__name = (fn: any) => fn;
  });

  // For static demo HTML, "networkidle" works fine. For real SPAs use
  // "commit" + an explicit waitForKpi() on a value substring.
  const isLocalHtml = DEMO_TARGET.startsWith("file://");
  await page.goto(DEMO_TARGET, {
    waitUntil: isLocalHtml ? "networkidle" : "commit",
  });

  // Wait for fonts & React mount
  await page.evaluate(() => document.fonts.ready);

  if (isLocalHtml) {
    await page.waitForTimeout(3000);
  } else {
    // Example: wait for a real KPI value to appear in the DOM.
    // Customise the pattern to a substring of a value you know is on the page.
    // await waitForKpi(page, /3,06.*hours/);
    await page.waitForTimeout(3000);
  }

  // Optional: hide HUD scene indicator before recording
  // await page.addStyleTag({ content: `.scene-hud { display: none !important; }` });

  // Markers track the actual start time of each scene in ms relative to
  // the scenes (NOT relative to the recording — headTrimMs handles that).
  const recordStart = Date.now();
  const headTrimMs = recordStart - videoStart;
  console.log(`✓ pre-roll captured: headTrimMs = ${headTrimMs}ms`);

  const markers: { id: string; startMs: number; durationMs: number }[] = [];
  const anchors: Record<string, SceneAnchors> = {};

  for (const scene of SCENES) {
    const startMs = Date.now() - recordStart;
    console.log(`🎬 [${scene.id}] ${scene.label} (${scene.durationMs}ms)`);
    if (scene.key) await page.keyboard.press(scene.key);

    // Example: capture per-scene anchors for scenes that have specific
    // DOM elements you want overlays to attach to. Run this AFTER the
    // page settles (post-scroll, post-tab-switch), not at scene start.
    //
    //   if (scene.id === "diagnostic") {
    //     await wheelScrollSpa(page, "main", 1100);
    //     await page.waitForTimeout(800);
    //     anchors[scene.id] = {
    //       table: (await captureRect(page, '[aria-label="Top 15"] table'))!,
    //       firstRow: (await captureRect(page, '[aria-label="Top 15"] tbody tr'))!,
    //     };
    //   }

    await page.waitForTimeout(scene.durationMs);
    markers.push({ id: scene.id, startMs, durationMs: scene.durationMs });
  }

  const totalDurationMs = Date.now() - recordStart;

  await context.close();
  await browser.close();

  // Write markers.json — Remotion composition will read this.
  writeFileSync(
    MARKERS_JSON,
    JSON.stringify(
      {
        fps: FPS,
        headTrimMs,
        totalDurationMs,
        scenes: markers,
        anchors,
      },
      null,
      2,
    ),
  );
  console.log(`✓ markers written: ${MARKERS_JSON}`);

  const webms = readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".webm"));
  if (webms.length === 0) throw new Error("No .webm recording found");
  const webm = path.join(RECORDINGS_DIR, webms[0]);
  const size = statSync(webm).size;
  console.log(`✓ webm captured: ${(size / 1e6).toFixed(1)} MB`);

  console.log(`🔄 Transcoding to mp4 (h264, CRF 18, ${FPS}fps, +faststart)...`);
  const tmpMp4 = path.join(RECORDINGS_DIR, "out.mp4");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", webm,
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-r", String(FPS),
      "-movflags", "+faststart",
      tmpMp4,
    ],
    { stdio: "inherit" },
  );

  renameSync(tmpMp4, OUT_MP4);
  console.log(`✅ Done: ${OUT_MP4}`);
}

// Re-export helpers so they can be imported into other recorder scripts.
export { smoothScrollStatic, wheelScrollSpa, waitForKpi, captureRect };

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

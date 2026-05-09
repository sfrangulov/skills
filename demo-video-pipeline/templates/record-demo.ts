/**
 * Playwright headless recorder.
 *
 * Drives keyboard scenes in your demo HTML/URL, records video at 1920x1080,
 * transcodes webm → mp4 via ffmpeg.
 *
 * Usage:
 *   pnpm tsx scripts/record-demo.ts
 *
 * Configure SCENES + DEMO_HTML/URL below.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

// EITHER local HTML file:
const DEMO_TARGET = `file://${path.resolve(ROOT, "..", "..", "your-demo.html")}`;
// OR live URL:
// const DEMO_TARGET = "http://localhost:3000";

const RECORDINGS_DIR = path.join(ROOT, "recordings");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_MP4 = path.join(PUBLIC_DIR, "recording.mp4");

type Scene = { key: string; durationMs: number; label: string };

const SCENES: Scene[] = [
  { key: "1", durationMs: 8000,  label: "Overview" },
  { key: "3", durationMs: 6000,  label: "KPI tight zoom" },
  { key: "4", durationMs: 8000,  label: "Top alert" },
  { key: "7", durationMs: 6000,  label: "Scenario params" },
  { key: "8", durationMs: 8000,  label: "Scenario results" },
  { key: "5", durationMs: 12000, label: "Recommendations panel" },
  { key: "9", durationMs: 10000, label: "Diagnostics" },
  { key: "1", durationMs: 2000,  label: "Outro — back to overview" },
];

async function main() {
  rmSync(RECORDINGS_DIR, { recursive: true, force: true });
  mkdirSync(RECORDINGS_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });

  console.log(`▶ Target: ${DEMO_TARGET}`);
  console.log(`▶ Output: ${OUT_MP4}`);

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
  await page.goto(DEMO_TARGET, { waitUntil: "networkidle" });

  // Wait for fonts & React mount
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3000);

  // Optional: hide HUD scene indicator before recording
  // await page.addStyleTag({ content: `.scene-hud { display: none !important; }` });

  for (const scene of SCENES) {
    console.log(`🎬 [${scene.key}] ${scene.label} (${scene.durationMs}ms)`);
    await page.keyboard.press(scene.key);
    await page.waitForTimeout(scene.durationMs);
  }

  await context.close();
  await browser.close();

  const webms = readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".webm"));
  if (webms.length === 0) throw new Error("No .webm recording found");
  const webm = path.join(RECORDINGS_DIR, webms[0]);
  const size = statSync(webm).size;
  console.log(`✓ webm captured: ${(size / 1e6).toFixed(1)} MB`);

  console.log(`🔄 Transcoding to mp4 (h264, CRF 18, 30fps, +faststart)...`);
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
      "-r", "30",
      "-movflags", "+faststart",
      tmpMp4,
    ],
    { stdio: "inherit" },
  );

  renameSync(tmpMp4, OUT_MP4);
  console.log(`✅ Done: ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Single source of truth for scene timings. Place at src/timing.ts.
 *
 * Two ways to use this file. Pick one.
 *
 * --- Option A: hand-written (this file as-is) ---
 *
 * Keep these in sync with `durationMs` in scripts/record-demo.ts. If a
 * scene in the recorder is 8000ms, the matching entry here is sec(8).
 * Simple, but drifts whenever you tweak the recorder.
 *
 * --- Option B: derive from public/markers.json (recommended) ---
 *
 * The recorder writes scene timings to public/markers.json after every
 * take. Remotion reads it and derives this whole map automatically.
 * No drift. To switch, replace the body below with:
 *
 *   import markers from "../public/markers.json";
 *   const FPS = markers.fps;
 *   const msToFrames = (ms: number) =>
 *     Math.round((ms - markers.headTrimMs) / 1000 * FPS);
 *
 *   export { FPS };
 *   export const SCENE_TIMINGS = Object.fromEntries(
 *     markers.scenes.map((s) => {
 *       const from = msToFrames(s.startMs);
 *       const end = msToFrames(s.startMs + s.durationMs);
 *       return [s.id, { from, duration: end - from }];
 *     }),
 *   ) as Record<string, { from: number; duration: number }>;
 *
 * See rules/04 for details and rules/03 for how the recorder writes markers.
 */
export const FPS = 30;

const sec = (s: number) => s * FPS;

export const SCENE_TIMINGS = {
  intro:           { from: sec(0),  duration: sec(8) },

  // Add more scenes following the same pattern. Example layout for a 60s reel:
  // kpiHighlight:    { from: sec(8),  duration: sec(6) },
  // alertHighlight:  { from: sec(14), duration: sec(8) },
  // scenarioCountUp: { from: sec(22), duration: sec(14) },
  // cascadePulse:    { from: sec(36), duration: sec(12) },
  // diagnostic:      { from: sec(48), duration: sec(10) },
  // outro:           { from: sec(58), duration: sec(2) },
} as const;

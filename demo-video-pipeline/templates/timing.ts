/**
 * Single source of truth for scene timings. Place at src/timing.ts.
 *
 * IMPORTANT: keep these in sync with `durationMs` in scripts/record-demo.ts.
 * If a scene in the recorder is 8000ms, the matching entry here should be
 * `duration: sec(8)`.
 *
 * The keys here are referenced from src/DemoComposition.tsx — add a new
 * entry whenever you add a new scene.
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

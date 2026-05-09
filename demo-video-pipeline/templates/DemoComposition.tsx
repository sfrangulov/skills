/**
 * Main Remotion composition. Place at src/DemoComposition.tsx.
 *
 * Renders the Playwright recording as a background layer, then drops
 * overlay <Sequence> blocks on top — one per scene. Out of the box this
 * template only ships Scene1Intro so the project builds. Add your own
 * scenes (Scene2KpiHighlight, Scene3AlertHighlight, …) under src/scenes/
 * and register them below following the same pattern.
 *
 * Keep SCENE_TIMINGS in src/timing.ts in sync with `durationMs` in
 * scripts/record-demo.ts — they describe the same timeline.
 */
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { SCENE_TIMINGS } from "./timing";
import { Scene1Intro } from "./scenes/Scene1Intro";

const BACKGROUND_VIDEO = "recording.mp4";

export const DemoComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Video
        src={staticFile(BACKGROUND_VIDEO)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <Sequence
        from={SCENE_TIMINGS.intro.from}
        durationInFrames={SCENE_TIMINGS.intro.duration}
        premountFor={30}
      >
        <Scene1Intro />
      </Sequence>

      {/*
        Add more scenes by importing them and adding a <Sequence> block
        like the one above. Example:

          import { Scene2KpiHighlight } from "./scenes/Scene2KpiHighlight";

          <Sequence
            from={SCENE_TIMINGS.kpiHighlight.from}
            durationInFrames={SCENE_TIMINGS.kpiHighlight.duration}
            premountFor={30}
          >
            <Scene2KpiHighlight />
          </Sequence>

        `premountFor={30}` mounts the scene component 1 second early so any
        font / image assets are warm before its first visible frame.
      */}
    </AbsoluteFill>
  );
};

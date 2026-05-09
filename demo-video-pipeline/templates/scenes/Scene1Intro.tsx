/**
 * Skeleton intro scene. Place at src/scenes/Scene1Intro.tsx.
 *
 * This is intentionally minimal so the project builds and renders the
 * moment you copy the templates over. Replace with your own brand intro:
 * background flash, animated logo lockup, tagline, etc.
 *
 * Pattern: every scene is a self-contained React component. Animations use
 * useCurrentFrame() + interpolate()/spring() — never CSS transitions
 * (Remotion renders frame-by-frame and CSS animations don't apply).
 */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { COLORS, FONT_STACK } from "../theme";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade-in, then fade-out near the end of the scene
  const bgOpacity = interpolate(
    frame,
    [0, 0.5 * fps, 6 * fps, 7 * fps],
    [0, 0.85, 0.85, 0],
    { extrapolateRight: "clamp" },
  );

  // Tagline slides up after the logo settles
  const taglineEnter = spring({
    frame: frame - 0.8 * fps,
    fps,
    config: { damping: 20, stiffness: 140 },
  });

  return (
    <AbsoluteFill>
      {/* Dim background panel that fades in over the recording */}
      <AbsoluteFill style={{ background: COLORS.bg, opacity: bgOpacity }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Logo />
        <div
          style={{
            marginTop: 32,
            fontFamily: FONT_STACK,
            fontSize: 28,
            color: COLORS.textMuted,
            opacity: interpolate(taglineEnter, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(taglineEnter, [0, 1], [16, 0])}px)`,
          }}
        >
          {/* TODO: replace with your tagline */}
          Your product tagline here
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Highlight an element with a static border + pulsing copy that fades out.
 * Place at src/components/PulseBox.tsx.
 */
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

type Variant = "default" | "critical" | "warning" | "success";

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: Variant;
};

const VARIANT_COLORS: Record<Variant, string> = {
  default: COLORS.accent,
  critical: COLORS.critical,
  warning: COLORS.warning,
  success: COLORS.success,
};

export const PulseBox: React.FC<Props> = ({ x, y, width, height, variant = "default" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulsePhase = (frame % (1.5 * fps)) / (1.5 * fps);
  const pulseScale = interpolate(pulsePhase, [0, 1], [1, 1.08]);
  const pulseOpacity = interpolate(pulsePhase, [0, 1], [0.8, 0]);
  const color = VARIANT_COLORS[variant];

  return (
    <>
      <div
        style={{
          position: "absolute", top: y, left: x, width, height,
          border: `3px solid ${color}`, borderRadius: 12, boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute", top: y, left: x, width, height,
          border: `3px solid ${color}`, borderRadius: 12, boxSizing: "border-box",
          transform: `scale(${pulseScale})`, transformOrigin: "center",
          opacity: pulseOpacity,
        }}
      />
    </>
  );
};

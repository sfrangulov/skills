/**
 * Animated number counter (e.g. 0 → 100, 75% → 105%).
 * Place at src/components/CountUp.tsx.
 */
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../theme";

type Props = {
  from: number;
  to: number;
  durationSeconds?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
};

export const CountUp: React.FC<Props> = ({
  from,
  to,
  durationSeconds = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  fontSize = 96,
  color = COLORS.text,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const value = interpolate(frame, [0, durationSeconds * fps], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        color,
        fontFamily: FONT_STACK,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
};

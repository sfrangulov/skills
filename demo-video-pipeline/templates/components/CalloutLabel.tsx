/**
 * Slide-in callout label with variant colors.
 * Place at src/components/CalloutLabel.tsx.
 */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../theme";

type Variant = "default" | "critical" | "warning" | "success";

type Props = {
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  variant?: Variant;
};

const VARIANT_COLORS: Record<Variant, string> = {
  default: COLORS.accent,
  critical: COLORS.critical,
  warning: COLORS.warning,
  success: COLORS.success,
};

export const CalloutLabel: React.FC<Props> = ({
  title,
  subtitle,
  x,
  y,
  variant = "default",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 150 } });
  const opacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        opacity,
        transform: `translateX(${interpolate(enter, [0, 1], [-20, 0])}px)`,
        fontFamily: FONT_STACK,
        background: COLORS.bgPanel,
        backdropFilter: "blur(8px)",
        border: `1px solid ${VARIANT_COLORS[variant]}`,
        borderLeft: `4px solid ${VARIANT_COLORS[variant]}`,
        borderRadius: 8,
        padding: "16px 24px",
        maxWidth: 480,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.text, marginBottom: subtitle ? 6 : 0 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 16, color: COLORS.textMuted }}>{subtitle}</div>}
    </div>
  );
};

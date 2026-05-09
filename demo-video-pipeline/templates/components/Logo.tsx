/**
 * Brand logo with fade-in + spring scale animation.
 * Place at src/components/Logo.tsx. Customize text/icon for your brand.
 */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../theme";

type Props = {
  size?: number;
  showTagline?: boolean;
  brandName?: string;
  tagline?: string;
};

export const Logo: React.FC<Props> = ({
  size = 64,
  showTagline = false,
  brandName = "ACME",
  tagline = "Analytics platform",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        opacity, transform: `scale(${scale})`, fontFamily: FONT_STACK,
      }}
    >
      <div style={{ fontSize: size, fontWeight: 700, letterSpacing: -2, color: COLORS.text }}>
        {brandName}
      </div>
      {showTagline && (
        <div
          style={{
            fontSize: size / 3, color: COLORS.textMuted,
            letterSpacing: 1, textTransform: "uppercase",
          }}
        >
          {tagline}
        </div>
      )}
    </div>
  );
};

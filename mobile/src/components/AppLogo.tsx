import Svg, { Path } from "react-native-svg";
import { colors } from "../theme";

type Props = {
  size?: number;
  color?: string;
  accent?: string;
};

/**
 * SkillBite mark: rounded short tile + play, with a bite cut from the right edge.
 * Uses evenodd so the cutout works without Mask (more reliable on RN).
 */
export function AppLogo({
  size = 96,
  color = colors.accent,
  accent = colors.accentInk,
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityLabel="SkillBite"
    >
      {/* Rounded square + bite circle (evenodd punches the hole) */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="
          M19 8
          h26
          a11 11 0 0 1 11 11
          v26
          a11 11 0 0 1 -11 11
          H19
          a11 11 0 0 1 -11 -11
          V19
          a11 11 0 0 1 11 -11
          Z
          M58 32
          m-10.5 0
          a10.5 10.5 0 1 0 21 0
          a10.5 10.5 0 1 0 -21 0
          Z
        "
      />
      {/* Play — weighted left of center so it sits in the solid area */}
      <Path fill={accent} d="M24.5 22.5v19l15.5-9.5-15.5-9.5z" />
    </Svg>
  );
}

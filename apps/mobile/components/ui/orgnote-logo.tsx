/**
 * Renders the OrgNote mark — keep in sync with `apps/web/public/logo.svg`.
 * A copy lives at `apps/mobile/assets/images/logo.svg` for reference; update both when the brand asset changes.
 */
import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";

type OrgNoteLogoProps = {
  size?: number;
};

export function OrgNoteLogo({ size = 32 }: OrgNoteLogoProps) {
  const gid = useId().replace(/:/g, "");
  const gradId = `orgnoteLogoGrad_${gid}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" accessibilityLabel="OrgNote">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#4F46E5" />
          <Stop offset="100%" stopColor="#06B6D4" />
        </LinearGradient>
      </Defs>
      <Rect x={20} y={20} width={180} height={180} rx={40} fill={`url(#${gradId})`} />
      <Rect x={65} y={55} width={90} height={110} rx={12} fill="white" />
      <Polygon points="135,55 155,75 135,75" fill="#E5E7EB" />
      <Circle cx={110} cy={95} r={8} fill="#4F46E5" />
      <Circle cx={90} cy={125} r={6} fill="#06B6D4" />
      <Circle cx={130} cy={125} r={6} fill="#06B6D4" />
      <Line x1={110} y1={95} x2={90} y2={125} stroke="#4F46E5" strokeWidth={2} />
      <Line x1={110} y1={95} x2={130} y2={125} stroke="#4F46E5" strokeWidth={2} />
    </Svg>
  );
}

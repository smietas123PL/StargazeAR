import { StyleSheet, View } from '../utils/reactNative';
import Svg, { Circle, Line } from 'react-native-svg';

import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';

type CenterReticleProps = {
  dimmed?: boolean;
  focusActive?: boolean;
};

const RETICLE_SIZE = 52;
const CENTER = RETICLE_SIZE / 2;
const MAIN_RING_RADIUS = 18;
const OUTER_RING_RADIUS = 24;
const SEGMENT_OUTER_OFFSET = 5;
const SEGMENT_INNER_OFFSET = 10;
const DOT_RADIUS = 1.5;

function getReticleOpacity(dimmed: boolean, focusActive: boolean) {
  if (dimmed && focusActive) {
    return 0.58;
  }

  if (focusActive) {
    return 0.72;
  }

  if (dimmed) {
    return 0.82;
  }

  return 1;
}

export default function CenterReticle({
  dimmed = false,
  focusActive = false,
}: CenterReticleProps) {
  const { theme } = useTheme();
  const opacity = getReticleOpacity(dimmed, focusActive);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.root}
      pointerEvents="none"
    >
      <Svg
        accessible={false}
        width={RETICLE_SIZE}
        height={RETICLE_SIZE}
        opacity={opacity}
      >
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RING_RADIUS}
          fill="none"
          stroke={theme.reticleOuterRing}
          strokeWidth={0.8}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={MAIN_RING_RADIUS}
          fill="none"
          stroke={theme.reticleMainRing}
          strokeWidth={1.1}
        />

        <Line
          x1={CENTER}
          y1={SEGMENT_OUTER_OFFSET}
          x2={CENTER}
          y2={SEGMENT_INNER_OFFSET}
          stroke={theme.reticleSegment}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Line
          x1={CENTER}
          y1={RETICLE_SIZE - SEGMENT_OUTER_OFFSET}
          x2={CENTER}
          y2={RETICLE_SIZE - SEGMENT_INNER_OFFSET}
          stroke={theme.reticleSegment}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Line
          x1={SEGMENT_OUTER_OFFSET}
          y1={CENTER}
          x2={SEGMENT_INNER_OFFSET}
          y2={CENTER}
          stroke={theme.reticleSegment}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Line
          x1={RETICLE_SIZE - SEGMENT_OUTER_OFFSET}
          y1={CENTER}
          x2={RETICLE_SIZE - SEGMENT_INNER_OFFSET}
          y2={CENTER}
          stroke={theme.reticleSegment}
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        <Circle cx={CENTER} cy={CENTER} r={DOT_RADIUS} fill={theme.reticleDot} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.arOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

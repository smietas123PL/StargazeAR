import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from '../utils/reactNative';
import Svg, { Path } from 'react-native-svg';

import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';

import type { ProjectedConstellation } from '../types';

type EdgePointerProps = {
  target: ProjectedConstellation | null;
};

const EDGE_INSET = 30;
const POINTER_DISTANCE_FACTOR = 0.92;

function clampMagnitude(value: number, fallback: number) {
  return Number.isFinite(value) && value !== 0 ? value : fallback;
}

export default function EdgePointer({ target }: EdgePointerProps) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();

  if (!target) {
    return null;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const deltaX = target.centerScreen.x - centerX;
  const deltaY = target.centerScreen.y - centerY;
  const isOffScreen =
    target.centerScreen.x < 0 ||
    target.centerScreen.x > width ||
    target.centerScreen.y < 0 ||
    target.centerScreen.y > height;

  if (!isOffScreen) {
    return null;
  }

  const halfWidth = width / 2 - EDGE_INSET;
  const halfHeight = height / 2 - EDGE_INSET;
  const ratioX = halfWidth / Math.abs(clampMagnitude(deltaX, 1));
  const ratioY = halfHeight / Math.abs(clampMagnitude(deltaY, 1));
  const scale = Math.min(ratioX, ratioY) * POINTER_DISTANCE_FACTOR;
  const pointerX = centerX + deltaX * scale;
  const pointerY = centerY + deltaY * scale;
  const angleDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

  return (
    <View style={styles.root} pointerEvents="none">
      <View
        style={[
          styles.pointerShell,
          {
            left: pointerX - 42,
            top: pointerY - 34,
            transform: [{ rotate: `${angleDeg}deg` }],
          },
        ]}
      >
        <Svg width={84} height={68} viewBox="0 0 84 68">
          <Path
            d="M16 34H55"
            stroke={theme.accent}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M54 20L68 34L54 48"
            fill="none"
            stroke={theme.accent}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View
        style={[
          styles.label,
          {
            left: pointerX - 76,
            top: pointerY + 22,
            backgroundColor: theme.overlay,
            borderColor: theme.borderStrongSubtle,
          },
        ]}
      >
        <Text style={[styles.labelText, { color: theme.title }]}>
          {target.data.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.controls,
  },
  pointerShell: {
    position: 'absolute',
    width: 84,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    minWidth: 152,
    maxWidth: 180,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

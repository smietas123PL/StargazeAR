import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from '../utils/reactNative';
import Svg, {
  Defs,
  LinearGradient,
  Rect as SvgRect,
  Stop,
} from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';

type SkyOverlayProps = {
  isInfoPanelOpen: boolean;
};

const HORIZON_BAND_HEIGHT_RATIO = 0.26;
const HORIZON_BAND_START_RATIO = 1 - HORIZON_BAND_HEIGHT_RATIO;

export default React.memo(function SkyOverlay({ isInfoPanelOpen }: SkyOverlayProps) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();

  const overlayColor = useMemo(
    () => (isInfoPanelOpen ? theme.skyBaseOpen : theme.skyBaseDefault),
    [isInfoPanelOpen, theme.skyBaseDefault, theme.skyBaseOpen],
  );
  const atmosphericOpacity = isInfoPanelOpen ? 0.85 : 1;
  const horizonBandY = height * HORIZON_BAND_START_RATIO;
  const horizonBandHeight = height * HORIZON_BAND_HEIGHT_RATIO;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.root}
      pointerEvents="none"
    >
      <View
        style={[
          styles.baseOverlay,
          {
            backgroundColor: overlayColor,
          },
        ]}
      />

      <Svg
        accessible={false}
        width={width}
        height={height}
        style={styles.svg}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="skyDepthGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.skyDepthStops[0]} />
            <Stop offset="56%" stopColor={theme.skyDepthStops[1]} />
            <Stop offset="100%" stopColor={theme.skyDepthStops[2]} />
          </LinearGradient>
          <LinearGradient id="skyHorizonGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.skyHorizonStops[0]} />
            <Stop offset="42%" stopColor={theme.skyHorizonStops[1]} />
            <Stop offset="100%" stopColor={theme.skyHorizonStops[2]} />
          </LinearGradient>
        </Defs>

        <SvgRect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#skyDepthGradient)"
          opacity={atmosphericOpacity}
        />
        <SvgRect
          x={0}
          y={horizonBandY}
          width={width}
          height={horizonBandHeight}
          fill="url(#skyHorizonGradient)"
          opacity={atmosphericOpacity}
        />
      </Svg>

      <View
        style={[
          styles.vignette,
          {
            borderColor: theme.skyVignetteBorder,
            backgroundColor: theme.transparent,
          },
        ]}
      />
    </View>
  );
});
const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  baseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  svg: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 28,
  },
});

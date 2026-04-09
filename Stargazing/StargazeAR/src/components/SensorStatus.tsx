import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import { ZIndex } from '../constants/zIndex';
import {
  HEADING_CALIBRATION_LABELS,
  type HeadingCalibrationLevel,
} from '../types';

type SensorStatusProps = {
  headingCalibrationLevel: HeadingCalibrationLevel;
  isHeadingReliable: boolean;
  isDeviceMotionAvailable: boolean;
};

export default function SensorStatus({
  headingCalibrationLevel,
  isHeadingReliable,
  isDeviceMotionAvailable,
}: SensorStatusProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isVisibleRef = useRef(false);

  const issues = useMemo(() => {
    const nextIssues: string[] = [];

    if (!isDeviceMotionAvailable) {
      nextIssues.push('Brak dostępu do orientacji urządzenia (DeviceMotion).');
    }

    if (!isHeadingReliable) {
      if (headingCalibrationLevel === 0) {
        nextIssues.push(
          'Kompas niekalibrowany - porusz telefonem w kształcie cyfry 8.',
        );
      } else if (headingCalibrationLevel === 1) {
        nextIssues.push(
          'Słaba kalibracja kompasu - wyniki mogą być przesunięte.',
        );
      } else {
        nextIssues.push(
          `Kalibracja kompasu jest niewystarczająca: ${HEADING_CALIBRATION_LABELS[headingCalibrationLevel]}.`,
        );
      }
    }

    return nextIssues;
  }, [headingCalibrationLevel, isDeviceMotionAvailable, isHeadingReliable]);

  const shouldShow = issues.length > 0;

  useEffect(() => {
    if (shouldShow) {
      if (!isVisibleRef.current) {
        translateY.setValue(-80);
        opacity.setValue(0);
      }

      isVisibleRef.current = true;

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    isVisibleRef.current = false;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, shouldShow, translateY]);

  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.wrapper,
        { top: insets.top + 12 },
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <View
        accessibilityRole="alert"
        style={[
          styles.banner,
          {
            backgroundColor: theme.warning,
            borderColor: theme.borderAlert,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.warningTitle }]}>
          Status sensorów wymaga uwagi
        </Text>
        {issues.map((issue) => (
          <Text key={issue} style={[styles.message, { color: theme.warningBody }]}>
            {issue}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: ZIndex.sensorBanner,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
});

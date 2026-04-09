import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from '../utils/reactNative';

import CompassHUD from '../components/CompassHUD';
import OnboardingHint from '../components/OnboardingHint';
import SensorStatus from '../components/SensorStatus';
import type { HeadingCalibrationLevel } from '../types';
import type { LayoutMetrics } from '../utils/layout';

type HUDContainerProps = {
  layout: LayoutMetrics;
  heading: number;
  pitch: number;
  headingCalibrationLevel: HeadingCalibrationLevel;
  isHeadingReliable: boolean;
  isDeviceMotionAvailable: boolean;
  isOnboardingHintVisible: boolean;
  onboardingMessageVariant: 'default' | 'calibration';
  isArSessionActive: boolean;
  isInfoPanelOpen: boolean;
  selectedConstellationId: string | null;
  onDismissOnboarding: () => void;
};

export default function HUDContainer({
  layout,
  heading,
  pitch,
  headingCalibrationLevel,
  isHeadingReliable,
  isDeviceMotionAvailable,
  isOnboardingHintVisible,
  onboardingMessageVariant,
  isArSessionActive,
  isInfoPanelOpen,
  selectedConstellationId,
  onDismissOnboarding,
}: HUDContainerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isArSessionActive) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [isArSessionActive, opacity]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="box-none">
      <OnboardingHint
        isVisible={
          isOnboardingHintVisible &&
          isArSessionActive &&
          !isInfoPanelOpen &&
          selectedConstellationId === null
        }
        messageVariant={onboardingMessageVariant}
        bottomOffset={layout.hintBottomOffset}
        horizontalPadding={layout.horizontalPadding}
        onDismiss={onDismissOnboarding}
      />
      <CompassHUD
        heading={heading}
        pitch={pitch}
        headingCalibrationLevel={headingCalibrationLevel}
        topOffset={layout.compassTopOffset}
        horizontalPadding={layout.horizontalPadding}
      />
      <SensorStatus
        headingCalibrationLevel={headingCalibrationLevel}
        isHeadingReliable={isHeadingReliable}
        isDeviceMotionAvailable={isDeviceMotionAvailable}
      />
    </Animated.View>
  );
}

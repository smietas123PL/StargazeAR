import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';

import {
  hasSeenOnboarding,
  markOnboardingSeen,
} from '../storage/onboardingStorage';

const ONBOARDING_HINT_DURATION_MS = 6800;
const ONBOARDING_MOTION_PITCH_DELTA = 4;
const ONBOARDING_MOTION_ROLL_DELTA = 4;
const ONBOARDING_MOTION_HEADING_DELTA = 10;

type OnboardingMessageVariant = 'default' | 'calibration';

type UseOnboardingParams = {
  isArSessionActive: boolean;
  wasArSessionActiveRef: MutableRefObject<boolean>;
  heading: number;
  pitch: number;
  roll: number;
  isHeadingReliable: boolean;
  headingCalibrationLevel: number;
  selectedConstellationId: string | null;
  isInfoPanelOpen: boolean;
};

function getHeadingDelta(next: number, previous: number) {
  const delta = next - previous;

  if (delta > 180) {
    return delta - 360;
  }

  if (delta < -180) {
    return delta + 360;
  }

  return delta;
}

export default function useOnboarding({
  isArSessionActive,
  wasArSessionActiveRef,
  heading,
  pitch,
  roll,
  isHeadingReliable,
  headingCalibrationLevel,
  selectedConstellationId,
  isInfoPanelOpen,
}: UseOnboardingParams) {
  const [isOnboardingHintVisible, setIsOnboardingHintVisible] = useState(false);
  const [hasOnboardingMotion, setHasOnboardingMotion] = useState(false);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const hasSeenOnboardingRef = useRef(false);
  const hasPersistedOnboardingRef = useRef(false);
  const onboardingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const previousOnboardingOrientationRef = useRef<{
    heading: number;
    pitch: number;
    roll: number;
  } | null>(null);

  const onboardingMessageVariant = useMemo<OnboardingMessageVariant>(
    () =>
      !isHeadingReliable || headingCalibrationLevel < 2
        ? 'calibration'
        : 'default',
    [headingCalibrationLevel, isHeadingReliable],
  );

  const clearOnboardingTimeout = useCallback(() => {
    if (onboardingTimeoutRef.current) {
      clearTimeout(onboardingTimeoutRef.current);
      onboardingTimeoutRef.current = null;
    }
  }, []);

  const persistOnboardingSeen = useCallback(() => {
    if (hasPersistedOnboardingRef.current) {
      return;
    }

    hasPersistedOnboardingRef.current = true;
    void markOnboardingSeen();
  }, []);

  const dismissOnboarding = useCallback(() => {
    clearOnboardingTimeout();
    setIsOnboardingHintVisible(false);
    persistOnboardingSeen();
  }, [clearOnboardingTimeout, persistOnboardingSeen]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateOnboardingState() {
      const hasSeen = await hasSeenOnboarding();

      if (!isMounted) {
        return;
      }

      hasSeenOnboardingRef.current = hasSeen;
      hasPersistedOnboardingRef.current = hasSeen;
      setIsStorageHydrated(true);
    }

    void hydrateOnboardingState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    clearOnboardingTimeout();

    if (!isStorageHydrated) {
      return;
    }

    if (!isArSessionActive) {
      wasArSessionActiveRef.current = false;
      previousOnboardingOrientationRef.current = null;
      setIsOnboardingHintVisible(false);
      setHasOnboardingMotion(false);
      return;
    }

    if (wasArSessionActiveRef.current || hasSeenOnboardingRef.current) {
      return;
    }

    wasArSessionActiveRef.current = true;
    hasSeenOnboardingRef.current = true;
    previousOnboardingOrientationRef.current = {
      heading,
      pitch,
      roll,
    };
    setHasOnboardingMotion(false);
    setIsOnboardingHintVisible(true);
    onboardingTimeoutRef.current = setTimeout(() => {
      dismissOnboarding();
    }, Math.max(0, ONBOARDING_HINT_DURATION_MS));

    // Cleanup ONLY clears timeout if component unmounts or active state changes deeply
    return () => {
      if (onboardingTimeoutRef.current) {
        clearTimeout(onboardingTimeoutRef.current);
      }
    };
  }, [isArSessionActive, isStorageHydrated, clearOnboardingTimeout, dismissOnboarding]);

  useEffect(() => {
    if (!isArSessionActive || !isOnboardingHintVisible) {
      previousOnboardingOrientationRef.current = null;
      return;
    }

    const previousOrientation = previousOnboardingOrientationRef.current;
    const nextOrientation = {
      heading,
      pitch,
      roll,
    };

    previousOnboardingOrientationRef.current = nextOrientation;

    if (!previousOrientation || hasOnboardingMotion) {
      return;
    }

    const headingDelta = Math.abs(
      getHeadingDelta(nextOrientation.heading, previousOrientation.heading),
    );
    const pitchDelta = Math.abs(nextOrientation.pitch - previousOrientation.pitch);
    const rollDelta = Math.abs(nextOrientation.roll - previousOrientation.roll);

    if (
      headingDelta >= ONBOARDING_MOTION_HEADING_DELTA ||
      pitchDelta >= ONBOARDING_MOTION_PITCH_DELTA ||
      rollDelta >= ONBOARDING_MOTION_ROLL_DELTA
    ) {
      setHasOnboardingMotion(true);
    }
  }, [
    hasOnboardingMotion,
    heading,
    isArSessionActive,
    isOnboardingHintVisible,
    pitch,
    roll,
  ]);

  useEffect(() => {
    if (!isArSessionActive || !isOnboardingHintVisible) {
      return;
    }

    if (selectedConstellationId !== null || isInfoPanelOpen) {
      dismissOnboarding();
      return;
    }

    if (isHeadingReliable && hasOnboardingMotion) {
      dismissOnboarding();
    }
  }, [
    hasOnboardingMotion,
    isArSessionActive,
    isHeadingReliable,
    isInfoPanelOpen,
    isOnboardingHintVisible,
    selectedConstellationId,
    dismissOnboarding,
  ]);

  useEffect(() => {
    return () => {
      clearOnboardingTimeout();
    };
  }, [clearOnboardingTimeout]);

  return {
    dismissOnboarding,
    isOnboardingHintVisible,
    onboardingMessageVariant,
  };
}

import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeVisibleConstellations, SkyCache } from '../astronomy';
import { WARSAW_FALLBACK_LOCATION } from '../constants/defaults';
import useARSession from './useARSession';
import useCalibration from './useCalibration';
import useDeviceOrientation from './useDeviceOrientation';
import useEffectiveData from './useEffectiveData';
import useHeading from './useHeading';
import useHeadingDrift from './useHeadingDrift';
import useLocation from './useLocation';
import useOnboarding from './useOnboarding';
import { getLayoutMetrics } from '../utils/layout';
import { IS_MOCK_ENABLED } from '../utils/sensorMock';
import { useWindowDimensions } from '../utils/reactNative';

type AppContentScreen = 'ar' | 'calibration';

export default function useAppContentState() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const debugMode = __DEV__;
  const [currentScreen, setCurrentScreen] = useState<AppContentScreen>('ar');
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);
  const [skyCache] = useState(() => new SkyCache());
  const {
    location,
    errorKind: locationErrorKind,
    isLoading: isLocationLoading,
  } = useLocation();
  const { heading, headingCalibrationLevel, isHeadingReliable } = useHeading();
  const { pitch, roll, isAvailable: isDeviceMotionAvailable } =
    useDeviceOrientation();
  const { calibration, handleSaveCalibration } = useCalibration({
    isMockEnabled: IS_MOCK_ENABLED,
    onSaved: () => setCurrentScreen('ar'),
  });
  const { cameraReady, setCameraReady, isArSessionActive, wasArSessionActiveRef } =
    useARSession({ currentScreen });
  const headingCorrected = useHeadingDrift({
    heading,
    pitch,
    isMockEnabled: IS_MOCK_ENABLED,
  });
  const {
    effectiveOrientation,
    effectiveLocation: liveLocation,
    effectiveCalibration,
  } = useEffectiveData({
    isMockEnabled: IS_MOCK_ENABLED,
    heading: headingCorrected,
    headingCalibrationLevel,
    isHeadingReliable,
    pitch,
    roll,
    location,
    calibration,
  });
  const effectiveLocation = useMemo(
    () => liveLocation ?? WARSAW_FALLBACK_LOCATION,
    [liveLocation],
  );
  const isInfoPanelOpen = selectedConstellationId !== null;
  const {
    dismissOnboarding,
    isOnboardingHintVisible,
    onboardingMessageVariant,
  } = useOnboarding({
    isArSessionActive,
    wasArSessionActiveRef,
    heading: effectiveOrientation.heading,
    pitch: effectiveOrientation.pitch,
    roll: effectiveOrientation.roll,
    isHeadingReliable: effectiveOrientation.isHeadingReliable,
    headingCalibrationLevel: effectiveOrientation.headingCalibrationLevel,
    selectedConstellationId,
    isInfoPanelOpen,
  });
  const layout = useMemo(
    () =>
      getLayoutMetrics({
        screenWidth: width,
        screenHeight: height,
        safeTop: insets.top,
        safeBottom: insets.bottom,
        isInfoPanelOpen,
      }),
    [height, insets.bottom, insets.top, isInfoPanelOpen, width],
  );
  const visibleConstellations = useMemo(
    () =>
      computeVisibleConstellations({
        location: effectiveLocation,
        orientation: effectiveOrientation,
        calibration: effectiveCalibration,
        screenWidth: width,
        screenHeight: height,
        skyCache,
      }),
    [effectiveCalibration, effectiveLocation, effectiveOrientation, height, width, skyCache],
  );
  const selectedConstellation = useMemo(
    () =>
      visibleConstellations.find(
        (constellation) => constellation.data.id === selectedConstellationId,
      ) ?? null,
    [selectedConstellationId, visibleConstellations],
  );

  function openCalibration() {
    if (IS_MOCK_ENABLED) {
      return;
    }

    setSelectedConstellationId(null);
    setCurrentScreen('calibration');
  }

  return {
    calibration,
    cameraReady,
    currentScreen,
    debugMode,
    dismissOnboarding,
    effectiveCalibration,
    effectiveLocation,
    effectiveOrientation,
    handleSaveCalibration,
    isArSessionActive,
    isDeviceMotionAvailable: IS_MOCK_ENABLED ? true : isDeviceMotionAvailable,
    isInfoPanelOpen,
    isLocationLoading,
    isMockEnabled: IS_MOCK_ENABLED,
    isOnboardingHintVisible,
    layout,
    location,
    locationErrorKind,
    onboardingMessageVariant,
    openCalibration,
    selectedConstellation,
    selectedConstellationId,
    setCameraReady,
    setCurrentScreen,
    setSelectedConstellationId,
    visibleConstellations,
  };
}

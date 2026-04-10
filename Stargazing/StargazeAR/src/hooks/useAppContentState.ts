import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  computeProjectedSolarSystemObjects,
  computeVisibleConstellations,
  SkyCache,
} from '../astronomy';
import {
  OFFLINE_LOCATION_OPTIONS,
  WARSAW_FALLBACK_LOCATION,
} from '../constants/defaults';
import useARSession from './useARSession';
import useCalibration from './useCalibration';
import useDeviceOrientation from './useDeviceOrientation';
import useEffectiveData from './useEffectiveData';
import useGuidedTour from './useGuidedTour';
import useHeading from './useHeading';
import useHeadingDrift from './useHeadingDrift';
import useLocation from './useLocation';
import useOnboarding from './useOnboarding';
import { getLayoutMetrics } from '../utils/layout';
import { IS_MOCK_ENABLED } from '../utils/sensorMock';
import { useWindowDimensions } from '../utils/reactNative';

import type {
  CalibrationData,
  LocationSource,
  OfflineLocationOption,
} from '../types';

export type AppContentScreen = 'ar' | 'calibration' | 'drag_align';
const RETICLE_CAPTURE_RADIUS_PX = 54;

export default function useAppContentState() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const debugMode = __DEV__;
  const [currentScreen, setCurrentScreen] = useState<AppContentScreen>('ar');
  const [dragCalibrationTemp, setDragCalibrationTemp] =
    useState<CalibrationData | null>(null);
  const [guidedTargetId, setGuidedTargetId] = useState<string | null>(null);
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);
  const [manualOfflineLocation, setManualOfflineLocation] =
    useState<OfflineLocationOption | null>(null);
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);
  const [skyCache] = useState(() => new SkyCache());
  const {
    location,
    errorKind: locationErrorKind,
    isLoading: isLocationLoading,
    isUsingCachedLocation,
    shouldPromptForOfflineFallback,
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
    location: location ?? manualOfflineLocation?.location ?? null,
    calibration: dragCalibrationTemp ?? calibration,
  });
  const locationSource = useMemo<LocationSource>(() => {
    if (IS_MOCK_ENABLED) {
      return 'live';
    }

    if (location) {
      return isUsingCachedLocation ? 'cache' : 'live';
    }

    if (manualOfflineLocation) {
      return 'manual_fallback';
    }

    return 'warsaw_fallback';
  }, [isUsingCachedLocation, location, manualOfflineLocation]);
  const effectiveLocation = useMemo(
    () => liveLocation ?? WARSAW_FALLBACK_LOCATION,
    [liveLocation],
  );
  const shouldShowLocationFallbackModal =
    !IS_MOCK_ENABLED &&
    shouldPromptForOfflineFallback &&
    manualOfflineLocation === null &&
    location === null;
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
  const guidedTargetConstellation = useMemo(
    () =>
      visibleConstellations.find(
        (constellation) => constellation.data.id === guidedTargetId,
      ) ?? null,
    [guidedTargetId, visibleConstellations],
  );
  const guidedTourItems = useGuidedTour(visibleConstellations);
  const focusedConstellationId = selectedConstellationId ?? guidedTargetId;
  const reticleTargetConstellation = useMemo(() => {
    const screenCenterX = width / 2;
    const screenCenterY = height / 2;

    return visibleConstellations
      .map((constellation) => ({
        constellation,
        distance: Math.hypot(
          constellation.centerScreen.x - screenCenterX,
          constellation.centerScreen.y - screenCenterY,
        ),
      }))
      .filter((entry) => entry.distance <= RETICLE_CAPTURE_RADIUS_PX)
      .sort((first, second) => {
        if (first.distance !== second.distance) {
          return first.distance - second.distance;
        }

        return second.constellation.altitude - first.constellation.altitude;
      })[0]?.constellation ?? null;
  }, [height, visibleConstellations, width]);
  const projectedSolarSystemObjects = useMemo(
    () =>
      computeProjectedSolarSystemObjects({
        location: effectiveLocation,
        orientation: effectiveOrientation,
        calibration: effectiveCalibration,
        screenWidth: width,
        screenHeight: height,
      }),
    [
      effectiveCalibration,
      effectiveLocation,
      effectiveOrientation,
      height,
      width,
    ],
  );

  useEffect(() => {
    if (location && !isUsingCachedLocation && manualOfflineLocation !== null) {
      setManualOfflineLocation(null);
    }
  }, [isUsingCachedLocation, location, manualOfflineLocation]);

  useEffect(() => {
    if (currentScreen !== 'ar' || isInfoPanelOpen) {
      setIsGuidedTourOpen(false);
    }
  }, [currentScreen, isInfoPanelOpen]);

  function openCalibration() {
    if (IS_MOCK_ENABLED) {
      return;
    }

    setSelectedConstellationId(null);
    setCurrentScreen('calibration');
  }

  function toggleGuidedTour() {
    if (currentScreen !== 'ar') {
      return;
    }

    setSelectedConstellationId(null);
    setIsGuidedTourOpen((previous) => !previous);
  }

  function closeGuidedTour() {
    setIsGuidedTourOpen(false);
  }

  function selectGuidedTourTarget(id: string) {
    setSelectedConstellationId(null);
    setGuidedTargetId(id);
  }

  function selectOfflineLocation(option: OfflineLocationOption) {
    setManualOfflineLocation(option);
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
    focusedConstellationId,
    guidedTargetConstellation,
    guidedTourItems,
    handleSaveCalibration,
    isArSessionActive,
    isDeviceMotionAvailable: IS_MOCK_ENABLED ? true : isDeviceMotionAvailable,
    isGuidedTourOpen,
    isInfoPanelOpen,
    isLocationLoading,
    locationSource,
    isMockEnabled: IS_MOCK_ENABLED,
    isOnboardingHintVisible,
    layout,
    location,
    locationErrorKind,
    offlineLocationOptions: OFFLINE_LOCATION_OPTIONS,
    selectedOfflineLocationName: manualOfflineLocation?.name ?? null,
    onboardingMessageVariant,
    openCalibration,
    closeGuidedTour,
    projectedSolarSystemObjects,
    reticleTargetConstellation,
    selectOfflineLocation,
    selectGuidedTourTarget,
    selectedConstellation,
    selectedConstellationId,
    setCameraReady,
    setCurrentScreen,
    setSelectedConstellationId,
    setDragCalibrationTemp,
    shouldShowLocationFallbackModal,
    toggleGuidedTour,
    visibleConstellations,
  };
}

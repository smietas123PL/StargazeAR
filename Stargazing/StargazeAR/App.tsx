import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from './src/utils/reactNative';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import CalibrationScreen from './src/components/CalibrationScreen';
import CameraBackground from './src/components/CameraBackground';
import ConstellationInfo from './src/components/ConstellationInfo';
import DragAlignOverlay from './src/components/DragAlignOverlay';
import ErrorBoundary from './src/components/ErrorBoundary';
import GuidedTourPanel from './src/components/GuidedTourPanel';
import LocationFallbackModal from './src/components/LocationFallbackModal';
import AROverlayContainer from './src/containers/AROverlayContainer';
import ControlsContainer from './src/containers/ControlsContainer';
import HUDContainer from './src/containers/HUDContainer';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import useAppContentState from './src/hooks/useAppContentState';
import useReticleChime from './src/hooks/useReticleChime';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const {
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
    isDeviceMotionAvailable,
    isGuidedTourOpen,
    isInfoPanelOpen,
    isLocationLoading,
    isMockEnabled,
    isOnboardingHintVisible,
    layout,
    location,
    locationErrorKind,
    locationSource,
    offlineLocationOptions,
    onboardingMessageVariant,
    closeGuidedTour,
    openCalibration,
    selectOfflineLocation,
    selectGuidedTourTarget,
    projectedSolarSystemObjects,
    reticleTargetConstellation,
    selectedConstellation,
    selectedConstellationId,
    selectedOfflineLocationName,
    setCameraReady,
    setCurrentScreen,
    setSelectedConstellationId,
    setDragCalibrationTemp,
    shouldShowLocationFallbackModal,
    toggleGuidedTour,
    visibleConstellations,
  } = useAppContentState();

  useReticleChime(currentScreen === 'ar' ? reticleTargetConstellation : null);

  return (
    <View style={[styles.root, { backgroundColor: theme.black }]}>
      <StatusBar style="light" />
      <CameraBackground
        onPermissionGranted={() => setCameraReady(true)}
        onPermissionDenied={() => setCameraReady(false)}
      />
      <AROverlayContainer
        isVisible={cameraReady && (currentScreen === 'ar' || currentScreen === 'drag_align')}
        isInfoPanelOpen={isInfoPanelOpen}
        guidedTarget={guidedTargetConstellation}
        focusedConstellationId={focusedConstellationId}
        selectedConstellationId={selectedConstellationId}
        constellations={visibleConstellations}
        solarSystemObjects={projectedSolarSystemObjects}
        onSelectConstellation={setSelectedConstellationId}
      />
      <HUDContainer
        layout={layout}
        heading={effectiveOrientation.heading}
        pitch={effectiveOrientation.pitch}
        headingCalibrationLevel={effectiveOrientation.headingCalibrationLevel}
        isHeadingReliable={effectiveOrientation.isHeadingReliable}
        isDeviceMotionAvailable={isDeviceMotionAvailable}
        isOnboardingHintVisible={isOnboardingHintVisible}
        onboardingMessageVariant={onboardingMessageVariant}
        isArSessionActive={isArSessionActive}
        isInfoPanelOpen={isInfoPanelOpen}
        selectedConstellationId={selectedConstellationId}
        onDismissOnboarding={dismissOnboarding}
      />
      <ControlsContainer
        currentScreen={currentScreen}
        layout={layout}
        isMockEnabled={isMockEnabled}
        isInfoPanelOpen={isInfoPanelOpen}
        isLocationLoading={isLocationLoading}
        cachedLocationTimestamp={locationSource === 'cache' ? location?.timestamp ?? null : null}
        effectiveLocation={effectiveLocation}
        locationErrorKind={locationErrorKind}
        locationSource={locationSource}
        selectedOfflineLocationName={selectedOfflineLocationName}
        isGuidedTourOpen={isGuidedTourOpen}
        onOpenCalibration={openCalibration}
        onOpenDragAlign={() => {
          setSelectedConstellationId(null);
          setCurrentScreen('drag_align');
        }}
        onToggleGuidedTour={toggleGuidedTour}
      />
      <GuidedTourPanel
        isOpen={isGuidedTourOpen}
        items={guidedTourItems}
        selectedTargetId={focusedConstellationId}
        bottomOffset={layout.bottomSafeOffset + 84}
        horizontalPadding={layout.horizontalPadding}
        onClose={closeGuidedTour}
        onSelect={selectGuidedTourTarget}
      />
      <LocationFallbackModal
        isVisible={shouldShowLocationFallbackModal}
        options={offlineLocationOptions}
        onSelect={selectOfflineLocation}
      />
      {currentScreen === 'ar' ? (
        <ConstellationInfo
          selected={selectedConstellation}
          isOpen={isInfoPanelOpen}
          maxPanelHeight={layout.infoPanelMaxHeight}
          onClose={() => setSelectedConstellationId(null)}
        />
      ) : null}
      {currentScreen === 'calibration' ? (
        <CalibrationScreen
          currentCalibration={calibration}
          currentHeading={effectiveOrientation.heading}
          currentPitch={effectiveOrientation.pitch}
          onSave={handleSaveCalibration}
          onCancel={() => setCurrentScreen('ar')}
        />
      ) : null}
      {currentScreen === 'drag_align' ? (
        <DragAlignOverlay
          currentCalibration={effectiveCalibration}
          setDragCalibrationTemp={setDragCalibrationTemp}
          onSave={handleSaveCalibration}
          onCancel={() => {
            setDragCalibrationTemp(null);
            setCurrentScreen('ar');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from './src/utils/reactNative';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import CalibrationScreen from './src/components/CalibrationScreen';
import CameraBackground from './src/components/CameraBackground';
import ConstellationInfo from './src/components/ConstellationInfo';
import ErrorBoundary from './src/components/ErrorBoundary';
import AROverlayContainer from './src/containers/AROverlayContainer';
import ControlsContainer from './src/containers/ControlsContainer';
import HUDContainer from './src/containers/HUDContainer';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import useAppContentState from './src/hooks/useAppContentState';

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
    handleSaveCalibration,
    isArSessionActive,
    isDeviceMotionAvailable,
    isInfoPanelOpen,
    isLocationLoading,
    isMockEnabled,
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
  } = useAppContentState();

  return (
    <View style={[styles.root, { backgroundColor: theme.black }]}>
      <StatusBar style="light" />
      <CameraBackground
        onPermissionGranted={() => setCameraReady(true)}
        onPermissionDenied={() => setCameraReady(false)}
      />
      <AROverlayContainer
        isVisible={cameraReady && currentScreen === 'ar'}
        isInfoPanelOpen={isInfoPanelOpen}
        selectedConstellationId={selectedConstellationId}
        constellations={visibleConstellations}
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
        debugMode={debugMode}
        layout={layout}
        isMockEnabled={isMockEnabled}
        isInfoPanelOpen={isInfoPanelOpen}
        isLocationLoading={isLocationLoading}
        location={location}
        effectiveLocation={effectiveLocation}
        locationErrorKind={locationErrorKind}
        cameraReady={cameraReady}
        constellations={visibleConstellations}
        effectiveCalibration={effectiveCalibration}
        onOpenCalibration={openCalibration}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

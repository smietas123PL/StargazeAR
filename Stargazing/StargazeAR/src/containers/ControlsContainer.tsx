import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';
import Svg, { Circle, Path } from 'react-native-svg';

import NightModeToggle from '../components/NightModeToggle';
import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapLight, tapMedium } from '../utils/haptics';
import type {
  CalibrationData,
  LocationErrorKind,
  ProjectedConstellation,
  UserLocation,
} from '../types';
import type { LayoutMetrics } from '../utils/layout';

type ControlsContainerProps = {
  currentScreen: 'ar' | 'calibration';
  debugMode: boolean;
  layout: LayoutMetrics;
  isMockEnabled: boolean;
  isInfoPanelOpen: boolean;
  isLocationLoading: boolean;
  location: UserLocation | null;
  effectiveLocation: UserLocation;
  locationErrorKind: LocationErrorKind | null;
  cameraReady: boolean;
  constellations: ProjectedConstellation[];
  effectiveCalibration: CalibrationData;
  onOpenCalibration: () => void;
};

function getLocationBannerCopy(errorKind: LocationErrorKind | null) {
  if (errorKind === 'permission_denied') {
    return {
      title: 'Brak uprawnień GPS',
      body: 'Używam lokalizacji zastępczej Warszawy, bo system nie udostępnił pozycji urządzenia.',
    };
  }

  return {
    title: 'Nie udało się ustalić GPS',
    body: 'Używam lokalizacji zastępczej Warszawy, bo odczyt pozycji z urządzenia nie powiódł się.',
  };
}

function getLocationDebugLabel(errorKind: LocationErrorKind | null, hasLocation: boolean) {
  if (hasLocation) {
    return 'GPS urządzenia';
  }

  if (errorKind === 'permission_denied') {
    return 'brak uprawnień GPS';
  }

  if (errorKind === 'location_failed') {
    return 'GPS niedostępny';
  }

  return 'fallback Warszawa';
}

export default function ControlsContainer({
  currentScreen,
  debugMode,
  layout,
  isMockEnabled,
  isInfoPanelOpen,
  isLocationLoading,
  location,
  effectiveLocation,
  locationErrorKind,
  cameraReady,
  constellations,
  effectiveCalibration,
  onOpenCalibration,
}: ControlsContainerProps) {
  const { theme } = useTheme();
  const locationPulse = useRef(new Animated.Value(0.45)).current;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentScreen === 'ar') {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: 300, // Stagger effect
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [currentScreen, opacity]);

  useEffect(() => {
    if (!isLocationLoading || isMockEnabled) {
      locationPulse.stopAnimation();
      locationPulse.setValue(0.45);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(locationPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(locationPulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      locationPulse.stopAnimation();
    };
  }, [isLocationLoading, isMockEnabled, locationPulse]);

  if (currentScreen !== 'ar') {
    return null;
  }

  const visibleConstellationsCount = constellations.filter(
    (item) => item.isAnyStarVisible,
  ).length;
  const locationSourceLabel = isMockEnabled
    ? 'mock Warszawa'
    : getLocationDebugLabel(locationErrorKind, location !== null);
  const locationBannerCopy = getLocationBannerCopy(locationErrorKind);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="box-none">
      {!isMockEnabled && !location ? (
        <View
          accessibilityLiveRegion="assertive"
          style={[
            styles.locationBanner,
            {
              top: layout.topSafeOffset,
              left: layout.horizontalPadding,
              backgroundColor: theme.locationBannerBg,
              borderColor: theme.locationBannerBorder,
            },
          ]}
        >
          {isLocationLoading ? (
            <View style={styles.locationBannerHeader}>
              <Animated.View
                style={[
                  styles.locationPulseDot,
                  {
                    backgroundColor: theme.accent,
                    opacity: locationPulse,
                    transform: [
                      {
                        scale: locationPulse.interpolate({
                          inputRange: [0.45, 1],
                          outputRange: [1, 1.75],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text
                style={[styles.locationBannerStatus, { color: theme.locationBannerText }]}
              >
                Szukam GPS...
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.locationBannerTitle, { color: theme.locationBannerText }]}
            >
              {locationBannerCopy.title}
            </Text>
          )}
          <Text
            style={[styles.locationBannerText, { color: theme.locationBannerText }]}
          >
            {isLocationLoading ? 'Wstępnie korzystam z lokalizacji Warszawy' : locationBannerCopy.body}{' '}
            ({effectiveLocation.latitude.toFixed(4)}, {effectiveLocation.longitude.toFixed(4)})
          </Text>
        </View>
      ) : null}

      {isMockEnabled ? (
        <View
          style={[
            styles.mockBanner,
            {
              top: layout.topSafeOffset,
              left: layout.horizontalPadding,
              right: layout.horizontalPadding,
              backgroundColor: theme.mockBannerBg,
              borderColor: theme.mockBannerBorder,
            },
          ]}
        >
          <Text style={[styles.mockBannerText, { color: theme.mockBannerText }]}>
            Tryb mocków aktywny: symuluję heading, pitch i lokalizację Warszawy.
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.controlCluster,
          {
            right: layout.horizontalPadding,
            bottom: layout.controlClusterBottom,
          },
        ]}
        pointerEvents="box-none"
      >
        {isMenuOpen && (
          <View
            style={[
              styles.menuPanel,
            ]}
          >
            <NightModeToggle
              bottomOffset={0}
              horizontalInset={0}
              compact={layout.isCompactFloatingUi}
              inline
            />
            {!isMockEnabled && (
              <Pressable
                accessibilityHint="Otwiera ekran recznej kalibracji nakladki nieba."
                accessibilityLabel="Otworz kalibracje"
                accessibilityRole="button"
                style={[
                  styles.calibrationButton,
                  layout.isCompactFloatingUi && styles.calibrationButtonCompact,
                  {
                    backgroundColor: theme.buttonBg,
                    borderColor: theme.borderStrongSubtle,
                  },
                ]}
                onPress={() => {
                  void tapMedium();
                  setIsMenuOpen(false);
                  onOpenCalibration();
                }}
              >
                <Text
                  style={[
                    styles.calibrationButtonText,
                    layout.isCompactFloatingUi && styles.calibrationButtonTextCompact,
                    { color: theme.title },
                  ]}
                >
                  Kalibracja
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          accessibilityLabel={isMenuOpen ? "Zamknij menu" : "Otwórz menu ustawień"}
          accessibilityRole="button"
          style={[
            styles.fab,
            {
              backgroundColor: isMenuOpen ? theme.accent : theme.buttonBg,
              borderColor: isMenuOpen ? theme.accent : theme.borderStrongSubtle,
            },
          ]}
          onPress={() => {
            void tapLight();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isMenuOpen ? theme.black : theme.title} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <Path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <Path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </Svg>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  locationBanner: {
    position: 'absolute',
    left: 16,
    right: 140,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: ZIndex.locationBanner,
  },
  locationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationBannerStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationBannerTitle: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  locationPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  locationBannerText: {
    fontSize: 12,
    lineHeight: 17,
  },
  mockBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: ZIndex.mockBanner,
  },
  mockBannerText: {
    fontSize: 12,
    lineHeight: 17,
  },
  controlCluster: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: ZIndex.controls,
  },
  menuPanel: {
    padding: 2,
    gap: 12,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  calibrationButton: {
    minWidth: 128,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  calibrationButtonCompact: {
    minWidth: 112,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  calibrationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calibrationButtonTextCompact: {
    fontSize: 13,
  },
});

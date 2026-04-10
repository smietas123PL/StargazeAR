import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';
import Svg, { Path } from 'react-native-svg';

import NightModeToggle from '../components/NightModeToggle';
import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapLight, tapMedium } from '../utils/haptics';

import type {
  LocationErrorKind,
  LocationSource,
  UserLocation,
} from '../types';
import type { LayoutMetrics } from '../utils/layout';

type ControlsContainerProps = {
  currentScreen: 'ar' | 'calibration' | 'drag_align';
  layout: LayoutMetrics;
  isMockEnabled: boolean;
  isGuidedTourOpen: boolean;
  isInfoPanelOpen: boolean;
  isLocationLoading: boolean;
  location: UserLocation | null;
  effectiveLocation: UserLocation;
  locationErrorKind: LocationErrorKind | null;
  locationSource: LocationSource;
  selectedOfflineLocationName: string | null;
  onOpenCalibration: () => void;
  onOpenDragAlign: () => void;
  onToggleGuidedTour: () => void;
};

function getLocationBannerCopy(params: {
  errorKind: LocationErrorKind | null;
  locationSource: LocationSource;
  selectedOfflineLocationName: string | null;
}) {
  const { errorKind, locationSource, selectedOfflineLocationName } = params;

  if (locationSource === 'cache') {
    return {
      title: 'Uzywam ostatniej zapisanej lokalizacji',
      body: 'GPS nie odpowiedzial na czas albo odczyt byl niestabilny, wiec wracam do ostatnio zapisanej pozycji urzadzenia.',
    };
  }

  if (locationSource === 'manual_fallback') {
    return {
      title: 'Uzywam lokalizacji recznej',
      body: `GPS nie byl gotowy na czas, wiec przelaczam sie na tryb offline: ${selectedOfflineLocationName ?? 'wybrane miasto'}.`,
    };
  }

  if (errorKind === 'permission_denied') {
    return {
      title: 'Brak uprawnien GPS',
      body: 'Uzywam lokalizacji zastepczej Warszawy, bo system nie udostepnil pozycji urzadzenia.',
    };
  }

  if (errorKind === 'timeout') {
    return {
      title: 'GPS nie odpowiedzial na czas',
      body: 'W terenie potrafi to trwac zbyt dlugo, wiec przechodze na lokalizacje awaryjna, aby nie blokowac startu obserwacji.',
    };
  }

  return {
    title: 'Nie udalo sie ustalic GPS',
    body: 'Uzywam lokalizacji zastepczej Warszawy, bo odczyt pozycji z urzadzenia nie powiodl sie.',
  };
}

export default function ControlsContainer({
  currentScreen,
  layout,
  isMockEnabled,
  isGuidedTourOpen,
  isInfoPanelOpen,
  isLocationLoading,
  location,
  effectiveLocation,
  locationErrorKind,
  locationSource,
  selectedOfflineLocationName,
  onOpenCalibration,
  onOpenDragAlign,
  onToggleGuidedTour,
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
        delay: 300,
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

  const locationBannerCopy = getLocationBannerCopy({
    errorKind: locationErrorKind,
    locationSource,
    selectedOfflineLocationName,
  });
  const shouldShowLocationBanner =
    !isMockEnabled && (isLocationLoading || locationSource !== 'live');
  const locationSubtitle = isLocationLoading
    ? 'Wstepnie korzystam z lokalizacji Warszawy'
    : locationBannerCopy.body;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      pointerEvents="box-none"
    >
      {shouldShowLocationBanner ? (
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
                style={[
                  styles.locationBannerStatus,
                  { color: theme.locationBannerText },
                ]}
              >
                Szukam GPS...
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.locationBannerTitle,
                { color: theme.locationBannerText },
              ]}
            >
              {locationBannerCopy.title}
            </Text>
          )}
          <Text
            style={[
              styles.locationBannerText,
              { color: theme.locationBannerText },
            ]}
          >
            {locationSubtitle} ({effectiveLocation.latitude.toFixed(4)},{' '}
            {effectiveLocation.longitude.toFixed(4)})
          </Text>
          {locationSource === 'cache' && location ? (
            <Text
              style={[
                styles.locationBannerFootnote,
                { color: theme.locationBannerText },
              ]}
            >
              Ostatni zapis: {new Date(location.timestamp).toLocaleTimeString('pl-PL')}
            </Text>
          ) : null}
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
            Tryb mockow aktywny: symuluje heading, pitch i lokalizacje Warszawy.
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
        {isMenuOpen ? (
          <View style={styles.menuPanel}>
            <NightModeToggle
              bottomOffset={0}
              horizontalInset={0}
              compact={layout.isCompactFloatingUi}
              inline
            />
            {!isMockEnabled ? (
              <Pressable
                accessibilityHint="Pokazuje rekomendowane cele obserwacji na dzis."
                accessibilityLabel="Przewodnik na dzis"
                accessibilityRole="button"
                style={[
                  styles.calibrationButton,
                  layout.isCompactFloatingUi && styles.calibrationButtonCompact,
                  {
                    backgroundColor: isGuidedTourOpen
                      ? theme.accent
                      : theme.buttonBg,
                    borderColor: theme.borderStrongSubtle,
                  },
                ]}
                onPress={() => {
                  void tapMedium();
                  setIsMenuOpen(false);
                  onToggleGuidedTour();
                }}
              >
                <Text
                  style={[
                    styles.calibrationButtonText,
                    layout.isCompactFloatingUi &&
                      styles.calibrationButtonTextCompact,
                    {
                      color: isGuidedTourOpen ? theme.black : theme.title,
                      fontWeight: isGuidedTourOpen ? '800' : '600',
                    },
                  ]}
                >
                  {isGuidedTourOpen ? 'Ukryj przewodnik' : 'Przewodnik na dzis'}
                </Text>
              </Pressable>
            ) : null}
            {!isMockEnabled ? (
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
                    layout.isCompactFloatingUi &&
                      styles.calibrationButtonTextCompact,
                    { color: theme.title },
                  ]}
                >
                  Suwaki kalibracji
                </Text>
              </Pressable>
            ) : null}
            {!isMockEnabled ? (
              <Pressable
                accessibilityHint="Otwiera ekran strojenia recznego by przesunac niebo."
                accessibilityLabel="Strojenie reczne"
                accessibilityRole="button"
                style={[
                  styles.calibrationButton,
                  layout.isCompactFloatingUi && styles.calibrationButtonCompact,
                  {
                    backgroundColor: theme.accent,
                    borderColor: theme.borderStrongSubtle,
                  },
                ]}
                onPress={() => {
                  void tapMedium();
                  setIsMenuOpen(false);
                  onOpenDragAlign();
                }}
              >
                <Text
                  style={[
                    styles.calibrationButtonText,
                    layout.isCompactFloatingUi &&
                      styles.calibrationButtonTextCompact,
                    { color: theme.black, fontWeight: '800' },
                  ]}
                >
                  Dostroj (przesun)
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityLabel={isMenuOpen ? 'Zamknij menu' : 'Otworz menu ustawien'}
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
            setIsMenuOpen((previous) => !previous);
          }}
        >
          <Svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isMenuOpen ? theme.black : theme.title}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
  locationBannerFootnote: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.82,
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

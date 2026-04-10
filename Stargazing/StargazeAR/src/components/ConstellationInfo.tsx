import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';

import { useTheme } from '../context/ThemeContext';
import { ZIndex } from '../constants/zIndex';
import { isConstellationInSeason } from '../astronomy/seasons';
import { getVisibilityWarning, type VisibilityWarning } from '../astronomy/visibility';
import type { ProjectedConstellation, Star, ProjectedStar } from '../types';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';

type ConstellationInfoProps = {
  selected: ProjectedConstellation | null;
  isOpen: boolean;
  maxPanelHeight: number;
  onClose: () => void;
};

const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const SWIPE_DOWN_THRESHOLD = 60;
const SWIPE_CAPTURE_DELTA = 6;
const CLOSE_TRANSLATE_Y = 420;

function formatDegrees(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)}deg`;
}

function formatSignedDegrees(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}deg`;
}

function getCardinalDirection(azimuth: number | null | undefined) {
  if (azimuth === null || azimuth === undefined || Number.isNaN(azimuth)) {
    return '';
  }

  const normalized = ((azimuth % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % CARDINAL_DIRECTIONS.length;
  return CARDINAL_DIRECTIONS[index];
}

function getBrightestStar(stars: Star[]) {
  if (stars.length === 0) {
    return null;
  }

  return stars.reduce((currentBrightest, star) =>
    star.magnitude < currentBrightest.magnitude ? star : currentBrightest,
  );
}

function getVisibilityWarningCopy(visibilityWarning: VisibilityWarning) {
  if (visibilityWarning === 'very_low') {
    return {
      title: 'Bardzo nisko nad horyzontem',
      body: 'Konstelacja jest aktualnie poniżej 5° — silna refrakcja atmosferyczna i przeszkody terenowe praktycznie uniemożliwiają obserwację.',
    };
  }

  if (visibilityWarning === 'low') {
    return {
      title: 'Nisko nad horyzontem',
      body: 'Konstelacja jest aktualnie między 5° a 15° — obserwacja utrudniona przez atmosferę. Najlepiej próbować przy dobrej przejrzystości powietrza.',
    };
  }

  return null;
}

export default function ConstellationInfo({
  selected,
  isOpen,
  maxPanelHeight,
  onClose,
}: ConstellationInfoProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(CLOSE_TRANSLATE_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const [displayedSelected, setDisplayedSelected] =
    useState<ProjectedConstellation | null>(selected);

  const stateRef = useRef({ isOpen, onClose });

  useEffect(() => {
    stateRef.current = { isOpen, onClose };
  }, [isOpen, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) =>
          stateRef.current.isOpen &&
          gestureState.dy > SWIPE_CAPTURE_DELTA &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          opacity.stopAnimation();
        },
        onPanResponderMove: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          const nextTranslateY = Math.max(0, gestureState.dy);
          translateY.setValue(nextTranslateY);
          opacity.setValue(Math.max(0.78, 1 - nextTranslateY / 240));
        },
        onPanResponderRelease: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          if (gestureState.dy >= SWIPE_DOWN_THRESHOLD) {
            stateRef.current.onClose();
            return;
          }

          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 18,
              stiffness: 130,
              mass: 1,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 18,
              stiffness: 130,
              mass: 1,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [opacity, translateY],
  );

  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isOpen ? 0 : CLOSE_TRANSLATE_Y,
        duration: isOpen ? 220 : 220,
        easing: isOpen ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: isOpen ? 220 : 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !isOpen) {
        setIsRendered(false);
      }
    });
  }, [isOpen, opacity, translateY]);

  if (!isRendered) {
    return null;
  }

  useEffect(() => {
    if (!selected) {
      if (!isOpen) {
        setDisplayedSelected(null);
      }
      return;
    }

    if (!displayedSelected || !isOpen) {
      setDisplayedSelected(selected);
      contentOpacity.setValue(1);
      return;
    }

    if (displayedSelected.data.id === selected.data.id) {
      setDisplayedSelected(selected);
      return;
    }

    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }: { finished: boolean }) => {
      if (!finished) {
        return;
      }

      setDisplayedSelected(selected);
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 120,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [contentOpacity, displayedSelected, isOpen, selected]);

  const visibleStarsCount = displayedSelected
    ? displayedSelected.projectedStars.filter((star: ProjectedStar) => star.isVisible).length
    : 0;
  const brightestStar = useMemo(
    () =>
      displayedSelected ? getBrightestStar(displayedSelected.data.stars) : null,
    [displayedSelected],
  );
  const azimuthDirection = getCardinalDirection(displayedSelected?.azimuth);
  const subtitle = [
    displayedSelected?.data.nameEn,
    displayedSelected?.data.abbreviation,
  ]
    .filter(Boolean)
    .join(' / ');
  const description = displayedSelected?.data.description ?? '';
  const seasons = displayedSelected?.data.season;
  const seasonPl = seasons && seasons.length > 0 ? seasons.join(', ') : null;
  const isInSeason = displayedSelected ? isConstellationInSeason(displayedSelected.data) : false;
  const visibilityWarning = displayedSelected
    ? getVisibilityWarning(displayedSelected.altitude)
    : null;
  const visibilityWarningCopy = getVisibilityWarningCopy(visibilityWarning);
  const bottomPadding = Math.max(insets.bottom, 0) + 12;

  return (
    <Animated.View
      accessibilityElementsHidden={!isOpen}
      accessibilityViewIsModal={isOpen}
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.panel,
          {
            maxHeight: maxPanelHeight,
            backgroundColor: theme.panel,
            borderTopColor: theme.sheetBorderTop,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.glowOrb, { backgroundColor: theme.sheetGlow }]}
        />
        <View
          pointerEvents="none"
          style={[styles.topSheen, { backgroundColor: theme.sheetSheen }]}
        />

        <Animated.View
          style={[
            styles.contentFade,
            {
              opacity: contentOpacity,
            },
          ]}
        >
          <ScrollView
            accessibilityLabel={
              displayedSelected
                ? `Panel szczegolow gwiazdozbioru ${displayedSelected.data.name}`
                : 'Panel szczegolow gwiazdozbioru'
            }
            accessibilityRole="summary"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: bottomPadding,
              },
            ]}
          >
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={[styles.handle, { backgroundColor: theme.sheetHandle }]} />
            </View>

            <View style={styles.headerRow}>
              <View style={styles.headerSection}>
                <Text style={[styles.title, { color: theme.sheetTitle }]}>
                  {displayedSelected?.data.name ?? ''}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.sheetSubtitle }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel="Zamknij szczegóły gwiazdozbioru"
                accessibilityHint="Zamyka panel szczegolow i wraca do widoku nieba."
                accessibilityRole="button"
                onPress={onClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: theme.sheetHandle,
                  },
                ]}
              >
                <Text style={[styles.closeButtonText, { color: theme.sheetTitle }]}>
                  ×
                </Text>
              </Pressable>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsColumn}>
                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: theme.sheetStatLabel }]}>
                    Azimuth
                  </Text>
                  <Text style={[styles.statValue, { color: theme.sheetStatValue }]}>
                    {formatDegrees(displayedSelected?.azimuth)}
                    {azimuthDirection ? ` ${azimuthDirection}` : ''}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: theme.sheetStatLabel }]}>
                    Altitude
                  </Text>
                  <Text style={[styles.statValue, { color: theme.sheetStatValue }]}>
                    {formatSignedDegrees(displayedSelected?.altitude)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsColumn}>
                <View style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: theme.sheetStatLabel }]}>
                    Visible stars
                  </Text>
                  <Text style={[styles.statValue, { color: theme.sheetStatValue }]}>
                    {visibleStarsCount}
                  </Text>
                </View>

                {brightestStar ? (
                  <View style={styles.statCard}>
                    <Text style={[styles.statLabel, { color: theme.sheetStatLabel }]}>
                      Brightest star
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.statValue, { color: theme.sheetStatValue }]}
                    >
                      {brightestStar.name}
                    </Text>
                  </View>
                ) : null}

                {seasonPl ? (
                  <View style={styles.statCard}>
                    <Text style={[styles.statLabel, { color: theme.sheetStatLabel }]}>
                      Najlepszy sezon
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statValue, 
                        isInSeason ? { color: theme.accent } : { color: theme.sheetStatValue }
                      ]}
                    >
                      {isInSeason ? `${seasonPl} (Teraz)` : seasonPl}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {visibilityWarningCopy ? (
              <View accessibilityRole="text" style={styles.visibilityWarning}>
                <Text style={[styles.visibilityWarningTitle, { color: theme.warningTitle }]}>
                  {visibilityWarningCopy.title}
                </Text>
                <Text style={[styles.visibilityWarningBody, { color: theme.warningBody }]}>
                  {visibilityWarningCopy.body}
                </Text>
              </View>
            ) : null}

            {description ? (
              <View style={styles.descriptionSection}>
                <Text style={[styles.description, { color: theme.sheetDescription }]}>
                  {description}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: ZIndex.constellationInfo,
  },
  panel: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  glowOrb: {
    position: 'absolute',
    top: -72,
    right: -24,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
  },
  contentFade: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerSection: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  visibilityWarning: {
    marginTop: 10,
  },
  visibilityWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  visibilityWarningBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  statsColumn: {
    flex: 1,
    gap: 10,
  },
  statCard: {
    minHeight: 48,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  descriptionSection: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
});

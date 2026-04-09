import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from '../utils/reactNative';

import { useTheme } from '../context/ThemeContext';
import { ZIndex } from '../constants/zIndex';

type OnboardingHintVariant = 'default' | 'calibration';

type OnboardingHintProps = {
  isVisible: boolean;
  messageVariant: OnboardingHintVariant;
  bottomOffset: number;
  horizontalPadding: number;
  onDismiss?: () => void;
};

const HIDE_TRANSLATE_Y = 12;

const MESSAGES: Record<OnboardingHintVariant, { title: string; body: string }> = {
  default: {
    title: 'Wyrównaj niebo',
    body: 'Obróć telefon, by ustawić kadr. Dotknij etykiety, aby otworzyć szczegóły.',
  },
  calibration: {
    title: 'Uspokój kompas',
    body: 'Obróć telefon i lekko porusz nim w ósemkę. Dotknij wskazówki, aby ją ukryć.',
  },
};

export default function OnboardingHint({
  isVisible,
  messageVariant,
  bottomOffset,
  horizontalPadding,
  onDismiss,
}: OnboardingHintProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [shouldRender, setShouldRender] = useState(isVisible);
  const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const translateY = useRef(
    new Animated.Value(isVisible ? 0 : HIDE_TRANSLATE_Y),
  ).current;

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: HIDE_TRANSLATE_Y,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [isVisible, opacity, translateY]);

  const message = MESSAGES[messageVariant];
  const finalOpacity = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.96],
  });
  const cardMaxWidth = width < 360 ? 288 : width < 430 ? 304 : 320;
  const isDismissible = messageVariant === 'calibration' && onDismiss != null;

  if (!shouldRender) {
    return null;
  }

  const card = (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: theme.hintGlow,
          },
        ]}
      />

      <View style={styles.headerRow}>
        <View style={styles.accent}>
          <View
            style={[
              styles.accentDot,
              { backgroundColor: theme.hintAccentDot },
            ]}
          />
          <View
            style={[
              styles.accentLine,
              { backgroundColor: theme.hintAccentLine },
            ]}
          />
        </View>
        <Text style={[styles.title, { color: theme.hintTitle }]}>
          {message.title}
        </Text>
      </View>

      <Text style={[styles.body, { color: theme.hintBody }]}>
        {message.body}
      </Text>

      {isDismissible ? (
        <Text style={[styles.dismissHint, { color: theme.hintBody }]}>
          Dotknij karty, aby ukryć wskazówkę.
        </Text>
      ) : null}
    </>
  );

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          left: horizontalPadding,
          right: horizontalPadding,
          bottom: bottomOffset,
          opacity: finalOpacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {isDismissible ? (
        <Pressable
          accessibilityHint="Ukrywa wskazowke onboardingowa."
          accessibilityLabel={`${message.title}. ${message.body}`}
          accessibilityRole="button"
          onPress={onDismiss}
          style={[
            styles.card,
            {
              backgroundColor: theme.hint,
              borderColor: theme.borderSubtle,
              maxWidth: cardMaxWidth,
            },
          ]}
        >
          {card}
        </Pressable>
      ) : (
        <View
          accessibilityLabel={`${message.title}. ${message.body}`}
          accessibilityRole="text"
          style={[
            styles.card,
            {
              backgroundColor: theme.hint,
              borderColor: theme.borderSubtle,
              maxWidth: cardMaxWidth,
            },
          ]}
        >
          {card}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: ZIndex.onboardingHint,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    top: -26,
    right: -10,
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accent: {
    width: 28,
    height: 16,
    marginRight: 10,
    justifyContent: 'center',
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accentLine: {
    position: 'absolute',
    left: 10,
    right: 0,
    height: 2,
    borderRadius: 999,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});

import { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';

import { useTheme } from '../context/ThemeContext';
import { ZIndex } from '../constants/zIndex';
import { tapMedium } from '../utils/haptics';

type NightModeToggleProps = {
  bottomOffset: number;
  horizontalInset: number;
  compact?: boolean;
  inline?: boolean;
};

export default function NightModeToggle({
  bottomOffset,
  horizontalInset,
  compact = false,
  inline = false,
}: NightModeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const nextModeLabel = theme.nightMode ? 'dzienny' : 'nocny';

  function handlePress() {
    void tapMedium();
    toggleTheme();
  }

  function animatePressIn() {
    Animated.spring(scale, {
      toValue: 0.94,
      damping: 18,
      stiffness: 240,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }

  function animatePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      damping: 16,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        inline
          ? styles.wrapperInline
          : {
              left: horizontalInset,
              bottom: bottomOffset,
            },
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        accessibilityHint={`Przelacza widok na tryb ${nextModeLabel}.`}
        accessibilityLabel={
          theme.nightMode
            ? 'Tryb nocny wlaczony'
            : 'Tryb nocny wylaczony'
        }
        accessibilityRole="button"
        onPress={handlePress}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        style={[
          styles.button,
          compact && styles.buttonCompact,
          {
            backgroundColor: theme.toggle,
            borderColor: theme.borderStrong,
          },
        ]}
      >
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.accentDot,
            },
          ]}
        />
        <Text style={[styles.title, { color: theme.title }]}>
          {theme.nightMode ? 'Tryb nocny' : 'Tryb dzienny'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: ZIndex.controls,
  },
  wrapperInline: {
    position: 'relative',
  },
  button: {
    minWidth: 132,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonCompact: {
    minWidth: 116,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
});

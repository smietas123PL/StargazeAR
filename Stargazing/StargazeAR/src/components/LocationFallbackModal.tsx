import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';

import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapMedium } from '../utils/haptics';

import type { OfflineLocationOption } from '../types';

type LocationFallbackModalProps = {
  isVisible: boolean;
  options: OfflineLocationOption[];
  onSelect: (option: OfflineLocationOption) => void;
};

export default function LocationFallbackModal({
  isVisible,
  options,
  onSelect,
}: LocationFallbackModalProps) {
  const { theme } = useTheme();

  if (!isVisible) {
    return null;
  }

  return (
    <View
      accessibilityViewIsModal
      style={styles.backdrop}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.panel,
            borderColor: theme.borderStrongSubtle,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          Tryb offline
        </Text>
        <Text style={[styles.title, { color: theme.title }]}>
          Nie mozemy Cie zlokalizowac w ciemnosci
        </Text>
        <Text style={[styles.body, { color: theme.body }]}>
          GPS nie odpowiedzial w ciagu 5 sekund, a lokalny cache jest pusty.
          Wybierz miasto startowe i zacznij obserwacje w 100% offline.
        </Text>

        <View style={styles.optionList}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityLabel={`Wybierz lokalizacje ${option.name}`}
              accessibilityRole="button"
              style={[
                styles.optionButton,
                {
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                void tapMedium();
                onSelect(option);
              }}
            >
              <Text style={[styles.optionTitle, { color: theme.title }]}>
                {option.name}
              </Text>
              <Text style={[styles.optionMeta, { color: theme.body }]}>
                {option.location.latitude.toFixed(4)}, {option.location.longitude.toFixed(4)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.calibration + 20,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
  },
  optionList: {
    marginTop: 18,
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
});

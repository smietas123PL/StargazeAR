import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';

import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapLight, tapMedium } from '../utils/haptics';
import type { GuidedTourItem } from '../hooks/useGuidedTour';

type GuidedTourPanelProps = {
  isOpen: boolean;
  items: GuidedTourItem[];
  selectedTargetId: string | null;
  bottomOffset: number;
  horizontalPadding: number;
  onClose: () => void;
  onSelect: (id: string) => void;
};

const HIDDEN_TRANSLATE_Y = 140;

export default function GuidedTourPanel({
  isOpen,
  items,
  selectedTargetId,
  bottomOffset,
  horizontalPadding,
  onClose,
  onSelect,
}: GuidedTourPanelProps) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(HIDDEN_TRANSLATE_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isOpen ? 0 : HIDDEN_TRANSLATE_Y,
        duration: isOpen ? 240 : 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: isOpen ? 220 : 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          left: horizontalPadding,
          right: horizontalPadding,
          bottom: bottomOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.panel,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>
              Przewodnik na dzis
            </Text>
            <Text style={[styles.title, { color: theme.title }]}>
              Zacznij od najlepiej ustawionych gwiazdozbiorow
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Zamknij przewodnik"
            accessibilityRole="button"
            style={[
              styles.closeButton,
              {
                backgroundColor: theme.buttonBg,
                borderColor: theme.borderStrongSubtle,
              },
            ]}
            onPress={() => {
              void tapLight();
              onClose();
            }}
          >
            <Text style={[styles.closeLabel, { color: theme.title }]}>x</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
        >
          {items.map((item) => {
            const isSelected = item.id === selectedTargetId;
            return (
              <Pressable
                key={item.id}
                accessibilityLabel={`Namierz ${item.title}`}
                accessibilityRole="button"
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected
                      ? theme.accent
                      : theme.borderStrongSubtle,
                  },
                ]}
                onPress={() => {
                  void tapMedium();
                  onSelect(item.id);
                }}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isSelected ? theme.black : theme.title },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: isSelected ? theme.black : theme.body },
                  ]}
                >
                  {item.subtitle}
                </Text>
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(0,0,0,0.12)'
                          : theme.buttonBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isSelected ? theme.black : theme.accent },
                      ]}
                    >
                      Alt {item.constellation.altitude.toFixed(0)} deg
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(0,0,0,0.12)'
                          : theme.buttonBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isSelected ? theme.black : theme.accent },
                      ]}
                    >
                      {item.isMainStarVisible ? 'Latwy start' : 'Wymaga obrotu'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: ZIndex.controls,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardList: {
    gap: 12,
    paddingTop: 14,
  },
  card: {
    width: 228,
    minHeight: 136,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

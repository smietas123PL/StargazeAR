import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { DEFAULT_CALIBRATION } from '../constants/defaults';
import { notifySuccess, notifyWarning, tapLight } from '../utils/haptics';
import { clamp } from '../utils/math';
import type { CalibrationData } from '../types';

type CalibrationScreenProps = {
  currentCalibration: CalibrationData;
  currentHeading: number;
  currentPitch: number;
  onSave: (calibration: CalibrationData) => void;
  onCancel: () => void;
};

type FooterButtonVariant = 'primary' | 'secondary';
type AdjustableField = keyof Pick<
  CalibrationData,
  'azimuthOffset' | 'pitchOffset' | 'fovDegrees'
>;

const STEP_REPEAT_INITIAL_MS = 150;
const STEP_REPEAT_MIN_MS = 60;
const STEP_REPEAT_DECAY_MS = 15;
const STEP_LONG_PRESS_DELAY_MS = 220;
const SAVE_SUCCESS_FLASH_MS = 600;

function formatSignedAngle(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}°`;
}

export default function CalibrationScreen({
  currentCalibration,
  currentHeading,
  currentPitch,
  onSave,
  onCancel,
}: CalibrationScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  const saveFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState<CalibrationData>(currentCalibration);
  const [isSavePending, setIsSavePending] = useState(false);

  useEffect(() => {
    setDraft(currentCalibration);
  }, [currentCalibration]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  useEffect(() => {
    return () => {
      if (saveFlashTimeoutRef.current) {
        clearTimeout(saveFlashTimeoutRef.current);
      }
    };
  }, []);


  function updateField(
    field: AdjustableField,
    delta: number,
    min: number,
    max: number,
  ) {
    setDraft((previous) => ({
      ...previous,
      [field]: clamp(previous[field] + delta, min, max),
    }));
  }

  function resetToDefaults() {
    void notifyWarning();
    setDraft({
      ...DEFAULT_CALIBRATION,
      calibratedAt: currentCalibration.calibratedAt,
      version: 1,
    });
  }

  function handleSave() {
    if (isSavePending) {
      return;
    }

    setIsSavePending(true);
    void notifySuccess();

    if (saveFlashTimeoutRef.current) {
      clearTimeout(saveFlashTimeoutRef.current);
    }

    saveFlashTimeoutRef.current = setTimeout(() => {
      onSave({
        ...draft,
        version: 1,
        calibratedAt: Date.now(),
      });
    }, SAVE_SUCCESS_FLASH_MS);
  }

  const formattedCalibrationDate = useMemo(() => {
    if (!currentCalibration.calibratedAt) {
      return 'Brak zapisanej kalibracji';
    }

    return new Date(currentCalibration.calibratedAt).toLocaleString('pl-PL');
  }, [currentCalibration.calibratedAt]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fade,
          backgroundColor: theme.background,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <ScrollView
          accessibilityLabel="Ekran kalibracji widoku nieba"
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.eyebrow, { color: theme.accent }]}>Kalibracja</Text>
          <Text style={[styles.title, { color: theme.title }]}>
            Dostrój overlay do rzeczywistego nieba
          </Text>
          <Text style={[styles.description, { color: theme.body }]}>
            Skoryguj przesunięcie poziome, pionowe i pole widzenia, aż etykiety
            oraz gwiazdy zaczną lepiej pokrywać się z tym, co widzisz przez
            kamerę.
          </Text>
          <Text style={[styles.subHeader, { color: theme.body }]}>
            Dostosuj azymut, jeśli gwiazdy są obrócone. Zmień FOV, jeśli ich skala
            nie pasuje.
          </Text>

          <View
            style={[
              styles.sensorRow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.sensorCell}>
              <Text style={[styles.sensorLabel, { color: theme.body }]}>Heading</Text>
              <Text style={[styles.sensorValue, { color: theme.accent }]}>
                {currentHeading.toFixed(1)}°
              </Text>
            </View>
            <View style={styles.sensorDivider} />
            <View style={styles.sensorCell}>
              <Text style={[styles.sensorLabel, { color: theme.body }]}>Pitch</Text>
              <Text style={[styles.sensorValue, { color: theme.accent }]}>
                {formatSignedAngle(currentPitch)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.infoLabel, { color: theme.accent }]}>
              Ostatnia zapisana kalibracja
            </Text>
            <Text style={[styles.infoValue, { color: theme.body }]}>
              {formattedCalibrationDate}
            </Text>
            <Text style={[styles.infoHint, { color: theme.body }]}>
              Przywrócenie domyślnych nie zmienia czasu ostatniego zapisu, dopóki
              nie klikniesz „Zapisz”.
            </Text>
          </View>

          <AdjustmentRow
            label="Przesunięcie azymutu"
            description="Koryguje obrót lewo/prawo"
            value={draft.azimuthOffset}
            unit="°"
            min={-45}
            max={45}
            step={1}
            decreaseAccessibilityLabel="Zmniejsz przesuniecie azymutu"
            increaseAccessibilityLabel="Zwieksz przesuniecie azymutu"
            onDecrease={() => updateField('azimuthOffset', -1, -45, 45)}
            onIncrease={() => updateField('azimuthOffset', 1, -45, 45)}
          />

          <AdjustmentRow
            label="Przesunięcie pitch"
            description="Koryguje położenie góra/dół"
            value={draft.pitchOffset}
            unit="°"
            min={-20}
            max={20}
            step={1}
            decreaseAccessibilityLabel="Zmniejsz przesuniecie pitch"
            increaseAccessibilityLabel="Zwieksz przesuniecie pitch"
            onDecrease={() => updateField('pitchOffset', -1, -20, 20)}
            onIncrease={() => updateField('pitchOffset', 1, -20, 20)}
          />

          <AdjustmentRow
            label="Poziome FOV kamery"
            description="Dopasowuje skalę całego overlayu"
            value={draft.fovDegrees}
            unit="°"
            min={40}
            max={90}
            step={1}
            decreaseAccessibilityLabel="Zmniejsz poziome pole widzenia kamery"
            increaseAccessibilityLabel="Zwieksz poziome pole widzenia kamery"
            onDecrease={() => updateField('fovDegrees', -1, 40, 90)}
            onIncrease={() => updateField('fovDegrees', 1, 40, 90)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Text style={[styles.footerHint, { color: theme.body }]}>
            Anuluj zamyka ekran bez zapisywania zmian.
          </Text>

          <View style={styles.footerActions}>
            <FooterButton
              label="Anuluj"
              variant="secondary"
              onPress={onCancel}
              disabled={isSavePending}
            />
            <FooterButton
              label="Przywróć domyślne"
              variant="secondary"
              onPress={resetToDefaults}
              disabled={isSavePending}
            />
            <FooterButton
              label={isSavePending ? 'Zapisano ✓' : 'Zapisz'}
              variant="primary"
              onPress={handleSave}
              disabled={isSavePending}
            />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

type AdjustmentRowProps = {
  label: string;
  description: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  decreaseAccessibilityLabel: string;
  increaseAccessibilityLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
};

function AdjustmentRow({
  label,
  description,
  value,
  unit,
  min,
  max,
  step,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
  onDecrease,
  onIncrease,
}: AdjustmentRowProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.adjustmentCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.adjustmentLabel, { color: theme.title }]}>{label}</Text>
      <Text style={[styles.adjustmentDescription, { color: theme.body }]}>
        {description}
      </Text>
      <Text style={[styles.adjustmentMeta, { color: theme.accent }]}>
        Zakres: {min}
        {unit} do {max}
        {unit} | Krok: {step}
        {unit}
      </Text>

      <View style={styles.adjustmentControls}>
        <StepButton
          accessibilityLabel={decreaseAccessibilityLabel}
          label="-"
          onPress={onDecrease}
        />
        <View
          style={[
            styles.valuePill,
            { backgroundColor: theme.calibrationValuePill },
          ]}
        >
          <Text style={[styles.valueText, { color: theme.title }]}>
            {value >= 0 ? '+' : ''}
            {value.toFixed(0)}
            {unit}
          </Text>
        </View>
        <StepButton
          accessibilityLabel={increaseAccessibilityLabel}
          label="+"
          onPress={onIncrease}
        />
      </View>
    </View>
  );
}

type StepButtonProps = {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
};

function StepButton({
  accessibilityLabel,
  label,
  onPress,
}: StepButtonProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
      }
    };
  }, []);

  function animateScale(nextValue: number) {
    Animated.spring(scale, {
      toValue: nextValue,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }

  function stopRepeating() {
    if (!repeatTimeoutRef.current) {
      return;
    }

    clearTimeout(repeatTimeoutRef.current);
    repeatTimeoutRef.current = null;
  }

  function triggerStep() {
    void tapLight();
    onPress();
  }

  function scheduleRepeat(delay: number) {
    repeatTimeoutRef.current = setTimeout(() => {
      triggerStep();
      scheduleRepeat(
        Math.max(STEP_REPEAT_MIN_MS, delay - STEP_REPEAT_DECAY_MS),
      );
    }, delay);
  }

  function handlePress() {
    if (didLongPressRef.current) {
      return;
    }

    triggerStep();
  }

  function handleLongPress() {
    didLongPressRef.current = true;
    triggerStep();
    scheduleRepeat(STEP_REPEAT_INITIAL_MS);
  }

  function handlePressIn() {
    animateScale(0.92);
  }

  function handlePressOut() {
    animateScale(1);
    stopRepeating();
    didLongPressRef.current = false;
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityHint="Dotknij, aby zmienic wartosc o jeden krok. Przytrzymaj, aby przyspieszyc zmiane."
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        delayLongPress={STEP_LONG_PRESS_DELAY_MS}
        onLongPress={handleLongPress}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.stepButton,
          {
            backgroundColor: theme.calibrationStepButton,
          },
        ]}
      >
        <Text style={[styles.stepButtonText, { color: theme.white }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

type FooterButtonProps = {
  label: string;
  variant: FooterButtonVariant;
  onPress: () => void;
  disabled?: boolean;
};

function FooterButton({
  label,
  variant,
  onPress,
  disabled = false,
}: FooterButtonProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';

  function animateScale(nextValue: number) {
    Animated.spring(scale, {
      toValue: nextValue,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        accessibilityHint={
          label === 'Anuluj'
            ? 'Zamyka ekran kalibracji bez zapisywania zmian.'
            : label === 'Przywróć domyślne'
              ? 'Przywraca domyślne wartości kalibracji.'
              : 'Zapisuje aktualne ustawienia kalibracji.'
        }
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
        style={[
          isPrimary ? styles.primaryButton : styles.secondaryButton,
          isPrimary
            ? {
                backgroundColor: theme.accent,
                opacity: disabled ? 0.82 : 1,
              }
            : {
                borderColor: theme.border,
                backgroundColor: theme.calibrationSecondaryButton,
                opacity: disabled ? 0.72 : 1,
              },
        ]}
      >
        <Text
          style={[
            isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
            { color: isPrimary ? theme.black : theme.title },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.calibration,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 14,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  subHeader: {
    fontSize: 13,
    lineHeight: 19,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sensorCell: {
    flex: 1,
  },
  sensorDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sensorLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  adjustmentCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  adjustmentLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  adjustmentDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  adjustmentMeta: {
    fontSize: 11,
    marginBottom: 14,
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 24,
    fontWeight: '700',
  },
  valuePill: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    gap: 12,
  },
  footerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});

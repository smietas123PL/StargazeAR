import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';

import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapMedium, notifySuccess } from '../utils/haptics';
import type { CalibrationData } from '../types';

type DragAlignOverlayProps = {
  currentCalibration: CalibrationData;
  setDragCalibrationTemp: (cal: CalibrationData | null) => void;
  onSave: (calibration: CalibrationData) => void;
  onCancel: () => void;
};

const PIXELS_PER_DEGREE = 5; // How much drag means 1 degree

export default function DragAlignOverlay({
  currentCalibration,
  setDragCalibrationTemp,
  onSave,
  onCancel,
}: DragAlignOverlayProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const initialCalRef = useRef<CalibrationData | null>(null);

  // We keep a local ref of the current temp calibration to easily save it.
  const tempCalRef = useRef<CalibrationData>(currentCalibration);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          initialCalRef.current = { ...tempCalRef.current };
        },
        onPanResponderMove: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          if (!initialCalRef.current) return;
          
          const nextCalibration = {
            ...initialCalRef.current,
            azimuthOffset: initialCalRef.current.azimuthOffset + gestureState.dx / PIXELS_PER_DEGREE,
            pitchOffset: initialCalRef.current.pitchOffset - gestureState.dy / PIXELS_PER_DEGREE,
          };
          
          tempCalRef.current = nextCalibration;
          setDragCalibrationTemp(nextCalibration);
        },
        onPanResponderRelease: () => {
          initialCalRef.current = null;
        },
        onPanResponderTerminate: () => {
          initialCalRef.current = null;
        },
      }),
    [setDragCalibrationTemp]
  );

  function handleSave() {
    void notifySuccess();
    onSave({
      ...tempCalRef.current,
      version: 1,
      calibratedAt: Date.now(),
    });
  }

  function handleCancel() {
    setDragCalibrationTemp(null);
    onCancel();
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} {...panResponder.panHandlers}>
      <View style={[styles.header, { top: insets.top + 20 }]}>
        <Text style={[styles.title, { color: theme.accent }]}>Strojenie Ręczne</Text>
        <Text style={[styles.subtitle, { color: theme.white }]}>
          Przesuwaj palcem po ekranie, aby dopasować gwiazdy do widoku z kamery.
        </Text>
      </View>

      {/* Crosshair indicator to help center the view visually */}
      <View style={styles.centerIndicator} pointerEvents="none">
        <View style={[styles.crosshairLineHorizontal, { backgroundColor: theme.accent }]} />
        <View style={[styles.crosshairLineVertical, { backgroundColor: theme.accent }]} />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={handleCancel}
          style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.buttonText, { color: theme.title }]}>Anuluj</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleSave}
          style={[styles.button, styles.saveButton, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.saveButtonText, { color: theme.black }]}>Zapisz pozycję</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.calibration + 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  centerIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairLineHorizontal: {
    position: 'absolute',
    width: 40,
    height: 1,
    opacity: 0.5,
  },
  crosshairLineVertical: {
    position: 'absolute',
    width: 1,
    height: 40,
    opacity: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'rgba(30, 30, 35, 0.8)',
  },
  saveButton: {
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

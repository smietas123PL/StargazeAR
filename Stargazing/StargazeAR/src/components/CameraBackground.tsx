import { useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';

import { useTheme } from '../context/ThemeContext';

type CameraBackgroundProps = {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
};

export default function CameraBackground({
  onPermissionGranted,
  onPermissionDenied,
}: CameraBackgroundProps) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const shouldOpenSettings = permission?.canAskAgain === false;
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission?.granted) {
      onPermissionGranted();
    }
  }, [onPermissionGranted, permission?.granted]);

  useEffect(() => {
    if (permission && !permission.granted) {
      onPermissionDenied();
    }
  }, [onPermissionDenied, permission]);

  useEffect(() => {
    if (permission) {
      shimmerProgress.stopAnimation();
      shimmerProgress.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      shimmerProgress.stopAnimation();
    };
  }, [permission, shimmerProgress]);

  if (!permission) {
    return (
      <View
        accessibilityLabel="Trwa sprawdzanie uprawnien kamery"
        accessibilityLiveRegion="polite"
        style={[styles.loading, { backgroundColor: theme.black }]}
      >
        <View
          style={[
            styles.loadingPanel,
            {
              backgroundColor: theme.overlay,
              borderColor: theme.borderSubtle,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.loadingShimmer,
              {
                backgroundColor: theme.cameraPermissionButton,
                opacity: shimmerProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.08, 0.18, 0.08],
                }),
                transform: [
                  {
                    translateX: shimmerProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-160, 160],
                    }),
                  },
                  { rotate: '16deg' },
                ],
              },
            ]}
          />
          <ActivityIndicator color={theme.cameraPermissionIcon} size="large" />
          <Text style={[styles.loadingText, { color: theme.cameraLoadingText }]}>
            Sprawdzam uprawnienia kamery...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    const permissionBody = shouldOpenSettings
      ? 'Dostęp do kamery został wcześniej zablokowany. Otwórz ustawienia systemowe i włącz aparat dla StargazeAR.'
      : 'Kamera jest używana jako tło dla nakładki obserwacyjnej, więc bez tego uprawnienia nie uruchomimy głównego widoku.';

    return (
      <View style={[styles.permissionScreen, { backgroundColor: theme.black }]}>
        <Text style={[styles.permissionIcon, { color: theme.cameraPermissionIcon }]}>
          ◍
        </Text>
        <Text
          style={[
            styles.permissionTitle,
            { color: theme.cameraPermissionTitle },
          ]}
        >
          StargazeAR potrzebuje dostępu do aparatu
        </Text>
        <Text
          style={[styles.permissionBody, { color: theme.cameraPermissionBody }]}
        >
          {permissionBody}
        </Text>
        <Pressable
          accessibilityHint={
            shouldOpenSettings
              ? 'Otwiera ustawienia systemowe dla aplikacji.'
              : 'Prosi system o zgode na uzycie kamery.'
          }
          accessibilityLabel={
            shouldOpenSettings ? 'Otworz ustawienia kamery' : 'Zezwol na kamere'
          }
          accessibilityRole="button"
          style={[
            styles.permissionButton,
            { backgroundColor: theme.cameraPermissionButton },
          ]}
          onPress={() => {
            if (shouldOpenSettings) {
              void Linking.openSettings();
              return;
            }

            void requestPermission();
          }}
        >
          <Text
            style={[
              styles.permissionButtonText,
              { color: theme.cameraPermissionButtonText },
            ]}
          >
            {shouldOpenSettings ? 'Otwórz ustawienia' : 'Zezwól na kamerę'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
    >
      <CameraView facing="back" style={StyleSheet.absoluteFillObject} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingPanel: {
    minWidth: 250,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  loadingShimmer: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    width: 96,
  },
  loadingText: {
    fontSize: 15,
  },
  permissionScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from '../utils/reactNative';

import { Palette } from '../constants/palette';

export type AppTheme = {
  nightMode: boolean;
  background: string;
  surface: string;
  overlay: string;
  float: string;
  panel: string;
  hint: string;
  toggle: string;
  warning: string;
  buttonBg: string;
  border: string;
  borderStrong: string;
  borderSubtle: string;
  borderStrongSubtle: string;
  borderAlert: string;
  title: string;
  body: string;
  accent: string;
  muted: string;
  star: string;
  north: string;
  accentDot: string;
  warningTitle: string;
  warningBody: string;
  compassText: string;
  compassStrong: string;
  compassWeak: string;
  compassInnerFrame: string;
  compassInnerRing: string;
  compassDiagonalTick: string;
  compassStatusWeak: string;
  compassStatusStrong: string;
  compassCenterDot: string;
  skyDepthStops: readonly [string, string, string];
  skyHorizonStops: readonly [string, string, string];
  skyVignetteBorder: string;
  skyBaseOpen: string;
  skyBaseDefault: string;
  sheetGlow: string;
  sheetSheen: string;
  sheetHandle: string;
  sheetBorderTop: string;
  sheetTitle: string;
  sheetSubtitle: string;
  sheetStatLabel: string;
  sheetStatValue: string;
  sheetDescription: string;
  hintTitle: string;
  hintBody: string;
  hintGlow: string;
  hintAccentLine: string;
  hintAccentDot: string;
  reticleOuterRing: string;
  reticleMainRing: string;
  reticleSegment: string;
  reticleDot: string;
  starLine: string;
  starGlow: string;
  starLabel: string;
  starDebug: string;
  starDebugText: string;
  starLabelSelectedFill: string;
  starLabelSelectedStroke: string;
  starLabelFill: string;
  starLabelStroke: string;
  calibrationStepButton: string;
  calibrationValuePill: string;
  calibrationSecondaryButton: string;
  locationBannerBg: string;
  locationBannerBorder: string;
  locationBannerText: string;
  mockBannerBg: string;
  mockBannerBorder: string;
  mockBannerText: string;
  debugCardBg: string;
  debugCardBorder: string;
  debugTitle: string;
  debugText: string;
  debugWarning: string;
  cameraLoadingText: string;
  cameraPermissionIcon: string;
  cameraPermissionTitle: string;
  cameraPermissionBody: string;
  cameraPermissionButton: string;
  cameraPermissionButtonText: string;
  transparent: string;
  black: string;
  white: string;
};

type ThemeContextValue = {
  theme: AppTheme;
  toggleTheme: () => void;
};

function createTheme(mode: 'day' | 'night'): AppTheme {
  const palette = mode === 'night' ? Palette.night : Palette.day;

  return {
    nightMode: mode === 'night',
    background: palette.base,
    surface: palette.surface,
    overlay: palette.overlay,
    float: palette.float,
    panel: palette.panel,
    hint: palette.hint,
    toggle: palette.toggle,
    warning: palette.warning,
    buttonBg: palette.buttonBg,
    border: palette.border,
    borderStrong: palette.borderStrong,
    borderSubtle: palette.borderSubtle,
    borderStrongSubtle: palette.borderStrongSubtle,
    borderAlert: palette.borderAlert,
    title: palette.title,
    body: palette.body,
    accent: palette.accent,
    muted: palette.muted,
    star: palette.star,
    north: palette.north,
    accentDot: palette.accentDot,
    warningTitle: palette.warningTitle,
    warningBody: palette.warningBody,
    compassText: palette.compassText,
    compassStrong: palette.compassStrong,
    compassWeak: palette.compassWeak,
    compassInnerFrame: palette.compassInnerFrame,
    compassInnerRing: palette.compassInnerRing,
    compassDiagonalTick: palette.compassDiagonalTick,
    compassStatusWeak: palette.compassStatusWeak,
    compassStatusStrong: palette.compassStatusStrong,
    compassCenterDot: palette.compassCenterDot,
    skyDepthStops: palette.skyDepthStops,
    skyHorizonStops: palette.skyHorizonStops,
    skyVignetteBorder: palette.skyVignetteBorder,
    skyBaseOpen: palette.skyBaseOpen,
    skyBaseDefault: palette.skyBaseDefault,
    sheetGlow: palette.sheetGlow,
    sheetSheen: palette.sheetSheen,
    sheetHandle: palette.sheetHandle,
    sheetBorderTop: palette.sheetBorderTop,
    sheetTitle: palette.sheetTitle,
    sheetSubtitle: palette.sheetSubtitle,
    sheetStatLabel: palette.sheetStatLabel,
    sheetStatValue: palette.sheetStatValue,
    sheetDescription: palette.sheetDescription,
    hintTitle: palette.hintTitle,
    hintBody: palette.hintBody,
    hintGlow: palette.hintGlow,
    hintAccentLine: palette.hintAccentLine,
    hintAccentDot: palette.hintAccentDot,
    reticleOuterRing: palette.reticleOuterRing,
    reticleMainRing: palette.reticleMainRing,
    reticleSegment: palette.reticleSegment,
    reticleDot: palette.reticleDot,
    starLine: palette.starLine,
    starGlow: palette.starGlow,
    starLabel: palette.starLabel,
    starDebug: palette.starDebug,
    starDebugText: palette.starDebugText,
    starLabelSelectedFill: palette.starLabelSelectedFill,
    starLabelSelectedStroke: palette.starLabelSelectedStroke,
    starLabelFill: palette.starLabelFill,
    starLabelStroke: palette.starLabelStroke,
    calibrationStepButton: palette.calibrationStepButton,
    calibrationValuePill: palette.calibrationValuePill,
    calibrationSecondaryButton: palette.calibrationSecondaryButton,
    locationBannerBg: palette.locationBannerBg,
    locationBannerBorder: palette.locationBannerBorder,
    locationBannerText: palette.locationBannerText,
    mockBannerBg: palette.mockBannerBg,
    mockBannerBorder: palette.mockBannerBorder,
    mockBannerText: palette.mockBannerText,
    debugCardBg: palette.debugCardBg,
    debugCardBorder: palette.debugCardBorder,
    debugTitle: palette.debugTitle,
    debugText: palette.debugText,
    debugWarning: palette.debugWarning,
    cameraLoadingText: palette.cameraLoadingText,
    cameraPermissionIcon: palette.cameraPermissionIcon,
    cameraPermissionTitle: palette.cameraPermissionTitle,
    cameraPermissionBody: palette.cameraPermissionBody,
    cameraPermissionButton: palette.cameraPermissionButton,
    cameraPermissionButtonText: palette.cameraPermissionButtonText,
    transparent: Palette.shared.transparent,
    black: Palette.shared.black,
    white: Palette.shared.white,
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = '@StargazeAR/theme_nightMode';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [nightMode, setNightMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== null) {
          setNightMode(stored === 'true');
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    void loadTheme();
  }, []);

  const value = useMemo(
    () => ({
      theme: createTheme(nightMode ? 'night' : 'day'),
      toggleTheme: () => {
        setNightMode((previous) => {
          const next = !previous;
          AsyncStorage.setItem(THEME_STORAGE_KEY, String(next)).catch((error) => {
            console.warn('Failed to save theme preference:', error);
          });
          return next;
        });
      },
    }),
    [nightMode],
  );

  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#050A14' }} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return value;
}

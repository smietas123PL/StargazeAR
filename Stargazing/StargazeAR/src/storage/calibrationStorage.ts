import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CalibrationData } from '../types';
import { LegacyStorageKeys, StorageKeys } from './storageKeys';

async function migrateLegacyCalibrationKey(): Promise<string | null> {
  const legacyValue = await AsyncStorage.getItem(LegacyStorageKeys.calibration);

  if (!legacyValue) {
    return null;
  }

  await AsyncStorage.setItem(StorageKeys.calibration, legacyValue);
  await AsyncStorage.removeItem(LegacyStorageKeys.calibration);
  return legacyValue;
}

/**
 * Wczytuje zapisana kalibracje z pamieci lokalnej.
 *
 * Przy bledzie lub zlym formacie zwracamy `null`,
 * zeby warstwa wyzej mogla uzyc wartosci domyslnych.
 */
export async function loadCalibration(): Promise<CalibrationData | null> {
  try {
    const rawValue =
      (await AsyncStorage.getItem(StorageKeys.calibration)) ??
      (await migrateLegacyCalibrationKey());

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<CalibrationData>;

    if (
      (parsed.version !== undefined && parsed.version !== 1) ||
      typeof parsed.azimuthOffset !== 'number' ||
      typeof parsed.pitchOffset !== 'number' ||
      typeof parsed.fovDegrees !== 'number' ||
      typeof parsed.calibratedAt !== 'number'
    ) {
      return null;
    }

    return {
      version: 1,
      azimuthOffset: parsed.azimuthOffset,
      pitchOffset: parsed.pitchOffset,
      fovDegrees: parsed.fovDegrees,
      calibratedAt: parsed.calibratedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Zapisuje kalibracje do AsyncStorage.
 *
 * Ewentualny blad nie powinien wywrocic UI.
 */
export async function saveCalibration(
  calibration: CalibrationData,
  onError?: (err: unknown) => void,
): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.calibration, JSON.stringify(calibration));
  } catch (error) {
    onError?.(error);
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageKeys } from './storageKeys';

import type { UserLocation } from '../types';

function isUserLocation(value: unknown): value is UserLocation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<UserLocation>;

  return (
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number' &&
    typeof candidate.timestamp === 'number' &&
    (typeof candidate.altitude === 'number' || candidate.altitude === null)
  );
}

export async function loadLastKnownLocation(): Promise<UserLocation | null> {
  try {
    const rawValue = await AsyncStorage.getItem(StorageKeys.lastKnownLocation);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return isUserLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveLastKnownLocation(
  location: UserLocation,
): Promise<void> {
  await AsyncStorage.setItem(
    StorageKeys.lastKnownLocation,
    JSON.stringify(location),
  );
}

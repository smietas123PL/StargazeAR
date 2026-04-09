import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageKeys } from './storageKeys';

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.onboarding, 'true');
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const rawValue = await AsyncStorage.getItem(StorageKeys.onboarding);
    return rawValue === 'true';
  } catch {
    return false;
  }
}

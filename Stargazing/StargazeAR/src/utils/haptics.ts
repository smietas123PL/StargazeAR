import * as Haptics from 'expo-haptics';

import { Platform } from './reactNative';

async function runHaptic(effect: () => Promise<void>) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await effect();
  } catch {
    // Haptics are optional feedback only.
  }
}

export function tapLight() {
  return runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
}

export function tapMedium() {
  return runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  );
}

export function notifySuccess() {
  return runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function notifyWarning() {
  return runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}

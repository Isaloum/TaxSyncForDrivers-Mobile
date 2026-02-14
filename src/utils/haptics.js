import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light haptic feedback — use for taps, toggles, chip selections.
 */
export function lightTap() {
  if (!isNative) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // Haptics not available (e.g. simulator)
  }
}

/**
 * Medium haptic feedback — use for confirms, saves, key actions.
 */
export function mediumTap() {
  if (!isNative) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } catch {
    // Haptics not available
  }
}

/**
 * Success haptic — use after saving, exporting, completing onboarding.
 */
export function successNotification() {
  if (!isNative) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // Haptics not available
  }
}

/**
 * Error/warning haptic — use on validation failure, delete confirm.
 */
export function errorNotification() {
  if (!isNative) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } catch {
    // Haptics not available
  }
}

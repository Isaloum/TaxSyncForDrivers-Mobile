import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback — use for taps, toggles, chip selections.
 */
export function lightTap() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics not available (e.g. simulator, web)
  }
}

/**
 * Medium haptic feedback — use for confirms, saves, key actions.
 */
export function mediumTap() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics not available
  }
}

/**
 * Success haptic — use after saving, exporting, completing onboarding.
 */
export function successNotification() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available
  }
}

/**
 * Error/warning haptic — use on validation failure, delete confirm.
 */
export function errorNotification() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not available
  }
}

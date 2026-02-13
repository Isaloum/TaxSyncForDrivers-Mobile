import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = 'taxsync_notification_prefs';

const DEFAULT_PREFS = {
  taxDeadlineReminder: true,
  weeklyReceiptReminder: true,
  mileageReminder: true,
  gstFilingReminder: true,
};

// CRA key dates
const TAX_DEADLINES = [
  { id: 'tax_deadline_april', month: 3, day: 30, titleEn: 'Tax Filing Deadline Tomorrow', titleFr: 'Date limite de d\u00e9claration demain', bodyEn: 'April 30 is the CRA filing deadline for most individuals. File your T1 return!', bodyFr: 'Le 30 avril est la date limite de d\u00e9claration de l\u2019ARC. Produisez votre d\u00e9claration T1\u00a0!' },
  { id: 'tax_deadline_june', month: 5, day: 15, titleEn: 'Self-Employment Filing Deadline', titleFr: 'Date limite des travailleurs autonomes', bodyEn: 'June 15 is the CRA deadline for self-employed filers. Ensure your T2125 is ready!', bodyFr: 'Le 15 juin est la date limite de l\u2019ARC pour les travailleurs autonomes. Pr\u00e9parez votre T2125\u00a0!' },
  { id: 'gst_q1', month: 3, day: 31, titleEn: 'GST/HST Quarterly Reminder', titleFr: 'Rappel trimestriel TPS/TVH', bodyEn: 'Q1 GST/HST installment may be due. Review your CRA obligations.', bodyFr: 'L\u2019acompte TPS/TVH du T1 est peut-\u00eatre d\u00fb. V\u00e9rifiez vos obligations \u00e0 l\u2019ARC.' },
  { id: 'gst_q2', month: 5, day: 30, titleEn: 'GST/HST Quarterly Reminder', titleFr: 'Rappel trimestriel TPS/TVH', bodyEn: 'Q2 GST/HST installment may be due. Review your CRA obligations.', bodyFr: 'L\u2019acompte TPS/TVH du T2 est peut-\u00eatre d\u00fb. V\u00e9rifiez vos obligations \u00e0 l\u2019ARC.' },
  { id: 'gst_q3', month: 8, day: 30, titleEn: 'GST/HST Quarterly Reminder', titleFr: 'Rappel trimestriel TPS/TVH', bodyEn: 'Q3 GST/HST installment may be due. Review your CRA obligations.', bodyFr: 'L\u2019acompte TPS/TVH du T3 est peut-\u00eatre d\u00fb. V\u00e9rifiez vos obligations \u00e0 l\u2019ARC.' },
  { id: 'gst_q4', month: 11, day: 31, titleEn: 'GST/HST Quarterly Reminder', titleFr: 'Rappel trimestriel TPS/TVH', bodyEn: 'Q4 GST/HST installment may be due. Review your CRA obligations.', bodyFr: 'L\u2019acompte TPS/TVH du T4 est peut-\u00eatre d\u00fb. V\u00e9rifiez vos obligations \u00e0 l\u2019ARC.' },
];

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getNotificationPrefs() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export async function saveNotificationPrefs(prefs) {
  const current = await getNotificationPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

export async function requestPermissions() {
  if (!Device.isDevice) {
    return { granted: false, reason: 'simulator' };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return { granted: true };

  const { status } = await Notifications.requestPermissionsAsync();
  return { granted: status === 'granted' };
}

export async function scheduleAllNotifications(language = 'en') {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const prefs = await getNotificationPrefs();

  // Tax deadline reminders
  if (prefs.taxDeadlineReminder) {
    for (const deadline of TAX_DEADLINES.filter((d) => !d.id.startsWith('gst_'))) {
      await scheduleYearlyNotification(deadline, language);
    }
  }

  // GST/HST quarterly reminders
  if (prefs.gstFilingReminder) {
    for (const deadline of TAX_DEADLINES.filter((d) => d.id.startsWith('gst_'))) {
      await scheduleYearlyNotification(deadline, language);
    }
  }

  // Weekly receipt reminder (every Sunday at 7pm)
  if (prefs.weeklyReceiptReminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'fr' ? 'Rappel hebdomadaire' : 'Weekly Receipt Reminder',
        body: language === 'fr'
          ? 'Avez-vous des re\u00e7us \u00e0 enregistrer cette semaine\u00a0?'
          : 'Have you logged all your receipts this week?',
      },
      trigger: { weekday: 1, hour: 19, minute: 0, repeats: true },
    });
  }

  // Mileage reminder (every Friday at 6pm)
  if (prefs.mileageReminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'fr' ? 'Rappel de kilom\u00e9trage' : 'Mileage Reminder',
        body: language === 'fr'
          ? 'N\u2019oubliez pas de consigner vos trajets de la semaine\u00a0!'
          : 'Don\u2019t forget to log your trips for the week!',
      },
      trigger: { weekday: 6, hour: 18, minute: 0, repeats: true },
    });
  }
}

async function scheduleYearlyNotification(deadline, language) {
  const title = language === 'fr' ? deadline.titleFr : deadline.titleEn;
  const body = language === 'fr' ? deadline.bodyFr : deadline.bodyEn;

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { month: deadline.month + 1, day: deadline.day, hour: 9, minute: 0, repeats: true },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

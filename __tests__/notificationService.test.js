import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-notifications
const mockScheduleNotification = jest.fn(() => Promise.resolve('notif-id'));
const mockCancelAll = jest.fn(() => Promise.resolve());
const mockGetAllScheduled = jest.fn(() => Promise.resolve([]));
const mockGetPermissions = jest.fn(() => Promise.resolve({ status: 'granted' }));
const mockRequestPermissions = jest.fn(() => Promise.resolve({ status: 'granted' }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: mockScheduleNotification,
  cancelAllScheduledNotificationsAsync: mockCancelAll,
  getAllScheduledNotificationsAsync: mockGetAllScheduled,
  getPermissionsAsync: mockGetPermissions,
  requestPermissionsAsync: mockRequestPermissions,
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

const {
  getNotificationPrefs,
  saveNotificationPrefs,
  requestPermissions,
  scheduleAllNotifications,
  cancelAllNotifications,
  getScheduledNotifications,
} = require('../src/services/notificationService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notificationService', () => {
  describe('getNotificationPrefs', () => {
    it('returns defaults when nothing stored', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const prefs = await getNotificationPrefs();
      expect(prefs).toEqual({
        taxDeadlineReminder: true,
        weeklyReceiptReminder: true,
        mileageReminder: true,
        gstFilingReminder: true,
      });
    });

    it('merges stored prefs with defaults', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ mileageReminder: false }));
      const prefs = await getNotificationPrefs();
      expect(prefs.mileageReminder).toBe(false);
      expect(prefs.taxDeadlineReminder).toBe(true);
    });

    it('handles parse error gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('invalid-json');
      const prefs = await getNotificationPrefs();
      expect(prefs.taxDeadlineReminder).toBe(true);
    });
  });

  describe('saveNotificationPrefs', () => {
    it('saves merged prefs to AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const result = await saveNotificationPrefs({ weeklyReceiptReminder: false });
      expect(result.weeklyReceiptReminder).toBe(false);
      expect(result.taxDeadlineReminder).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'taxsync_notification_prefs',
        expect.any(String)
      );
    });
  });

  describe('requestPermissions', () => {
    it('returns granted when permission already granted', async () => {
      mockGetPermissions.mockResolvedValueOnce({ status: 'granted' });
      const result = await requestPermissions();
      expect(result.granted).toBe(true);
    });

    it('requests permission when not yet granted', async () => {
      mockGetPermissions.mockResolvedValueOnce({ status: 'undetermined' });
      mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
      const result = await requestPermissions();
      expect(result.granted).toBe(true);
      expect(mockRequestPermissions).toHaveBeenCalled();
    });

    it('returns not granted when denied', async () => {
      mockGetPermissions.mockResolvedValueOnce({ status: 'undetermined' });
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
      const result = await requestPermissions();
      expect(result.granted).toBe(false);
    });
  });

  describe('scheduleAllNotifications', () => {
    it('cancels existing notifications first', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      await scheduleAllNotifications('en');
      expect(mockCancelAll).toHaveBeenCalledTimes(1);
    });

    it('schedules notifications based on prefs', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // all defaults = true
      await scheduleAllNotifications('en');
      // Should schedule: 2 tax deadlines + 4 GST quarters + 1 weekly receipt + 1 mileage = 8
      expect(mockScheduleNotification).toHaveBeenCalledTimes(8);
    });

    it('skips disabled categories', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({ taxDeadlineReminder: false, gstFilingReminder: false, weeklyReceiptReminder: false, mileageReminder: false })
      );
      await scheduleAllNotifications('en');
      expect(mockScheduleNotification).not.toHaveBeenCalled();
    });

    it('uses French content when language is fr', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({ taxDeadlineReminder: false, gstFilingReminder: false, weeklyReceiptReminder: true, mileageReminder: false })
      );
      await scheduleAllNotifications('fr');
      expect(mockScheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Rappel hebdomadaire',
          }),
        })
      );
    });

    it('only schedules selected categories', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({ taxDeadlineReminder: true, gstFilingReminder: false, weeklyReceiptReminder: false, mileageReminder: false })
      );
      await scheduleAllNotifications('en');
      // Only 2 tax deadlines
      expect(mockScheduleNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelAllNotifications', () => {
    it('delegates to expo-notifications', async () => {
      await cancelAllNotifications();
      expect(mockCancelAll).toHaveBeenCalled();
    });
  });

  describe('getScheduledNotifications', () => {
    it('returns list from expo-notifications', async () => {
      mockGetAllScheduled.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);
      const list = await getScheduledNotifications();
      expect(list).toHaveLength(2);
    });
  });
});

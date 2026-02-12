// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

const Haptics = require('expo-haptics');
const { lightTap, mediumTap, successNotification, errorNotification } = require('../src/utils/haptics');

describe('haptics utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lightTap calls impactAsync with Light', () => {
    lightTap();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  test('mediumTap calls impactAsync with Medium', () => {
    mediumTap();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
  });

  test('successNotification calls notificationAsync with Success', () => {
    successNotification();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  test('errorNotification calls notificationAsync with Error', () => {
    errorNotification();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  test('lightTap does not throw when haptics fails', () => {
    Haptics.impactAsync.mockImplementation(() => { throw new Error('fail'); });
    expect(() => lightTap()).not.toThrow();
  });

  test('successNotification does not throw when haptics fails', () => {
    Haptics.notificationAsync.mockImplementation(() => { throw new Error('fail'); });
    expect(() => successNotification()).not.toThrow();
  });
});

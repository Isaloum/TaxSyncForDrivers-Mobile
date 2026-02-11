import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// --- Mock modules that components depend on ---
jest.mock('../src/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key) => {
      const map = {
        'mileage.business': 'Business',
        'mileage.personal': 'Personal',
        'receipts.category': 'Category',
        'common.loading': 'Loading...',
      };
      return map[key] || key;
    },
    setLanguage: jest.fn(),
  }),
}));

jest.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isDark: false,
    colors: {
      primary: '#0a7670',
      primaryLight: '#14b8a6',
      background: '#f8fafc',
      card: '#ffffff',
      success: '#10b981',
      successLight: '#ecfdf5',
      warning: '#f59e0b',
      warningLight: '#fffbeb',
      danger: '#ef4444',
      dangerLight: '#fef2f2',
      text: '#0f172a',
      muted: '#64748b',
      mutedLight: '#f1f5f9',
      border: '#e2e8f0',
      white: '#ffffff',
      black: '#000000',
      shadow: '#000000',
    },
    setTheme: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// --- Import components AFTER mocks ---
import LoadingIndicator from '../src/components/LoadingIndicator';
import EmptyState from '../src/components/EmptyState';
import BusinessPersonalToggle from '../src/components/BusinessPersonalToggle';
import SummaryCard from '../src/components/SummaryCard';
import ReceiptCard from '../src/components/ReceiptCard';
import TripCard from '../src/components/TripCard';

describe('LoadingIndicator', () => {
  it('renders with a message', () => {
    const { getByText } = render(<LoadingIndicator message="Loading..." />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders without message', () => {
    const { toJSON } = render(<LoadingIndicator />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState title="No items" subtitle="Add something" />
    );
    expect(getByText('No items')).toBeTruthy();
    expect(getByText('Add something')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Empty"
        subtitle="Start here"
        actionLabel="Add Item"
        onAction={onPress}
      />
    );
    const button = getByText('Add Item');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('BusinessPersonalToggle', () => {
  it('renders Business and Personal buttons', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <BusinessPersonalToggle isBusinessTrip={true} onChange={onChange} />
    );
    expect(getByText('Business')).toBeTruthy();
    expect(getByText('Personal')).toBeTruthy();
  });

  it('calls onChange when toggled', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <BusinessPersonalToggle isBusinessTrip={true} onChange={onChange} />
    );
    fireEvent.press(getByText('Personal'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange to business when personal is active', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <BusinessPersonalToggle isBusinessTrip={false} onChange={onChange} />
    );
    fireEvent.press(getByText('Business'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('SummaryCard', () => {
  it('renders label and value', () => {
    const { getByText } = render(
      <SummaryCard label="Total" value="$500.00" />
    );
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('$500.00')).toBeTruthy();
  });
});

describe('ReceiptCard', () => {
  it('renders receipt data', () => {
    const receipt = {
      id: 'r1',
      expense: {
        date: '2026-01-15',
        amount: 45.50,
        vendor: 'Shell',
        category: 'fuel',
      },
    };
    const onPress = jest.fn();
    const { getByText } = render(
      <ReceiptCard receipt={receipt} onPress={onPress} />
    );
    expect(getByText('Shell')).toBeTruthy();
    expect(getByText('$45.50')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const receipt = {
      id: 'r1',
      expense: {
        date: '2026-01-15',
        amount: 25.00,
        vendor: 'Costco',
        category: 'supplies',
      },
    };
    const onPress = jest.fn();
    const { getByText } = render(
      <ReceiptCard receipt={receipt} onPress={onPress} />
    );
    fireEvent.press(getByText('Costco'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('TripCard', () => {
  it('renders trip data', () => {
    const trip = {
      id: 't1',
      date: '2026-02-01',
      destination: 'Client Office',
      distance: 42,
      isBusinessTrip: true,
    };
    const onPress = jest.fn();
    const { getByText } = render(
      <TripCard trip={trip} onPress={onPress} />
    );
    expect(getByText('Client Office')).toBeTruthy();
    expect(getByText('42 km')).toBeTruthy();
  });

  it('shows business badge for business trips', () => {
    const trip = {
      id: 't2',
      date: '2026-02-01',
      destination: 'Airport',
      distance: 30,
      isBusinessTrip: true,
    };
    const { getByText } = render(
      <TripCard trip={trip} onPress={jest.fn()} />
    );
    expect(getByText('Business')).toBeTruthy();
  });

  it('shows personal badge for personal trips', () => {
    const trip = {
      id: 't3',
      date: '2026-02-01',
      destination: 'Grocery Store',
      distance: 5,
      isBusinessTrip: false,
    };
    const { getByText } = render(
      <TripCard trip={trip} onPress={jest.fn()} />
    );
    expect(getByText('Personal')).toBeTruthy();
  });
});

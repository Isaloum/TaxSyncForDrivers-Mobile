# TaxSyncForDrivers Mobile

React Native (Expo) mobile companion app for [TaxSyncForDrivers](https://github.com/Isaloum/TaxSyncForDrivers). Built for Canadian rideshare and delivery drivers to track expenses, mileage, and tax deductions on the go.

## Features

- **Receipt Management** - Add, edit, delete receipts with CRA-aligned categories
- **Camera Capture** - Scan and attach receipt photos directly from your phone
- **Mileage Logging** - Track business/personal trips with odometer readings
- **Dashboard** - Visual overview with charts for expenses, mileage trends, and tax summary
- **CRA Compliance** - Categories aligned with T2125 form, GST/QST calculations, 6-year retention tracking
- **Province-Aware Taxes** - Supports all 13 Canadian provinces/territories
- **Data Export** - Export receipts (CSV), mileage (CSV), or full backup (JSON)
- **Bilingual** - English and French language support (i18n)
- **Offline-First** - All data stored locally on device via AsyncStorage

## Tech Stack

- React Native 0.73 + Expo SDK 50
- React Navigation v6 (Stack + Bottom Tabs)
- AsyncStorage for local persistence
- expo-camera for receipt scanning
- expo-file-system + expo-sharing for data export

## Project Structure

```
TaxSyncForDrivers-Mobile/
├── assets/              # App icons and splash screen
├── src/
│   ├── components/      # Reusable UI components
│   ├── constants/       # Theme tokens, CRA categories, tax rates
│   ├── i18n/            # Internationalization (EN/FR translations)
│   ├── navigation/      # AppNavigator with bottom tabs
│   ├── screens/         # All app screens
│   ├── services/        # Storage service (AsyncStorage CRUD)
│   └── utils/           # Validation, calculations, export
├── __tests__/           # Jest test suites
└── .github/workflows/   # CI/CD pipeline
```

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Start the development server:**
   ```sh
   npx expo start
   ```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

4. **Run tests:**
   ```sh
   npm test
   ```

## CRA Tax Compliance

This app follows Canada Revenue Agency (CRA) guidelines:

- **Receipt Categories**: Fuel, Maintenance, Insurance, Supplies, Office, Telephone, Advertising, Other
- **T2125 Expense Codes**: Each category maps to the correct CRA line code
- **Mileage Rates (2026)**: $0.70/km first 5,000 km, $0.64/km after (+$0.04 for territories)
- **GST/QST**: 5% GST calculated for all provinces, 9.975% QST added for Quebec
- **Data Retention**: 6-year retention dates tracked per CRA requirements

## License

Private - All rights reserved.

import { VEHICLE_RATES_2026 } from '../constants/categories';

export function calculateSimplifiedDeduction(businessKm, isNorthernTerritory = false) {
  if (businessKm <= 0) return 0;

  const first5000 = Math.min(businessKm, 5000);
  const after5000 = Math.max(0, businessKm - 5000);

  let deduction =
    first5000 * VEHICLE_RATES_2026.first5000km +
    after5000 * VEHICLE_RATES_2026.after5000km;

  if (isNorthernTerritory) {
    deduction += businessKm * VEHICLE_RATES_2026.territories;
  }

  return Math.round(deduction * 100) / 100;
}

export function calculateBusinessPercentage(trips) {
  if (!trips.length) return 0;
  const totalKm = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
  if (totalKm === 0) return 0;
  const businessKm = trips
    .filter((t) => t.isBusinessTrip)
    .reduce((sum, t) => sum + (t.distance || 0), 0);
  return Math.round((businessKm / totalKm) * 10000) / 100;
}

export function getTripSummary(trips) {
  const businessTrips = trips.filter((t) => t.isBusinessTrip);
  const personalTrips = trips.filter((t) => !t.isBusinessTrip);

  const businessKm = businessTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const personalKm = personalTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const totalKm = businessKm + personalKm;
  const businessPercent = calculateBusinessPercentage(trips);
  const estimatedDeduction = calculateSimplifiedDeduction(businessKm);

  return {
    totalKm,
    businessKm,
    personalKm,
    businessPercent,
    totalTrips: trips.length,
    businessTripCount: businessTrips.length,
    personalTripCount: personalTrips.length,
    estimatedDeduction,
  };
}

export function getLastOdometerReading(trips) {
  if (!trips.length) return 0;
  const sorted = [...trips].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted[0].endOdometer;
}

export function checkCRAThreshold(businessPercent) {
  const CRA_THRESHOLD = 90;
  return {
    exceedsThreshold: businessPercent > CRA_THRESHOLD,
    businessPercent,
    threshold: CRA_THRESHOLD,
  };
}

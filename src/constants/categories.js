// Receipt categories — CRA-aligned, matching web app
export const RECEIPT_CATEGORIES = [
  { key: 'fuel', label: 'Fuel', labelFr: 'Carburant' },
  { key: 'maintenance', label: 'Maintenance', labelFr: 'Entretien' },
  { key: 'insurance', label: 'Insurance', labelFr: 'Assurance' },
  { key: 'supplies', label: 'Supplies', labelFr: 'Fournitures' },
  { key: 'office', label: 'Office', labelFr: 'Bureau' },
  { key: 'telephone', label: 'Telephone', labelFr: 'Téléphone' },
  { key: 'advertising', label: 'Advertising', labelFr: 'Publicité' },
  { key: 'other', label: 'Other', labelFr: 'Autre' },
];

// T2125 business expense categories
export const EXPENSE_CATEGORIES = {
  ADVERTISING: { label: 'Advertising', labelFr: 'Publicité', code: '8521', deductionRate: 1.0 },
  MEALS_ENTERTAINMENT: { label: 'Meals & Entertainment', labelFr: 'Repas et divertissement', code: '8523', deductionRate: 0.5 },
  INSURANCE: { label: 'Insurance', labelFr: 'Assurance', code: '9804', deductionRate: 1.0 },
  INTEREST: { label: 'Interest & Bank Charges', labelFr: 'Intérêts et frais bancaires', code: '8710', deductionRate: 1.0 },
  FEES: { label: 'Professional Fees', labelFr: 'Honoraires professionnels', code: '8862', deductionRate: 1.0 },
  OFFICE: { label: 'Office Expenses', labelFr: 'Frais de bureau', code: '8810', deductionRate: 1.0 },
  SUPPLIES: { label: 'Supplies', labelFr: 'Fournitures', code: '8811', deductionRate: 1.0 },
  PHONE_UTILITIES: { label: 'Phone & Utilities', labelFr: 'Téléphone et services publics', code: '9220', deductionRate: 1.0 },
  RENT: { label: 'Rent', labelFr: 'Loyer', code: '8960', deductionRate: 1.0 },
  REPAIRS: { label: 'Repairs & Maintenance', labelFr: 'Réparations et entretien', code: '9270', deductionRate: 1.0 },
  TRAVEL: { label: 'Travel', labelFr: 'Voyage', code: '9200', deductionRate: 1.0 },
  VEHICLE: { label: 'Vehicle Expenses', labelFr: 'Dépenses de véhicule', code: '9281', deductionRate: 1.0 },
  HOME_OFFICE: { label: 'Home Office', labelFr: 'Bureau à domicile', code: '9945', deductionRate: 1.0 },
  OTHER: { label: 'Other Expenses', labelFr: 'Autres dépenses', code: '9270', deductionRate: 1.0 },
};

// Vehicle expense rates (2026 CRA simplified method)
export const VEHICLE_RATES_2026 = {
  first5000km: 0.70,
  after5000km: 0.64,
  territories: 0.04,
};

// GST/QST rates
export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
export const REGISTRATION_THRESHOLD = 30000;

// CRA retention requirement
export const RETENTION_YEARS = 6;
export const CRA_RECEIPT_THRESHOLD = 75;

// Map old mobile categories to new CRA-aligned keys
export const LEGACY_CATEGORY_MAP = {
  Gas: 'fuel',
  Food: 'other',
  Parking: 'other',
  Maintenance: 'maintenance',
  Supplies: 'supplies',
  Other: 'other',
};

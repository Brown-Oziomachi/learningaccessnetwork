// lib/africanCountries.js
// bankList: true  -> Flutterwave's banks endpoint returns a bank list for this country
// bankList: false -> Flutterwave can pay out there, but the seller enters their bank manually
export const AFRICAN_COUNTRIES = [
  // Countries with a Flutterwave bank list
  { code: 'EG', name: 'Egypt', dial: '+20', bankList: true },
  { code: 'ET', name: 'Ethiopia', dial: '+251', bankList: true },
  { code: 'GH', name: 'Ghana', dial: '+233', bankList: true },
  { code: 'KE', name: 'Kenya', dial: '+254', bankList: true },
  { code: 'MW', name: 'Malawi', dial: '+265', bankList: true },
  { code: 'NG', name: 'Nigeria', dial: '+234', bankList: true },
  { code: 'RW', name: 'Rwanda', dial: '+250', bankList: true },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', bankList: true },
  { code: 'ZA', name: 'South Africa', dial: '+27', bankList: true },
  { code: 'TZ', name: 'Tanzania', dial: '+255', bankList: true },
  { code: 'UG', name: 'Uganda', dial: '+256', bankList: true },

  // Payout countries without a bank list
  { code: 'BF', name: 'Burkina Faso', dial: '+226', bankList: false },
  { code: 'CM', name: 'Cameroon', dial: '+237', bankList: false },
  { code: 'CI', name: "Cote d'Ivoire", dial: '+225', bankList: false },
  { code: 'GN', name: 'Guinea', dial: '+224', bankList: false },
  { code: 'GW', name: 'Guinea-Bissau', dial: '+245', bankList: false },
  { code: 'ML', name: 'Mali', dial: '+223', bankList: false },
  { code: 'SN', name: 'Senegal', dial: '+221', bankList: false },
  { code: 'TN', name: 'Tunisia', dial: '+216', bankList: false },
  { code: 'ZM', name: 'Zambia', dial: '+260', bankList: false },
];

export const getCountry = (code) =>
  AFRICAN_COUNTRIES.find(c => c.code === String(code || '').toUpperCase()) || null;
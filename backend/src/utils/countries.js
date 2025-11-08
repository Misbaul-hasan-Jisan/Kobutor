// backend/utils/countries.js
export const countries = [
  { code: 'BD', name: 'Bangladesh', zone: 'local' },
  { code: 'US', name: 'United States', zone: 'international' },
  { code: 'GB', name: 'United Kingdom', zone: 'international' },
  { code: 'CA', name: 'Canada', zone: 'international' },
  { code: 'AU', name: 'Australia', zone: 'international' },
  { code: 'DE', name: 'Germany', zone: 'international' },
  { code: 'FR', name: 'France', zone: 'international' },
  { code: 'JP', name: 'Japan', zone: 'international' },
  { code: 'KR', name: 'South Korea', zone: 'international' },
  { code: 'SG', name: 'Singapore', zone: 'international' },
  { code: 'MY', name: 'Malaysia', zone: 'international' },
  { code: 'IN', name: 'India', zone: 'international' },
  { code: 'PK', name: 'Pakistan', zone: 'international' },
  // Add more countries as needed
];

export const getCountryByCode = (code) => 
  countries.find(country => country.code === code);

export const getCountriesByZone = (zone) => 
  countries.filter(country => country.zone === zone);

export const getLocalCountries = () => getCountriesByZone('local');
export const getInternationalCountries = () => getCountriesByZone('international');
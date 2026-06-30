export interface Country {
  code: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  lat: number;
  lon: number;
}

export interface LocationData {
  city: City;
  lastUpdated: string;
}

export interface UserLocationPreferences {
  defaultLocation: City | null;
  favorites: City[];
  recentSearches: City[];
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KR', name: 'South Korea' },
];

export const POPULAR_CITIES: City[] = [
  { id: 'us-sf', name: 'San Francisco', countryCode: 'US', country: 'United States', lat: 37.7749, lon: -122.4194 },
  { id: 'us-ny', name: 'New York', countryCode: 'US', country: 'United States', lat: 40.7128, lon: -74.006 },
  { id: 'us-la', name: 'Los Angeles', countryCode: 'US', country: 'United States', lat: 34.0522, lon: -118.2437 },
  { id: 'us-chi', name: 'Chicago', countryCode: 'US', country: 'United States', lat: 41.8781, lon: -87.6298 },
  { id: 'us-mia', name: 'Miami', countryCode: 'US', country: 'United States', lat: 25.7617, lon: -80.1918 },
  { id: 'us-sea', name: 'Seattle', countryCode: 'US', country: 'United States', lat: 47.6062, lon: -122.3321 },
  { id: 'us-dnv', name: 'Denver', countryCode: 'US', country: 'United States', lat: 39.7392, lon: -104.9903 },
  { id: 'us-hou', name: 'Houston', countryCode: 'US', country: 'United States', lat: 29.7604, lon: -95.3698 },
  { id: 'gb-lon', name: 'London', countryCode: 'GB', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { id: 'gb-man', name: 'Manchester', countryCode: 'GB', country: 'United Kingdom', lat: 53.4808, lon: -2.2426 },
  { id: 'gb-edi', name: 'Edinburgh', countryCode: 'GB', country: 'United Kingdom', lat: 55.9533, lon: -3.1883 },
  { id: 'ca-tor', name: 'Toronto', countryCode: 'CA', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { id: 'ca-van', name: 'Vancouver', countryCode: 'CA', country: 'Canada', lat: 49.2827, lon: -123.1207 },
  { id: 'ca-mon', name: 'Montreal', countryCode: 'CA', country: 'Canada', lat: 45.5017, lon: -73.5673 },
  { id: 'au-syd', name: 'Sydney', countryCode: 'AU', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { id: 'au-mel', name: 'Melbourne', countryCode: 'AU', country: 'Australia', lat: -37.8136, lon: 144.9631 },
  { id: 'au-bri', name: 'Brisbane', countryCode: 'AU', country: 'Australia', lat: -27.4698, lon: 153.0251 },
  { id: 'de-ber', name: 'Berlin', countryCode: 'DE', country: 'Germany', lat: 52.52, lon: 13.405 },
  { id: 'de-mun', name: 'Munich', countryCode: 'DE', country: 'Germany', lat: 48.1351, lon: 11.582 },
  { id: 'de-ham', name: 'Hamburg', countryCode: 'DE', country: 'Germany', lat: 53.5511, lon: 9.9937 },
  { id: 'fr-par', name: 'Paris', countryCode: 'FR', country: 'France', lat: 48.8566, lon: 2.3522 },
  { id: 'fr-mar', name: 'Marseille', countryCode: 'FR', country: 'France', lat: 43.2965, lon: 5.3698 },
  { id: 'jp-tok', name: 'Tokyo', countryCode: 'JP', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { id: 'jp-osa', name: 'Osaka', countryCode: 'JP', country: 'Japan', lat: 34.6937, lon: 135.5023 },
  { id: 'in-mum', name: 'Mumbai', countryCode: 'IN', country: 'India', lat: 19.076, lon: 72.8777 },
  { id: 'in-del', name: 'Delhi', countryCode: 'IN', country: 'India', lat: 28.7041, lon: 77.1025 },
  { id: 'in-ban', name: 'Bangalore', countryCode: 'IN', country: 'India', lat: 12.9716, lon: 77.5946 },
  { id: 'br-sao', name: 'Sao Paulo', countryCode: 'BR', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { id: 'br-rio', name: 'Rio de Janeiro', countryCode: 'BR', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
  { id: 'mx-mex', name: 'Mexico City', countryCode: 'MX', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { id: 'mx-can', name: 'Cancun', countryCode: 'MX', country: 'Mexico', lat: 21.1619, lon: -86.8515 },
  { id: 'es-mad', name: 'Madrid', countryCode: 'ES', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  { id: 'es-bar', name: 'Barcelona', countryCode: 'ES', country: 'Spain', lat: 41.3874, lon: 2.1686 },
  { id: 'it-rom', name: 'Rome', countryCode: 'IT', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  { id: 'it-mil', name: 'Milan', countryCode: 'IT', country: 'Italy', lat: 45.4642, lon: 9.19 },
  { id: 'nl-ams', name: 'Amsterdam', countryCode: 'NL', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  { id: 'se-sto', name: 'Stockholm', countryCode: 'SE', country: 'Sweden', lat: 59.3293, lon: 18.0686 },
  { id: 'no-osl', name: 'Oslo', countryCode: 'NO', country: 'Norway', lat: 59.9139, lon: 10.7522 },
  { id: 'fi-hel', name: 'Helsinki', countryCode: 'FI', country: 'Finland', lat: 60.1699, lon: 24.9384 },
  { id: 'dk-cop', name: 'Copenhagen', countryCode: 'DK', country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  { id: 'nz-auc', name: 'Auckland', countryCode: 'NZ', country: 'New Zealand', lat: -36.8509, lon: 174.7645 },
  { id: 'sg-sin', name: 'Singapore', countryCode: 'SG', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { id: 'kr-seo', name: 'Seoul', countryCode: 'KR', country: 'South Korea', lat: 37.5665, lon: 126.978 },
];
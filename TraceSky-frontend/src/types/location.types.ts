export interface Country {
  code: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface IndianState {
  name: string;
  cities: City[];
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

export const INDIAN_STATES: IndianState[] = [
  {
    name: 'Andhra Pradesh',
    cities: [
      { id: 'in-vizag', name: 'Visakhapatnam', countryCode: 'IN', country: 'India', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
      { id: 'in-amar', name: 'Amaravati', countryCode: 'IN', country: 'India', state: 'Andhra Pradesh', lat: 16.5412, lon: 80.5143 },
      { id: 'in-vija', name: 'Vijayawada', countryCode: 'IN', country: 'India', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
    ],
  },
  {
    name: 'Bihar',
    cities: [
      { id: 'in-pat', name: 'Patna', countryCode: 'IN', country: 'India', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
      { id: 'in-gaya', name: 'Gaya', countryCode: 'IN', country: 'India', state: 'Bihar', lat: 24.7955, lon: 84.9994 },
    ],
  },
  {
    name: 'Delhi',
    cities: [
      { id: 'in-del', name: 'Delhi', countryCode: 'IN', country: 'India', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
    ],
  },
  {
    name: 'Gujarat',
    cities: [
      { id: 'in-ahm', name: 'Ahmedabad', countryCode: 'IN', country: 'India', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
      { id: 'in-sur', name: 'Surat', countryCode: 'IN', country: 'India', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
      { id: 'in-vad', name: 'Vadodara', countryCode: 'IN', country: 'India', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
      { id: 'in-raj', name: 'Rajkot', countryCode: 'IN', country: 'India', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
    ],
  },
  {
    name: 'Haryana',
    cities: [
      { id: 'in-chd', name: 'Chandigarh', countryCode: 'IN', country: 'India', state: 'Haryana', lat: 30.7333, lon: 76.7794 },
      { id: 'in-far', name: 'Faridabad', countryCode: 'IN', country: 'India', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
    ],
  },
  {
    name: 'Karnataka',
    cities: [
      { id: 'in-ban', name: 'Bengaluru', countryCode: 'IN', country: 'India', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
      { id: 'in-mys', name: 'Mysuru', countryCode: 'IN', country: 'India', state: 'Karnataka', lat: 12.2958, lon: 76.6394 },
      { id: 'in-hub', name: 'Hubli', countryCode: 'IN', country: 'India', state: 'Karnataka', lat: 15.3647, lon: 75.1240 },
    ],
  },
  {
    name: 'Kerala',
    cities: [
      { id: 'in-tvm', name: 'Thiruvananthapuram', countryCode: 'IN', country: 'India', state: 'Kerala', lat: 8.5241, lon: 76.9366 },
      { id: 'in-kochi', name: 'Kochi', countryCode: 'IN', country: 'India', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
      { id: 'in-koz', name: 'Kozhikode', countryCode: 'IN', country: 'India', state: 'Kerala', lat: 11.2588, lon: 75.7804 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    cities: [
      { id: 'in-ind', name: 'Indore', countryCode: 'IN', country: 'India', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
      { id: 'in-bho', name: 'Bhopal', countryCode: 'IN', country: 'India', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
      { id: 'in-gwa', name: 'Gwalior', countryCode: 'IN', country: 'India', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
    ],
  },
  {
    name: 'Maharashtra',
    cities: [
      { id: 'in-mum', name: 'Mumbai', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
      { id: 'in-pun', name: 'Pune', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
      { id: 'in-nag', name: 'Nagpur', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
      { id: 'in-nas', name: 'Nashik', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
      { id: 'in-tha', name: 'Thane', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 19.2183, lon: 72.9781 },
      { id: 'in-aur', name: 'Aurangabad', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 19.8762, lon: 75.3433 },
    ],
  },
  {
    name: 'Odisha',
    cities: [
      { id: 'in-bhu', name: 'Bhubaneswar', countryCode: 'IN', country: 'India', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
      { id: 'in-cut', name: 'Cuttack', countryCode: 'IN', country: 'India', state: 'Odisha', lat: 20.4625, lon: 85.8830 },
    ],
  },
  {
    name: 'Punjab',
    cities: [
      { id: 'in-lud', name: 'Ludhiana', countryCode: 'IN', country: 'India', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
      { id: 'in-amr', name: 'Amritsar', countryCode: 'IN', country: 'India', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
    ],
  },
  {
    name: 'Rajasthan',
    cities: [
      { id: 'in-jai', name: 'Jaipur', countryCode: 'IN', country: 'India', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
      { id: 'in-jod', name: 'Jodhpur', countryCode: 'IN', country: 'India', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
      { id: 'in-uda', name: 'Udaipur', countryCode: 'IN', country: 'India', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },
    ],
  },
  {
    name: 'Tamil Nadu',
    cities: [
      { id: 'in-che', name: 'Chennai', countryCode: 'IN', country: 'India', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
      { id: 'in-coi', name: 'Coimbatore', countryCode: 'IN', country: 'India', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
      { id: 'in-mad', name: 'Madurai', countryCode: 'IN', country: 'India', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
    ],
  },
  {
    name: 'Telangana',
    cities: [
      { id: 'in-hyd', name: 'Hyderabad', countryCode: 'IN', country: 'India', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
    ],
  },
  {
    name: 'Uttar Pradesh',
    cities: [
      { id: 'in-lko', name: 'Lucknow', countryCode: 'IN', country: 'India', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
      { id: 'in-kan', name: 'Kanpur', countryCode: 'IN', country: 'India', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
      { id: 'in-var', name: 'Varanasi', countryCode: 'IN', country: 'India', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
      { id: 'in-agra', name: 'Agra', countryCode: 'IN', country: 'India', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
      { id: 'in-noida', name: 'Noida', countryCode: 'IN', country: 'India', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910 },
    ],
  },
  {
    name: 'Uttarakhand',
    cities: [
      { id: 'in-deh', name: 'Dehradun', countryCode: 'IN', country: 'India', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322 },
    ],
  },
  {
    name: 'West Bengal',
    cities: [
      { id: 'in-kol', name: 'Kolkata', countryCode: 'IN', country: 'India', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
      { id: 'in-sil', name: 'Siliguri', countryCode: 'IN', country: 'India', state: 'West Bengal', lat: 26.7271, lon: 88.3953 },
    ],
  },
];

export const FLATTENED_INDIAN_CITIES: City[] = INDIAN_STATES.flatMap((s) => s.cities);

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
  { id: 'in-mum', name: 'Mumbai', countryCode: 'IN', country: 'India', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { id: 'in-del', name: 'Delhi', countryCode: 'IN', country: 'India', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { id: 'in-ban', name: 'Bengaluru', countryCode: 'IN', country: 'India', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
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

export const ALL_CITIES: City[] = [
  ...POPULAR_CITIES,
  ...FLATTENED_INDIAN_CITIES.filter(
    (ic) => !POPULAR_CITIES.some((pc) => pc.id === ic.id)
  ),
];
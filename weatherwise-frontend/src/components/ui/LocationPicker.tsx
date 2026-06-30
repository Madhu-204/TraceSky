import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

// Simple city type without external dependencies
interface SimpleCity {
  id: string;
  name: string;
  countryCode: string;
  country: string;
}

// Pre-defined cities
const CITIES: SimpleCity[] = [
  { id: 'us-sf', name: 'San Francisco', countryCode: 'US', country: 'United States' },
  { id: 'us-ny', name: 'New York', countryCode: 'US', country: 'United States' },
  { id: 'us-la', name: 'Los Angeles', countryCode: 'US', country: 'United States' },
  { id: 'us-chi', name: 'Chicago', countryCode: 'US', country: 'United States' },
  { id: 'gb-lon', name: 'London', countryCode: 'GB', country: 'United Kingdom' },
  { id: 'ca-tor', name: 'Toronto', countryCode: 'CA', country: 'Canada' },
  { id: 'au-syd', name: 'Sydney', countryCode: 'AU', country: 'Australia' },
  { id: 'de-ber', name: 'Berlin', countryCode: 'DE', country: 'Germany' },
  { id: 'fr-par', name: 'Paris', countryCode: 'FR', country: 'France' },
  { id: 'jp-tok', name: 'Tokyo', countryCode: 'JP', country: 'Japan' },
];

export const LocationPicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<SimpleCity>(CITIES[0]);

  const handleSelect = (city: SimpleCity) => {
    setSelectedCity(city);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0E1326] border border-[#1C2340] hover:border-blue-500/40 rounded-xl transition-all"
      >
        <MapPin size={14} className="text-blue-400" />
        <span className="text-xs font-medium text-white">
          {selectedCity.name}, {selectedCity.countryCode}
        </span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#0E1328] border border-[#1C2345] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-48 overflow-y-auto p-2">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelect(city)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1C2345] transition-all text-left"
              >
                <MapPin size={12} className="text-gray-500" />
                <div>
                  <p className="text-xs font-semibold text-white">{city.name}</p>
                  <p className="text-[10px] text-gray-500">{city.country}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
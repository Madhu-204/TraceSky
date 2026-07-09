import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationStore } from '../../store/locationStore';
import type { City } from '../../types/location.types';
import { POPULAR_CITIES, INDIAN_STATES, FLATTENED_INDIAN_CITIES } from '../../types/location.types';

interface GroupedCity {
  label: string;
  cities: City[];
}

function groupCities(cities: City[]): GroupedCity[] {
  const map = new Map<string, City[]>();
  for (const c of cities) {
    const key = c.country;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries()).map(([label, cityList]) => ({ label, cities: cityList }));
}

export const LocationPicker: React.FC = () => {
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'intl' | 'india'>('intl');
  const [selectedState, setSelectedState] = useState<string>('');

  const currentCity = currentLocation?.city;
  const label = currentCity
    ? `${currentCity.name}${currentCity.state ? `, ${currentCity.state}` : ''}`
    : 'Select location';

  const groupedIntl = groupCities(POPULAR_CITIES);

  const handleSelect = (city: City) => {
    setCurrentLocation({ city, lastUpdated: new Date().toISOString() });
    setIsOpen(false);
    setSelectedState('');
  };

  const handleIndiaSelect = (city: City) => {
    handleSelect(city);
  };

  const selectedStateCities = selectedState
    ? INDIAN_STATES.find((s) => s.name === selectedState)?.cities ?? []
    : [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0E1326] border border-[#1C2340] hover:border-blue-500/40 rounded-xl transition-all w-full"
      >
        <MapPin size={14} className="text-blue-400 shrink-0" />
        <span className="text-xs font-medium text-white truncate">{label}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform shrink-0 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#0E1328] border border-[#1C2345] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Mode toggle */}
          <div className="flex border-b border-[#1C2345] p-1.5 gap-1">
            <button
              onClick={() => { setMode('intl'); setSelectedState(''); }}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                mode === 'intl' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              International
            </button>
            <button
              onClick={() => { setMode('india'); setSelectedState(''); }}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                mode === 'india' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              India
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {mode === 'intl' ? (
              groupedIntl.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-3 pb-1">
                    {group.label}
                  </p>
                  {group.cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1C2345] transition-all text-left ${
                        currentCity?.id === city.id ? 'bg-[#1C2345]/60 ring-1 ring-blue-500/30' : ''
                      }`}
                    >
                      <MapPin size={12} className="text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{city.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{city.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <>
                {/* State selector */}
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-1">
                  Select State
                </p>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1C2345] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 mb-2"
                >
                  <option value="">-- Choose State --</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>

                {selectedState && (
                  <>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-1">
                      Cities in {selectedState}
                    </p>
                    {selectedStateCities.length === 0 ? (
                      <p className="text-[11px] text-gray-500 px-3 py-2">No cities listed</p>
                    ) : (
                      selectedStateCities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleIndiaSelect(city)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1C2345] transition-all text-left ${
                            currentCity?.id === city.id ? 'bg-[#1C2345]/60 ring-1 ring-blue-500/30' : ''
                          }`}
                        >
                          <MapPin size={12} className="text-gray-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{city.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{city.state}, India</p>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

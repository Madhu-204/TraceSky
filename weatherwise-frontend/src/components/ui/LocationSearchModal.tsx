import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import type { City } from '../../types/location.types';
import { POPULAR_CITIES, FLATTENED_INDIAN_CITIES } from '../../types/location.types';
import { useLocationStore } from '../../store/locationStore';

const ALL_CITIES = [...POPULAR_CITIES, ...FLATTENED_INDIAN_CITIES];
const DEDUPED = ALL_CITIES.filter(
  (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
);

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  title?: string;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Location',
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const currentId = currentLocation?.city?.id;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return DEDUPED.slice(0, 8);
    const q = query.toLowerCase();
    return DEDUPED.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [query]);

  const handleSelect = (city: City) => {
    onSelect(city);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md mx-4 bg-[#0E1328] border border-[#1C2345] rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2345]">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cities..."
                className="w-full bg-[#070A14] border border-[#1C2340] text-xs text-gray-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500/50 placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto px-2 pb-2 space-y-0.5">
            {results.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelect(city)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1C2345] transition-all text-left ${
                  currentId === city.id ? 'bg-[#1C2345]/60 ring-1 ring-blue-500/30' : ''
                }`}
              >
                <MapPin
                  size={14}
                  className={`shrink-0 ${
                    currentId === city.id ? 'text-blue-400' : 'text-gray-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {city.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {city.state ? `${city.state}, ` : ''}{city.country}
                  </p>
                </div>
              </button>
            ))}
            {query && results.length === 0 && (
              <p className="text-[11px] text-gray-500 px-3 py-4 text-center">
                No cities found for "{query}"
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

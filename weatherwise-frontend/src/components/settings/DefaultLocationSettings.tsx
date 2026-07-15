import React, { useState } from 'react';
import { MapPin, Star, Trash2, Pencil } from 'lucide-react';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { LocationSearchModal } from '../ui/LocationSearchModal';
import type { City } from '../../types/location.types';

export const DefaultLocationSettings: React.FC = () => {
  const { defaultLocation, favorites, setDefaultLocation, addFavorite, removeFavorite } = useLocationStore();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (city: City) => {
    setDefaultLocation(city);
    addFavorite(city);
    updateProfile({ name: useAuthStore.getState().user!.name, location_default: city.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">Default Location</h4>
        <p className="text-xs text-gray-500 mt-0.5">Set your home location for weather data and alerts.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4 space-y-3">
          <label className="text-xs font-bold text-gray-200 block">Current Default</label>
          {defaultLocation ? (
            <div className="flex items-center justify-between bg-[#070A14] border border-[#1C2340] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white">{defaultLocation.name}</p>
                  <p className="text-[10px] text-gray-500">{defaultLocation.country}{defaultLocation.state ? `, ${defaultLocation.state}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultLocation(null)}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#070A14] border border-[#1C2340] rounded-lg p-3">
              <p className="text-xs text-gray-500 font-mono">
                No default location set.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-[11px] font-semibold px-3 py-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              >
                Choose
              </button>
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4 space-y-2">
            <label className="text-xs font-bold text-gray-200 block">Saved Locations</label>
            {favorites.map((city) => (
              <div key={city.id} className="flex items-center justify-between bg-[#070A14] border border-[#1C2340] rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-amber-400" />
                  <span className="text-xs text-white">{city.name}</span>
                  <span className="text-[9px] text-gray-500">{city.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDefaultLocation(city)}
                    className="text-[9px] px-2 py-1 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                  >
                    Set Default
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(city.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LocationSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        title="Set Default Location"
      />
    </div>
  );
};

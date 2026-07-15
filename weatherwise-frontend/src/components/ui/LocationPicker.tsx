import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { LocationSearchModal } from './LocationSearchModal';
import type { City } from '../../types/location.types';

export const LocationPicker: React.FC = () => {
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const user = useAuthStore((s) => s.user);
  const [modalOpen, setModalOpen] = useState(false);

  const currentCity = currentLocation?.city;
  const label = currentCity
    ? `${currentCity.name}${currentCity.state ? `, ${currentCity.state}` : ''}`
    : 'Select location';

  const handleSelect = (city: City) => {
    setCurrentLocation({ city, lastUpdated: new Date().toISOString() });
    if (user) {
      updateProfile({ name: user.name, location_default: city.id });
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0E1326] border border-[#1C2340] hover:border-blue-500/40 rounded-xl transition-all w-full"
      >
        <MapPin size={14} className="text-blue-400 shrink-0" />
        <span className="text-xs font-medium text-white truncate">{label}</span>
      </button>

      <LocationSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
};

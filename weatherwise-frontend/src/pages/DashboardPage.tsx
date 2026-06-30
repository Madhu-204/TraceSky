import React from 'react';
import { CurrentHero } from '../components/dashboard/CurrentHero';
import { MiddleGrid } from '../components/dashboard/MiddleGrid';
import { BottomGrid } from '../components/dashboard/BottomGrid';

export const DashboardPage: React.FC = () => {
  return (
    <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 space-y-6 lg:ml-64 bg-[#070A14] min-h-screen text-gray-100 transition-all">
      {/* Target Module Hero Section */}
      <CurrentHero />

      {/* Three Item Critical Risk Matrix Summary */}
      <MiddleGrid />

      {/* Core Array & Explainable Logic Matrix */}
      <BottomGrid />
    </div>
  );
};
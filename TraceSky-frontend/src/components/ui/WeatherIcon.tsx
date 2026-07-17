import React from 'react';
import { CloudLightning, Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';

interface WeatherIconProps {
  type?: 'logo' | 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'windy' | 'default';
  size?: number;
  className?: string;
}

const iconMap = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
  windy: Wind,
  default: Cloud,
  logo: CloudLightning,
};

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  type = 'default',
  size = 24,
  className = ''
}) => {
  const Icon = iconMap[type] || iconMap.logo;

  return <Icon size={size} className={className} />;
};

export default WeatherIcon;
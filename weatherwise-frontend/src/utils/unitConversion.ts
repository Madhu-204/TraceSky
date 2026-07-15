import { useSettingsStore } from '../store/settingsStore';

export function toFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}

export function toMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

export function toInches(mm: number): string {
  return (mm * 0.0393701).toFixed(1);
}

export function useUnitSystem() {
  const unitSystem = useSettingsStore((s) => s.config.unitSystem);
  const isImperial = unitSystem === 'IMPERIAL';

  const temp = (celsius: number) => ({
    value: isImperial ? toFahrenheit(celsius) : Math.round(celsius),
    unit: isImperial ? '°F' : '°C',
    label: isImperial ? '°F' : '°C',
  });

  const wind = (kmh: number) => ({
    value: isImperial ? toMph(kmh) : Math.round(kmh),
    unit: isImperial ? 'mph' : 'km/h',
    label: isImperial ? 'mph' : 'km/h',
  });

  const precip = (mm: number) => ({
    value: isImperial ? toInches(mm) : mm,
    unit: isImperial ? 'in' : 'mm',
    label: isImperial ? 'in' : 'mm',
  });

  return { temp, wind, precip, isImperial, unitSystem };
}

export function useTemp() {
  const isImperial = useSettingsStore((s) => s.config.unitSystem === 'IMPERIAL');
  return (celsius: number) => ({
    value: isImperial ? toFahrenheit(celsius) : Math.round(celsius),
    unit: isImperial ? '°F' : '°C',
  });
}

export function useWind() {
  const isImperial = useSettingsStore((s) => s.config.unitSystem === 'IMPERIAL');
  return (kmh: number) => ({
    value: isImperial ? toMph(kmh) : Math.round(kmh),
    unit: isImperial ? 'mph' : 'km/h',
  });
}

export function usePrecip() {
  const isImperial = useSettingsStore((s) => s.config.unitSystem === 'IMPERIAL');
  return (mm: number) => ({
    value: isImperial ? toInches(mm) : mm,
    unit: isImperial ? 'in' : 'mm',
  });
}

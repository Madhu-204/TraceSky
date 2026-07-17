import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useAutoRefresh(callback: () => void) {
  const interval = useSettingsStore((s) => s.config.refreshInterval);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (interval <= 0) return;
    const id = setInterval(() => savedCallback.current(), interval * 1000);
    return () => clearInterval(id);
  }, [interval]);
}

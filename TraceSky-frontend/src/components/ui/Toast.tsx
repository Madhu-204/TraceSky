import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', visible, onClose, duration = 4000 }) => {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating(true));
      const timer = setTimeout(() => {
        setAnimating(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    } else if (mounted) {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted) return null;

  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full pointer-events-none">
      <div
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out ${
          animating
            ? 'translate-x-0 opacity-100'
            : 'translate-x-8 opacity-0'
        } ${
          type === 'success'
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}
        style={{ backgroundColor: type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}
      >
        <Icon size={20} className={type === 'success' ? 'text-green-400 shrink-0 mt-0.5' : 'text-red-400 shrink-0 mt-0.5'} />
        <p className={`text-sm font-medium flex-1 ${type === 'success' ? 'text-green-100' : 'text-red-100'}`}>
          {message}
        </p>
        <button
          onClick={() => {
            setAnimating(false);
            setTimeout(onClose, 300);
          }}
          className={`shrink-0 p-0.5 rounded transition-colors ${
            type === 'success' ? 'text-green-400/60 hover:text-green-300' : 'text-red-400/60 hover:text-red-300'
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

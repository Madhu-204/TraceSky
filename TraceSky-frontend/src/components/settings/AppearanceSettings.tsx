import React from 'react';
import type { ThemeAccent } from '../../types/settings.types';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

const THEMES: { accent: ThemeAccent; label: string; desc: string; color: string }[] = [
  { accent: 'blue', label: 'Blue', desc: 'Default cool blue tones', color: '#3b82f6' },
  { accent: 'emerald', label: 'Emerald', desc: 'Green natural palette', color: '#10b981' },
  { accent: 'violet', label: 'Violet', desc: 'Purple deep tones', color: '#8b5cf6' },
  { accent: 'amber', label: 'Amber', desc: 'Warm golden accents', color: '#f59e0b' },
];

export const AppearanceSettings: React.FC = () => {
  const themeAccent = useSettingsStore((s) => s.config.themeAccent);
  const setThemeAccent = useSettingsStore((s) => s.setThemeAccent);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">Appearance</h4>
        <p className="text-xs text-gray-500 mt-0.5">Customize the interface accent color and theme.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-200 block mb-3">Accent Color</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.accent}
                type="button"
                onClick={() => {
                  setThemeAccent(t.accent);
                  if (user) {
                    updateProfile({ name: user.name, theme_accent: t.accent });
                  }
                }}
                className={`relative p-4 rounded-xl border transition-all text-left ${
                  themeAccent === t.accent
                    ? 'border-gray-400 bg-[#111827] ring-1 ring-white/20'
                    : 'border-[#1C2345] bg-[#090D1F] hover:border-gray-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-xs font-bold text-white">{t.label}</span>
                </div>
                <p className="text-[10px] text-gray-500">{t.desc}</p>
                {themeAccent === t.accent && (
                  <span className="absolute top-2 right-2 text-[9px] text-emerald-400 font-bold">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>

          <div className="bg-[#090D1F] border border-[#161B35] rounded-xl p-4">
          <label className="text-xs font-bold text-gray-200 block mb-3">Preview</label>
          <div className="flex flex-wrap items-center gap-3">
            {(() => {
              const c = THEMES.find((t) => t.accent === themeAccent)?.color ?? '#3b82f6';
              return (
                <>
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: c }} />
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${c}33` }} />
                  <div className="w-8 h-8 rounded-lg border-2" style={{ borderColor: c }} />
                  <div className="w-8 h-8 rounded-lg" style={{ boxShadow: `0 0 0 2px ${c}4d` }} />
                  <span className="text-xs font-mono" style={{ color: c }}>Accent Text</span>
                </>
              );
            })()}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">Accent colors apply to buttons, links, active states, and highlights throughout the interface.</p>
        </div>
      </div>
    </div>
  );
};

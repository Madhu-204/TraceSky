import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';

interface ApiGatewaySettingsProps {
  apiKey: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  onRegenerate: () => void;
}

export const ApiGatewaySettings: React.FC<ApiGatewaySettingsProps> = ({ apiKey, status, onRegenerate }) => {
  const [obscured, setObscured] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">API Keys & Gateways</h4>
        <p className="text-xs text-gray-500 mt-0.5">Configure authentication profiles for server-to-server data streams.</p>
      </div>

      <div className="bg-[#090D1F] p-4 rounded-xl border border-[#161B35] space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-wide">Primary Access Token</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Production Gateway Key</span>
              <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded border font-mono ${
                status === 'ACTIVE'
                  ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                  : 'bg-rose-500/5 text-rose-400 border-rose-500/10'
              }`}>
                {status}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black border border-[#1C2345] hover:border-blue-500/30 bg-[#070A14] text-gray-400 hover:text-white rounded-xl transition-all font-mono"
          >
            <RefreshCw size={11} /> ROLL KEY
          </button>
        </div>

        {/* Input Wrapper Field with Actions */}
        <div className="flex items-center gap-2 bg-[#070A14] border border-[#1C2340] rounded-xl p-2 font-mono">
          <input
            type={obscured ? 'password' : 'text'}
            readOnly
            value={apiKey}
            className="flex-1 bg-transparent border-none text-xs text-gray-300 font-medium focus:outline-none focus:ring-0 select-all px-2"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setObscured(!obscured)}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {obscured ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-gray-500 font-medium">
          Do not share this key in public repositories. Use environment variables to inject this secret safely inside external integration hooks.
        </p>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AssistantChatFeed } from '../components/assistant/AssistantChatFeed';
import { AssistantActionBar } from '../components/assistant/AssistantActionBar';
import type { AssistantMessage, SuggestionToken } from '../types/assistant.types';

export const AiAssistantPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  // Array tailored to mirror full screen conversation matrix log history exactly
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      timestamp: '09:00 AM',
      text: 'Hello! I\'m your WeatherWise Intelligence Assistant. I can help you interpret complex atmospheric data, assess regional risks, or plan your operations based on hyper-local forecasts. How can I assist you today?'
    },
    {
      id: 'msg-2',
      sender: 'user',
      timestamp: '09:02 AM',
      text: 'Analyze the flood risk for the Sacramento valley area over the next 72 hours. Compare it with last year\'s data.'
    },
    {
      id: 'msg-3',
      sender: 'assistant',
      timestamp: '09:03 AM',
      text: 'I\'ve analyzed the current atmospheric rivers and soil saturation levels in the Sacramento Valley. The risk is currently **Elevated (64.2%)** due to higher-than-average snowmelt combined with projected precipitation.',
      hasMetricsCard: true,
      metricsData: {
        title: 'Flood Risk Index - Sacramento',
        badgeText: 'CAUTION',
        currentValue: '64.2%',
        historicValue: '42.1%',
        thresholdValue: '75.0%',
        chartPoints: [
          { label: 'T1', value: 25 },
          { label: 'T2', value: 30 },
          { label: 'T3', value: 45 },
          { label: 'NOW', value: 64, isCurrent: true },
          { label: 'T5', value: 72 },
          { label: 'T6', value: 80 },
          { label: 'T7', value: 85 }
        ],
        summaryText: 'Compared to last year, we are seeing a **22.1% increase** in risk metrics due to the specific timing of the warm front intersection. I recommend monitoring the American River drainage basin specifically.'
      }
    }
  ]);

  const explicitSuggestionTokens: SuggestionToken[] = [
    { id: 'tok-1', label: 'Flood risk?', iconType: 'flood' },
    { id: 'tok-2', label: 'Best time to farm?', iconType: 'farm' },
    { id: 'tok-3', label: 'Cyclone alerts', iconType: 'cyclone' },
    { id: 'tok-4', label: 'Solar efficiency', iconType: 'solar' }
  ];

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputValue
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
  };

  const clearChatFeedWorkspace = () => {
    setMessages([
      {
        id: 'msg-base',
        sender: 'assistant',
        timestamp: 'Just now',
        text: 'Chat logs purged. Session re-initialized safely. How can I assist you with regional weather telemetry parameters now?'
      }
    ]);
  };

  return (
    <div className="pt-20 pb-4 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] h-screen text-gray-100 flex flex-col justify-between transition-all">

      {/* SECTION 1: Fixed Assistant Shell View Header */}
      <div className="flex justify-between items-center border-b border-[#1C2345] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white tracking-tight">AI Weather Assistant</h2>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">ONLINE</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChatFeedWorkspace}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black border border-[#1C2345] hover:border-rose-500/30 bg-[#0E1328] hover:bg-rose-500/5 text-gray-400 hover:text-rose-400 rounded-xl transition-all tracking-wider uppercase"
        >
          <Trash2 size={12} /> Clear Chat
        </button>
      </div>

      {/* SECTION 2: Chat Stream Feed View Container */}
      <div className="flex-1 overflow-hidden my-4 flex flex-col justify-end">
        <AssistantChatFeed messages={messages} />
      </div>

      {/* SECTION 3: Bottom Action Dock Workspace Panel */}
      <AssistantActionBar
        suggestions={explicitSuggestionTokens}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={handleMessageSubmit}
      />

    </div>
  );
};
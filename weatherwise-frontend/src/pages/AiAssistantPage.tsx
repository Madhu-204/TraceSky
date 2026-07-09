import React, { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { AssistantChatFeed } from '../components/assistant/AssistantChatFeed';
import { AssistantActionBar } from '../components/assistant/AssistantActionBar';
import { useAIStore } from '../store/aiStore';
import { useLocationStore } from '../store/locationStore';

export const AiAssistantPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, clearMessages, getSuggestionTokens } = useAIStore();
  const { currentLocation } = useLocationStore();
  const city = currentLocation?.city;
  const lat = city?.lat ?? 37.7749;
  const lon = city?.lon ?? -122.4194;

  const handleMessageSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue('');
    sendMessage(lat, lon, text);
  }, [inputValue, isLoading, lat, lon, sendMessage]);

  const clearChatFeedWorkspace = () => {
    clearMessages();
  };

  return (
    <div className="pt-20 pb-4 px-4 sm:px-6 lg:px-8 lg:ml-64 bg-[#070A14] h-screen text-gray-100 flex flex-col justify-between transition-all">

      <div className="flex justify-between items-center border-b border-[#1C2345] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white tracking-tight">AI Weather Assistant</h2>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} `} />
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">{isLoading ? 'THINKING' : 'ONLINE'}</span>
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

      <div className="flex-1 overflow-hidden my-4 flex flex-col justify-end">
        <AssistantChatFeed messages={messages} />
      </div>

      <AssistantActionBar
        suggestions={getSuggestionTokens()}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={handleMessageSubmit}
      />

    </div>
  );
};
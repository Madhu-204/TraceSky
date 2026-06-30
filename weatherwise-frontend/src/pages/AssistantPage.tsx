import React from 'react';

export const AssistantPage: React.FC = () => {
  return (
    <div className="p-6 ml-64">
      <h1 className="text-2xl font-bold text-white mb-2">AI Assistant</h1>
      <p className="text-gray-400 text-sm mb-6">Weather insights powered by AI</p>
      <div className="bg-[#0E1322] border border-gray-800/80 rounded-2xl p-6">
        <p className="text-gray-400">Assistant loading...</p>
      </div>
    </div>
  );
};
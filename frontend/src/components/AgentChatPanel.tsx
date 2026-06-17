'use client';

import React, { useState } from 'react';

export interface BandMessage {
  id: string;
  agent: string;
  framework: string;
  action: string;
  content: string;
  timestamp: string;
}

interface AgentChatPanelProps {
  messages: BandMessage[];
  onSendMessage: (msg: string) => void;
}

export default function AgentChatPanel({ messages, onSendMessage }: AgentChatPanelProps) {
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="glass-panel w-96 max-h-[80vh] flex flex-col overflow-hidden animate-[spring-up_0.6s_forwards]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
        <h3 className="font-semibold text-sm tracking-wide">Oner Swarm (Band)</h3>
        <p className="text-xs opacity-50 mt-1">Cross-Framework Orchestration Live</p>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm animate-[fade-in_0.3s_forwards]">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-medium text-emerald-400">
                {msg.agent} <span className="text-xs opacity-50">({msg.framework})</span>
              </span>
              <span className="text-[10px] opacity-40">{msg.timestamp}</span>
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3 text-gray-200 border border-[rgba(255,255,255,0.05)]">
              <span className="block text-xs font-semibold mb-1 opacity-70 uppercase tracking-wider">{msg.action}</span>
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HitL Input */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct swarm..."
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
          />
          <button 
            type="submit"
            className="bg-white text-black px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

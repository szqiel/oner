'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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
  status: string;
}

export default function AgentChatPanel({ messages, onSendMessage, status }: AgentChatPanelProps) {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track unread messages when minimized
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (isMinimized && messages.length > prevMessagesLength.current) {
      setUnreadCount(prev => prev + (messages.length - prevMessagesLength.current));
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isMinimized]);

  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // 3D Parallax Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isMinimized) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Status indicator logic
  const isActive = status !== 'COMPLETED' && status !== 'FAILED';

  return (
    <motion.div
      layout
      className={`flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized
          ? 'w-14 h-14 rounded-full justify-center items-center cursor-pointer hover:scale-105 bg-[#111111] border border-zinc-700'
          : 'w-96 max-h-[80vh] h-[500px] rounded-2xl bg-[#111111]/95 border border-zinc-800'
      }`}
      style={{
        rotateX: isMinimized ? 0 : rotateX,
        rotateY: isMinimized ? 0 : rotateY,
        transformStyle: "preserve-3d",
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      {isMinimized ? (
        <div className="relative flex items-center justify-center">
          {/* Chat Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white/80">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>

          {/* Badge: unread count OR active pulse — never both */}
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-2 ring-[#111111]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : isActive ? (
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
            </span>
          ) : null}
        </div>
      ) : (
        <>
          {/* Header */}
          <div
            className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center cursor-pointer select-none"
            onClick={() => setIsMinimized(true)}
          >
            <div>
              <h3 className="font-semibold text-sm tracking-wide text-white">Oner Swarm</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  status === 'COMPLETED' ? 'bg-emerald-400'
                    : status === 'FAILED' ? 'bg-red-400'
                    : 'bg-yellow-400 animate-pulse'
                }`} />
                <span>{status.replaceAll('_', ' ')}</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              title="Minimize chat"
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12H4.5" />
              </svg>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm animate-[fade-in_0.3s_forwards]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-medium text-emerald-400">
                    {msg.agent} <span className="text-xs text-zinc-600">({msg.framework})</span>
                  </span>
                  <span className="text-[10px] text-zinc-600">{msg.timestamp}</span>
                </div>
                <div className="bg-zinc-900/80 rounded-lg p-3 text-zinc-300 border border-zinc-800/50">
                  <span className="block text-xs font-semibold mb-1 text-zinc-500 uppercase tracking-wider">{msg.action}</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* HitL Input */}
          <div className="p-3 border-t border-zinc-800 bg-[#0a0a0a]">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Instruct swarm..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-black px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
}

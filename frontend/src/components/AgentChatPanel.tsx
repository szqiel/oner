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
}

export default function AgentChatPanel({ messages, onSendMessage }: AgentChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 3D Parallax Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <motion.div 
      className="relative w-96 max-h-[80vh] flex flex-col animate-[spring-up_0.6s_forwards]"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spinning Edge Glow */}
      <div className="absolute -inset-[1px] rounded-[1.5rem] opacity-70 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.8)_360deg)] animate-border-spin -z-10"></div>
      
      <div className="glass-panel flex flex-col overflow-hidden h-full w-full bg-[#050505]/80">
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
        <div ref={messagesEndRef} />
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
    </motion.div>
  );
}

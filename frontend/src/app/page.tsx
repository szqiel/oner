'use client';

import React, { useState, useEffect } from 'react';
import LivePreview from '@/components/LivePreview';
import AgentChatPanel, { BandMessage } from '@/components/AgentChatPanel';

const MOCK_MESSAGES: BandMessage[] = [
  {
    id: '1',
    agent: 'The Librarian',
    framework: 'LangChain',
    action: 'Task Received',
    content: 'Analyzing prompt: "Build a high-performance, modern dashboard application." Assigning models...',
    timestamp: '10:00:01 AM',
  },
  {
    id: '2',
    agent: 'Gambit',
    framework: 'LlamaIndex',
    action: 'Plan Drafted',
    content: 'Researched dark-mode UI patterns. Pushing architectural blueprint to Band state.',
    timestamp: '10:00:15 AM',
  },
  {
    id: '3',
    agent: 'Crucible',
    framework: 'Native',
    action: 'Plan Locked',
    content: 'Blueprint audited and approved. State updated to PLAN_LOCKED.',
    timestamp: '10:00:18 AM',
  },
  {
    id: '4',
    agent: 'Kuli',
    framework: 'AutoGen',
    action: 'Code Generated',
    content: 'Executed HTML/Tailwind styling for Hero section. Output pushed to Band.',
    timestamp: '10:00:45 AM',
  }
];

const MOCK_HTML = `
  <html>
    <head>
      <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      <style>
        body { background-color: #050505; color: white; font-family: sans-serif; }
      </style>
    </head>
    <body class="flex flex-col items-center justify-center h-screen bg-[#050505]">
      <h1 class="text-5xl font-bold mb-4 tracking-tighter text-white">Oner Dashboard</h1>
      <p class="text-lg text-gray-400 max-w-lg text-center">An enterprise software application orchestrated entirely by a cross-framework autonomous swarm.</p>
      <button class="mt-8 px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition">Get Started</button>
    </body>
  </html>
`;

export default function Dashboard() {
  const [messages, setMessages] = useState<BandMessage[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>('');

  // Simulate real-time agent communication flow for the MVP demo
  useEffect(() => {
    let delay = 500;
    MOCK_MESSAGES.forEach((msg) => {
      delay += 800 + Math.random() * 1000;
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        
        // When Kuli finishes, trigger the iframe update
        if (msg.agent === 'Kuli') {
          setTimeout(() => setHtmlContent(MOCK_HTML), 600);
        }
      }, delay);
    });
  }, []);

  const handleSendMessage = (msg: string) => {
    const newMessage: BandMessage = {
      id: Date.now().toString(),
      agent: 'Lead Developer',
      framework: 'Human',
      action: 'HitL Input',
      content: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Background Live Preview */}
      <div className="absolute inset-0 z-0">
        <LivePreview htmlContent={htmlContent} />
      </div>

      {/* Floating Agent Chat Panel */}
      <div className="absolute bottom-6 left-6 z-10 shadow-2xl">
        <AgentChatPanel 
          messages={messages} 
          onSendMessage={handleSendMessage} 
        />
      </div>
    </main>
  );
}

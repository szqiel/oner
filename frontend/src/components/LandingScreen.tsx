import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface LandingScreenProps {
  onSubmit: (prompt: string) => void;
}

export default function LandingScreen({ onSubmit }: LandingScreenProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white selection:bg-white/30 selection:text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-white to-zinc-500 bg-[length:200%_auto] animate-text-shimmer">
          Oner
        </h1>
        <p className="text-lg md:text-xl text-white/60 mb-12 text-center">
          One-Continuous Web Builder
        </p>

        <form 
          onSubmit={handleSubmit}
          className="w-full relative group rounded-2xl overflow-hidden p-[1px]"
        >
          {/* Aceternity Spinning Border */}
          <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] opacity-40 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10 flex items-center w-full rounded-[calc(1rem-1px)] p-2 shadow-2xl transition-all duration-300" style={{ backgroundColor: '#111111' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the application you want to build..."
              className="w-full bg-transparent text-lg md:text-xl text-white placeholder-white/30 resize-none outline-none py-4 pl-4 pr-16 min-h-[60px] max-h-[300px]"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="absolute right-4 bottom-4 p-2 rounded-xl bg-white text-black disabled:opacity-20 disabled:bg-white/10 disabled:text-white disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-8 text-white/40 text-sm flex gap-4"
        >
          <span>Press Enter to swarm</span>
          <span>&bull;</span>
          <span>Shift + Enter for new line</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

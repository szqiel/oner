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
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-2 text-center text-white">
          Oner
        </h1>
        <p className="text-lg md:text-xl text-white/60 mb-12 text-center">
          One-Continuous Web Builder
        </p>

        <form 
          onSubmit={handleSubmit}
          className="w-full relative group"
        >
          {/* Subtle glow effect behind input */}
          <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-2xl p-2 shadow-2xl transition-all duration-300 focus-within:border-white/30 focus-within:bg-[#151515]">
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

'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingScreen from '@/components/LandingScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = async (prompt: string) => {
    // 1. Send the prompt to the backend orchestrator
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      await fetch(`${backendUrl}/api/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
    } catch (err) {
      console.error('Failed to start swarm:', err);
      // We proceed with the UI transition even if the network call fails locally
      // so the user can see the Dashboard layout.
    }

    // 2. Trigger the UI transition instantly
    setHasStarted(true);
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20"
          >
            <LandingScreen onSubmit={handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 z-10"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

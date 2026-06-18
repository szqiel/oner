'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { toast } from 'sonner';
import LandingScreen from '@/components/LandingScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  // Spotlight logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const handleStart = async (prompt: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (!response.ok || !data.runId) {
        throw new Error(data.error || 'The backend did not create a run.');
      }
      setRunId(data.runId);
      setHasStarted(true);
    } catch (err) {
      console.error('Failed to start swarm:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to start the swarm.');
      throw err;
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-[#050505] overflow-hidden group"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-[100]"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
        }}
      />
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
            {runId && <Dashboard runId={runId} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

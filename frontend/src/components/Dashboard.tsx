'use client';

import React, { useState, useEffect } from 'react';
import LivePreview from '@/components/LivePreview';
import AgentChatPanel, { BandMessage } from '@/components/AgentChatPanel';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Dashboard() {
  const [messages, setMessages] = useState<BandMessage[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [runId, setRunId] = useState<string | null>(null);

  // Framework mapping helper
  const getFramework = (agentName: string) => {
    const lower = agentName.toLowerCase();
    if (lower.includes('librarian')) return 'LangChain';
    if (lower.includes('gambit')) return 'LlamaIndex';
    if (lower.includes('kuli')) return 'AutoGen';
    if (lower.includes('catalyst')) return 'LangChain';
    if (lower.includes('glassion')) return 'Native Multimodal';
    if (lower.includes('developer')) return 'Human';
    return 'Band Agent';
  };

  useEffect(() => {
    // Helper to map DB row to our UI interface
    const mapEventToMessage = (row: any): BandMessage => {
      let contentString = '';
      if (typeof row.output === 'string') {
        contentString = row.output;
      } else if (row.output && row.output.message) {
        contentString = row.output.message;
      } else {
        contentString = JSON.stringify(row.output);
      }

      return {
        id: row.id,
        agent: row.agent_name,
        framework: getFramework(row.agent_name),
        action: row.event_type,
        content: contentString,
        timestamp: new Date(row.created_at).toLocaleTimeString(),
      };
    };

    // 1. Fetch initial data (latest run and its events)
    const fetchInitialData = async () => {
      // Get the most recent run
      const { data: runs } = await supabase
        .from('runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (runs && runs.length > 0) {
        const latestRun = runs[0];
        setRunId(latestRun.id);
        
        // If there's html in the shared_context, set it
        if (latestRun.shared_context && latestRun.shared_context.html) {
          setHtmlContent(latestRun.shared_context.html);
        }

        // Fetch past events for this run
        const { data: events } = await supabase
          .from('agent_events')
          .select('*')
          .eq('run_id', latestRun.id)
          .order('created_at', { ascending: true });

        if (events) {
          setMessages(events.map(mapEventToMessage));
        }
      }
    };

    fetchInitialData();

    // 2. Setup Realtime Subscriptions
    const channel = supabase.channel('codeband_realtime');

    // Listen for new agent events (chat messages)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'agent_events' },
      (payload) => {
        const newEvent = payload.new;
        // Only append if it belongs to our active run
        setMessages((prev) => {
          // Prevent duplicates if multiple tabs/subscriptions
          if (prev.find(m => m.id === newEvent.id)) return prev;
          return [...prev, mapEventToMessage(newEvent)];
        });
      }
    );

    // Listen for state updates (HTML code generation)
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'runs' },
      (payload) => {
        const updatedRun = payload.new;
        if (updatedRun.shared_context && updatedRun.shared_context.html) {
          setHtmlContent(updatedRun.shared_context.html);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (msg: string) => {
    if (!runId) return;

    // Instantly show in UI
    const newMessage: BandMessage = {
      id: Date.now().toString(),
      agent: 'Lead Developer',
      framework: 'Human',
      action: 'HitL Input',
      content: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, newMessage]);

    // Push to Supabase so the backend agent can pick it up
    try {
      await supabase.from('agent_events').insert({
        run_id: runId,
        agent_name: 'Lead Developer',
        event_type: 'HitL_INPUT',
        output: { message: msg }
      });
    } catch (error) {
      toast.error('Failed to send message to swarm.');
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Live Preview or Loading State */}
      <div className="absolute inset-0 z-0">
        {!htmlContent ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505]">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-medium text-white/80 animate-pulse tracking-wide">
              The Swarm is orchestrating...
            </h2>
            <p className="text-sm text-white/40 mt-2">
              Waiting for Kuli to compile the layout.
            </p>
          </div>
        ) : (
          <LivePreview htmlContent={htmlContent} />
        )}
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

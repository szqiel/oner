'use client';

import React, { useState, useEffect } from 'react';
import LivePreview from '@/components/LivePreview';
import AgentChatPanel, { BandMessage } from '@/components/AgentChatPanel';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DashboardProps {
  runId: string;
}

interface AgentEventRow {
  id: string;
  run_id: string;
  agent_name: string;
  event_type: string;
  output: string | { message?: string; [key: string]: unknown };
  created_at: string;
}

interface RunRow {
  id: string;
  status: string;
  shared_context: { html?: string };
}

export default function Dashboard({ runId }: DashboardProps) {
  const [messages, setMessages] = useState<BandMessage[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [status, setStatus] = useState('STARTING');

  // Framework mapping helper
  const getFramework = (agentName: string) => {
    const lower = agentName.toLowerCase();
    if (lower.includes('librarian')) return 'LangChain';
    if (lower.includes('gambit')) return 'LlamaIndex';
    if (lower.includes('crucible')) return 'Native Node.js';
    if (lower.includes('kuli')) return 'LlamaIndex';
    if (lower.includes('catalyst')) return 'LangChain';
    if (lower.includes('glassion')) return 'Native Multimodal';
    if (lower.includes('developer')) return 'Human';
    return 'Band Agent';
  };

  useEffect(() => {
    // Helper to map DB row to our UI interface
    const mapEventToMessage = (row: AgentEventRow): BandMessage => {
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
      const { data: run, error: runError } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single<RunRow>();

      if (runError) {
        toast.error(`Could not load this run: ${runError.message}`);
        return;
      }

      setStatus(run.status);
      if (run.shared_context?.html) {
        setHtmlContent(run.shared_context.html);
      }

      const { data: events, error: eventsError } = await supabase
        .from('agent_events')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (eventsError) {
        toast.error(`Could not load agent events: ${eventsError.message}`);
      } else if (events) {
        setMessages((events as AgentEventRow[]).map(mapEventToMessage));
      }
    };

    fetchInitialData();

    // 2. Setup Realtime Subscriptions
    const channel = supabase.channel(`oner-run-${runId}`);

    // Listen for new agent events (chat messages)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'agent_events', filter: `run_id=eq.${runId}` },
      (payload) => {
        const newEvent = payload.new as AgentEventRow;
        setMessages((prev) => {
          if (prev.find(m => m.id === newEvent.id)) return prev;
          return [...prev, mapEventToMessage(newEvent)];
        });
      }
    );

    // Listen for state updates (HTML code generation)
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'runs', filter: `id=eq.${runId}` },
      (payload) => {
        const updatedRun = payload.new as RunRow;
        setStatus(updatedRun.status);
        if (updatedRun.shared_context?.html) {
          setHtmlContent(updatedRun.shared_context.html);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId]);

  const handleSendMessage = async (msg: string) => {
    const newMessage: BandMessage = {
      id: Date.now().toString(),
      agent: 'Lead Developer',
      framework: 'Human',
      action: 'HitL Input',
      content: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          updatedState: { human_feedback: msg }
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'The swarm could not resume.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message to the swarm.');
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
          status={status}
        />
      </div>
    </main>
  );
}

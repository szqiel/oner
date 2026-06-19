'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LivePreview from '@/components/LivePreview';
import AgentChatPanel, { BandMessage } from '@/components/AgentChatPanel';
import TopBar from '@/components/TopBar';
import CodeEditor from '@/components/CodeEditor';
import { supabase } from '@/lib/supabase';
import { parseFilesFromContext, reassembleHtml, downloadAsZip } from '@/lib/fileParser';
import type { FileMap } from '@/lib/fileParser';
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
  shared_context: { html?: string; files?: FileMap };
}

type Tab = 'preview' | 'code';

export default function Dashboard({ runId }: DashboardProps) {
  const [messages, setMessages] = useState<BandMessage[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [files, setFiles] = useState<FileMap>({});
  const [status, setStatus] = useState('STARTING');
  const [activeTab, setActiveTab] = useState<Tab>('preview');

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

  // Reassemble HTML from files for preview
  const previewHtml = useMemo(() => {
    if (htmlContent) return htmlContent;
    if (Object.keys(files).length > 0) return reassembleHtml(files);
    return '';
  }, [htmlContent, files]);

  const hasContent = previewHtml.length > 0 || Object.keys(files).length > 0;

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

    const processRunContext = (context: RunRow['shared_context']) => {
      // Parse multi-file output
      const parsed = parseFilesFromContext(context);
      if (Object.keys(parsed).length > 0) {
        setFiles(parsed);
      }
      // Also keep raw HTML for backwards compat
      if (context?.html) {
        setHtmlContent(context.html);
      }
    };

    // 1. Fetch initial data
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
      processRunContext(run.shared_context);

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

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'runs', filter: `id=eq.${runId}` },
      (payload) => {
        const updatedRun = payload.new as RunRow;
        setStatus(updatedRun.status);
        processRunContext(updatedRun.shared_context);
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

  const handleDownload = () => {
    const downloadFiles = Object.keys(files).length > 0 ? files : parseFilesFromContext({ html: htmlContent });
    downloadAsZip(downloadFiles);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#050505] flex flex-col">
      {/* Top Bar */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDownload={handleDownload}
        hasContent={hasContent}
      />

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="absolute inset-0">
            {!previewHtml ? (
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
              <LivePreview htmlContent={previewHtml} />
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {Object.keys(files).length > 0 ? (
              <CodeEditor files={files} />
            ) : previewHtml ? (
              <CodeEditor files={parseFilesFromContext({ html: previewHtml })} />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-4 opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                <p className="text-sm">Waiting for code generation...</p>
              </div>
            )}
          </div>
        )}

        {/* Floating Agent Chat Panel */}
        <div className="absolute bottom-6 left-6 z-10 shadow-2xl">
          <AgentChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            status={status}
          />
        </div>
      </div>
    </main>
  );
}

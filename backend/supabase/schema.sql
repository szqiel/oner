-- Oner - Codeband Shared State Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: runs
-- Represents a single execution of the swarm (from user prompt to final UI)
CREATE TABLE public.runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- e.g., PENDING, PLAN_LOCKED, KULI_WORKING, ESCALATED, COMPLETED
    shared_context JSONB DEFAULT '{}'::jsonb, -- The Band Shared State (Code, Architecture Plan, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: agent_events
-- Represents individual actions/logs posted by the agents (useful for the frontend Group Chat UI)
CREATE TABLE public.agent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL, -- e.g., 'Gambit', 'Kuli', 'Glassion'
    event_type TEXT NOT NULL, -- e.g., 'LOG', 'ERROR', 'CODE_UPDATE', 'CSS_FIX'
    output JSONB NOT NULL, -- The specific payload of the event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Realtime Setup
-- Enable realtime for both tables safely and idempotently without dropping other tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_class c ON pr.prrelid = c.oid 
        JOIN pg_publication p ON pr.prpubid = p.oid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'runs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr 
        JOIN pg_class c ON pr.prrelid = c.oid 
        JOIN pg_publication p ON pr.prpubid = p.oid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'agent_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;
    END IF;
END $$;

-- Enable RLS (Row Level Security)
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read-only access for the frontend dashboard
DROP POLICY IF EXISTS "Allow public select on runs" ON public.runs;
CREATE POLICY "Allow public select on runs" ON public.runs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on agent_events" ON public.agent_events;
CREATE POLICY "Allow public select on agent_events" ON public.agent_events
    FOR SELECT USING (true);

-- Auto-update updated_at timestamp on runs
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_runs_modtime ON public.runs;
CREATE TRIGGER update_runs_modtime
BEFORE UPDATE ON public.runs
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

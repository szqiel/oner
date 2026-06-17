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
-- Enable realtime for both tables so the Next.js frontend can animate the dashboard
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;

-- Auto-update updated_at timestamp on runs
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_runs_modtime
BEFORE UPDATE ON public.runs
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

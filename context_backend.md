# Oner - Backend Project Context & Work Log

**Project Goal:** Build an autonomous, multi-agent developer swarm packaged as a full-stack web application (Continuous-shot SPA Builder).
**Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)
**Latest PRD:** `PRD/Oner_PRD_v2.0.md`

## 🚨 AI Operating Instructions (Read & Update Protocol)
**Mandatory Rules for Backend AI Assistant:**
1. **Always Read First:** Read this `context_backend.md` file first to re-orient yourself to the backend architecture, API strategy, and database schema. DO NOT hallucinate.
2. **Update Frequently & Detailed:** Update the **Work Log** section after major work sessions, executions, or bug fixes.
3. **Log the Failures:** Always document what went wrong.

## 🧠 Core Backend Architecture Decisions
*   **Framework:** Node.js + Express.
*   **Orchestration Layer:** Codeband logic (coordinating agents via Band state).
*   **State & Database:** Supabase. The backend will treat Supabase as the absolute source of truth for Band state (`runs`, `agent_events`, etc.).
*   **Execution Model:** Fire-and-forget. The frontend triggers `POST /api/start`, Express spawns asynchronous agent loops, and Next.js listens to Supabase Realtime for state changes.
*   **Cross-Framework Integration (HACKATHON REQUIREMENT):**
    *   **Node.js/JS Agents:** LangChain.js (Librarian, Catalyst), LlamaIndex.ts (Gambit), Native (Crucible, Glassion).
    *   **Python Agents:** AutoGen / CrewAI (Kuli) will be invoked from Express using `child_process.spawn`.
*   **Human-in-the-Loop (HitL):** Resumed via `POST /api/resume` when the UI triggers an escalation override.

## 🤖 Agent Roster
1.  **The Librarian (LangChain):** Dispatcher & model allocator.
2.  **Gambit (LlamaIndex):** The Planner.
3.  **Crucible (Native Node.js):** Plan Reviewer.
4.  **Kuli (AutoGen/CrewAI - Python):** End-to-End Coder.
5.  **Catalyst (LangChain):** Unified QA (Debugger) & Code Reviewer.
6.  **Glassion (Native Multimodal):** Multimodal UI/UX Reviewer.

---

## 📝 Work Log (Chronological)

### [2026-06-18] - Backend Context & Implementation Plan
*   **What was done:** 
    *   Split workloads from the frontend agent. I am now officially the **Backend Agent**.
    *   Conducted a `/grill-me` session to align on Express orchestration, fire-and-forget execution, and `child_process` for Python agent integration.
    *   Drafted the `implementation_plan.md` for the backend.
    *   Addressed Supabase schema initialization: I will handle creating the SQL migration/schema files to set up the DB.
    *   Reiterated the core Hackathon rule (Cross-Framework Multi-Agent System via Band).
*   **What went wrong / Issues faced:** 
    *   *(None yet, still in planning/scaffolding phase for the backend).*
*   **Next Steps:** Wait for user approval on the updated `implementation_plan.md` to begin backend execution and Supabase schema generation.

### [2026-06-18] - Backend Scaffolding Execution
*   **What was done:** 
    *   Created `backend/supabase/schema.sql` defining `runs` and `agent_events`.
    *   Set up Express routing layer (`server.js`, `routes/orchestration.js`) with fire-and-forget `POST /api/start` and `POST /api/resume`.
    *   Created Supabase state integration (`lib/supabase.js`, `services/bandState.js`).
    *   Scaffolded the cross-framework agent functions (`librarian.js`, `gambit.js`, `kuli.js`, `glassion.js`).
    *   Implemented the Codeband core workflow loop in `services/workflowRunner.js`, including the 2-failure HitL escalation protocol for Kuli.
    *   Created `backend/.env` (and populated Supabase URL via MCP) and `backend/.gitignore`.
    *   Switched to `back` git branch and resolved `context.md` git conflicts.
*   **What went wrong / Issues faced:** 
    *   `context_backend.md` was somehow lost during the branch switch/stash phase. Had to recreate it.
*   **Next Steps:** Awaiting the Lead Developer to manually execute the `schema.sql` on the Supabase dashboard and test the API endpoints locally, then proceed to implement specific agent logic.

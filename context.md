# Oner - Project Context & Work Log

**Project Goal:** Build an autonomous, multi-agent developer swarm packaged as a full-stack web application (Continuous-shot SPA Builder).
**Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)
**Latest PRD:** `PRD/Oner_PRD_v2.0.md`

## 🚨 AI Operating Instructions (Read & Update Protocol)
**Mandatory Rules for AI Assistant:**
1. **Always Read First:** Whenever you lose context, are rebooted, or start a new major feature, you MUST read this `context.md` file first to re-orient yourself to the project's architecture, API strategy, and agent roster. DO NOT guess or hallucinate.
2. **Update Frequently & Detailed:** After finishing a work session, executing a major code block, or encountering a significant bug, you MUST update the **Work Log** section at the bottom of this file. 
3. **Log the Failures:** Always document what *went wrong* (bugs, failed approaches) in the Work Log so you don't repeat the same mistakes.

## 🧠 Core Architecture Decisions
*   **Tech Stack:** Band / Codeband (Core Agent Orchestration), Next.js (Dashboard UI), Node.js (Agent Backend), TailwindCSS (Styling), Supabase (State/Database), Vercel (Hosting), HuggingFace (Model tools/inference).
*   **Orchestration Layer:** Inspired by **Codeband** (graph-based, state-sharing communication to prevent agent hallucination).
*   **API Strategy:** 
    *   **Development Phase:** Use **Bluesminds API** to save tokens.
    *   **Production/Judging Phase:** Switch entirely to **AI/ML API** for maximum capability and to demonstrate the "Wow Factor" (Best Use of AI/ML).
*   **The "Wow Factor":**
    *   **The Librarian:** Dynamically assigns specific LLM models based on prompt complexity.
    *   **Glassion (Vision QA):** Evaluates rendered UI against strict high-taste design principles (Emil Kowalski, Impeccable Style, Tasteskill). Outputs explicit CSS JSON to fix "AI Slop."
*   **Human-in-the-Loop (HitL):** If an agent loop fails 2 consecutive times, the system halts and prompts the user (Lead Developer) to manually fix the code in the GUI and resume.
*   **Final Implementation Details:**
    *   **Agent Backend Hosting:** HuggingFace Docker (running the Node.js orchestrator).
    *   **Builder Output Format:** Raw HTML + Tailwind CSS (CDN) + Vanilla JS for instant iframe injection.
    *   **UI Layout:** "Continuous Shot" Floating Panel. The live UI takes 100% of the screen, and agent communications sit in a floating glassmorphic group chat panel.
    *   **Repo Structure:** Monorepo with `frontend/` and `backend/` folders.

## 🤖 Agent Roster
1.  **The Librarian:** Dispatcher & model allocator.
2.  **Gambit:** The Planner.
3.  **Crucible:** Plan Reviewer.
4.  **Kuli:** End-to-End Coder.
5.  **Catalyst:** Unified QA (Debugger) & Code Reviewer (Efficiency).
6.  **Glassion:** Multimodal UI/UX Reviewer.

---

## 📝 Work Log (Chronological)

### [2026-06-16] - Project Inception & Planning
*   **What was done:** 
    *   Read the initial PRD v1.3.
    *   Discussed and agreed upon MVP constraints (consolidating Boug and Catalyst).
    *   Integrated Codeband reference and specific design benchmarks (Emil Kowalski) for Glassion.
    *   Finalized API routing strategy (Bluesminds for Dev, AI/ML API for Prod).
    *   Iteratively updated the PRD up to `v1.6`.
    *   Created this `context.md` file to track progress and prevent context loss.
*   **What went wrong / Issues faced:** 
    *   *(None yet, we are in the planning phase)*
*   **Next Steps:** Awaiting user decision on whether to scaffold the Frontend Dashboard or the Backend Codeband Agent Logic.

### [2026-06-17] - Tech Stack Finalization
*   **What was done:** 
    *   System restarted. Confirmed adherence to AI Operating Instructions.
    *   Finalized the project tech stack: Next.js, Node.js, TailwindCSS, Supabase, Vercel, HuggingFace.
*   **What went wrong / Issues faced:** 
    *   Need to ensure Vercel's serverless timeout limitations don't kill long-running agent loops. May need a dedicated Node.js server for the agent orchestration, separate from Next.js API routes, or use streaming/background jobs.
*   **Next Steps:** Initialize the Next.js project.

### [2026-06-17] - The /grill-me Interview & Architecture Lock-in
*   **What was done:** 
    *   Conducted a `/grill-me` session to resolve all outstanding architectural dependencies.
    *   Locked in HuggingFace Docker for backend hosting, Raw HTML+Tailwind for Kuli's output, a floating glassmorphic UI layout, and a monorepo structure.
*   **What went wrong / Issues faced:** 
    *   *(None, smooth planning phase)*
*   **Next Steps:** Write the `implementation_plan.md` to scaffold the `frontend/` and `backend/` folders.

### [2026-06-17] - Final Hackathon Challenge Alignment
*   **What was done:** 
    *   Reviewed the official hackathon challenge image ("Build a Cross-Framework Multi-Agent System with Band").
    *   Updated the PRD to `v2.0` (Final).
    *   Explicitly assigned different agent frameworks (LangChain, LlamaIndex, AutoGen, Native) to different agents in the roster to mathematically fulfill the "Cross-Framework" challenge requirement.
    *   Cemented Band as the absolute required collaboration layer for state and task handoff.
*   **Next Steps:** Wait for user approval on the `implementation_plan.md` artifact to begin scaffolding.

### [2026-06-17] - Repository Initialization
*   **What was done:** 
    *   Successfully executed the `implementation_plan.md`.
    *   Created the `/backend` directory with `express` and `@supabase/supabase-js`.
    *   Scaffolded the `/frontend` directory using `create-next-app` with Tailwind CSS.
    *   Committed the base boilerplate to Git.
*   **What went wrong / Issues faced:** 
    *   The user requested to avoid Conventional Commits prefixes (like `chore:`) and to use all lowercase strings instead. Adjusted git commit behavior moving forward.
*   **Next Steps:** Begin building the core features (either the Band backend logic or the Next.js split-screen UI layout).

### [2026-06-18] - Agent Workload Split (Frontend Focus)
*   **What was done:** 
    *   The user officially split the development workload. 
    *   **This Agent** is now strictly assigned to the `/frontend` Next.js Dashboard (Continuous Shot UI, Glassmorphism, Iframe).
    *   A **Separate Agent** will handle the `/backend` Codeband Node.js orchestration.
    *   We will use this `context.md` file and shared interface files (like Supabase schemas) to "catch up" and stay synced.
*   **Next Steps:** Create the `implementation_plan.md` for the Next.js Frontend UI layout.

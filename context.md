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
    *   Explicitly assigned different agent frameworks (LangChain, LlamaIndex, Native) to different agents in the roster to mathematically fulfill the "Cross-Framework" challenge requirement.
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

*   **Next Steps:** Wait for the backend agent to finish the Codeband orchestration so we can test the full pipeline.

### [2026-06-18] - Frontend Supabase Integration
*   **What was done:** 
    *   Read the `schema.sql` pushed by the Backend Agent.
    *   Installed `@supabase/supabase-js`.
    *   Replaced the mock UI state in `page.tsx` with active Supabase real-time subscriptions to the `runs` and `agent_events` tables.
    *   The `AgentChatPanel` now dynamically animates new `agent_events` as they are inserted.
    *   The `LivePreview` iframe instantly injects HTML when the `runs` table is updated with `shared_context.html`.
*   **Next Steps:** Await user testing with valid Supabase keys.

### [2026-06-18] - AI Chat Landing Transition
*   **What was done:** 
    *   Restructured the UI to start with a sleek, ChatGPT-style landing screen.
    *   Renamed the original layout to `Dashboard.tsx`.
    *   Created a new master `page.tsx` that manages the state transition.
    *   Used `framer-motion` to smoothly fade out the landing screen and fade in the Continuous Shot dashboard when the user submits a prompt.
    *   Wired the prompt submission to hit `POST /api/start` on the backend.
*   **Next Steps:** Test the full frontend-to-backend pipeline locally.

### [2026-06-18] - Frontend UX Polish
*   **What was done:** 
    *   Updated meta tags in `layout.tsx` to "Oner" and "One-Continuous Web Builder".
    *   Updated the `LandingScreen` H1 and description to match the new branding.
    *   Added `sonner` and implemented `<Toaster />` for error handling (network failures during HitL dispatch).
    *   Built a "Swarm Initialization" animated loading state inside `Dashboard.tsx` to hide the empty iframe until Kuli generates the first HTML payload.
    *   Added a `useRef` auto-scroll mechanism to `AgentChatPanel.tsx` so the feed automatically stays at the newest message.
*   **Next Steps:** Await the backend agent to finish their Langchain/Python logic so we can run an end-to-end test.

### [2026-06-18] - Premium 3D UI & Micro-interactions
*   **What was done:** 
    *   Implemented a global mouse-tracking spotlight on the `page.tsx` layout using Framer Motion (`useMotionValue` and `useMotionTemplate`).
    *   Added 3D Parallax Tilt to the `AgentChatPanel` using `useSpring` and `useTransform` to rotate the panel dynamically as the mouse hovers over it.
    *   Injected custom CSS keyframes (`text-shimmer`, `border-spin`) into `globals.css`.
    *   Applied the animated text shimmer to the Oner H1 logo and an animated conic-gradient rotating border to the prompt input field.
    *   (Update) Fixed the `AgentChatPanel` and `LandingScreen` CSS to ensure the rotating light perfectly traces the 1px edge (Google Stitch style) by utilizing centered container masks and opaque backgrounds.

### [2026-06-19] - Backend Swarm Stabilization & E2E Validation
*   **What was done:**
    *   Identified that the default WebSocket URL for Band was misconfigured as `wss://api.band.ai/socket`. Corrected it to the official endpoint `wss://app.band.ai/api/v1/socket/websocket`.
    *   Added `maxRetries: 5` to both LangChain (`lib/llm.js`) and LlamaIndex (`lib/llamaIndexLLM.js`) to handle API proxy rate limiting.
    *   Increased the retry count to 5 and implemented exponential backoff (`5000 * attempt` ms) in the native agents `crucible.js` and `glassion.js`.
    *   Introduced a 3-second pacing delay between agent steps in the local mock swarm runner (`workflowRunner.js`) to prevent overloading the Bluesminds API proxy.
    *   Fixed a syntax parsing bug in `catalyst.js` where LangChain `PromptTemplate` treated curly braces in output JSON schema examples as input variables; escaped them as `{{` and `}}`.
    *   Verified that the E2E mock swarm completes all phases (Routing, Planning, Crucible Plan Review/Revision loop, Kuli HTML generation, Catalyst QA code review, Glassion Playwright rendering & Visual QA) and transitions to `COMPLETED` successfully.

### [2026-06-19] - Interactive UI & UX Polish (Minimize & Download Features)
*   **What was done:**
    *   Designed and built a premium, collapsible minimized state for the floating chat widget (`AgentChatPanel.tsx`) using Framer Motion's `layout` transitions.
    *   When minimized, the chat widget collapses into a compact glassmorphic circle at the bottom-left of the viewport. It displays a green unread messages count badge that increments dynamically as the swarm pushes events, and a glowing active status indicator.
    *   Clicking the circular bubble smoothly expands the chat panel back to full size.
    *   Created a floating controls bar at the top-right of `Dashboard.tsx` containing two actions: "Open Preview" (renders the generated HTML in a new tab) and "Download HTML" (downloads the self-contained `index.html` file).
    *   Resolved syntax and parsing compiler issues to ensure Turbopack hot reloads the dev server successfully.
*   **Next Steps:** Ready for deploy and demo.



# Oner - Project Context & Work Log

**Project Goal:** Build an autonomous, multi-agent developer swarm packaged as a full-stack web application (Continuous-shot SPA Builder).
**Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)
**Latest PRD:** `PRD/Oner_PRD_v1.6.md`

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

# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) v2.0 (FINAL)

**Project Name:** Oner
**Tagline:** The continuous-shot autonomous developer swarm.
**Target Event:** Band of Agents Hackathon (Challenge: Cross-Framework Multi-Agent System with Band)

## 1. Executive Summary

**Oner** is an autonomous, cross-framework developer swarm packaged as a full-stack web application. Designed to execute software engineering from planning to visual QA in one seamless, continuous workflow (a "oner"), it provides users with a rich Graphical User Interface (GUI) to interact with and monitor the AI agents. 

At the core of Oner is the challenge mandate: **Cross-Framework Collaboration**. Oner utilizes agents built across diverse frameworks (LangChain, LlamaIndex, Native Node.js) and unites them through the **Band** collaboration layer. Band serves as the definitive shared state and communication bus, ensuring agents seamlessly delegate work, hand off tasks, and coordinate state without hallucination. 

**Strategic API Usage:** During internal development, the swarm routes requests through the **Bluesminds API** to conserve tokens. For the final deployment and hackathon judging timeline, all agents switch to the **AI/ML API**, ensuring maximum reasoning capability and visual QA precision.

## 2. Product Scope & Roadmap

### MVP (Hackathon Deliverable)
* **The "Continuous Shot" Floating Dashboard:** A premium, fluid GUI built with Next.js and Tailwind. The live UI preview takes 100% of the screen, while agent communications are displayed in a floating, glassmorphic group chat panel.
* **Single Page Application (SPA) Builder:** The swarm's primary output capability focuses on generating, refining, and visually auditing multi-purpose frontend interfaces (HTML/Tailwind/Vanilla JS for instant iframe injection).
* **Meaningful Band Usage:** Band is not just a thin wrapper; it is the core collaboration layer where agents pass structured JSON state, coordinate handoffs (e.g., Planner -> Coder -> QA), and trigger HitL (Human-in-the-Loop) escalations.
* **Cross-Framework Synergy:** Demonstrating that agents don't need to be built on the same framework to work together, provided they use Band.

### Future Roadmap (Post-MVP)
* **Phase 2 - Fullstack App Generation:** Expanding capabilities to write and wire up databases and backend logic.
* **Phase 3 - Deployment Agent:** Integrating automated CI/CD pipelines and cloud deployment.

## 3. Tech Stack & Architecture

Oner relies on the following definitive tech stack to support real-time, multi-agent orchestration:

*   **Band / Codeband:** The core collaboration layer. Meets the hackathon requirement by enabling cross-framework agents to share structured context and hand off tasks.
*   **Next.js:** The frontend framework for the UI dashboard.
*   **Node.js (HuggingFace Docker):** The backend environment executing the long-running autonomous agent loops.
*   **TailwindCSS:** For rapid styling of the dashboard GUI.
*   **Supabase:** The real-time database. Next.js subscribes to Supabase to animate agent conversations dynamically in the floating panel.
*   **Vercel:** Hosting platform for the Next.js frontend.
*   **HuggingFace:** Backend Docker container host.

## 4. Agent Lineup & Framework Allocations

To fulfill the *Cross-Framework* challenge requirement, our 6 agents are built using diverse underlying frameworks, yet all collaborate meaningfully through **Band**.

| Agent Name | Role & Objective | Underlying Framework | Target API (Prod) |
| :--- | :--- | :--- | :--- |
| **The Librarian** | **Dispatcher:** Analyzes prompt, assigns efficient LLMs to other agents. | **LangChain** (Routing/Chains) | **AI/ML API** |
| **Gambit** | **The Planner:** Researches use cases, creates architectural blueprint. | **LlamaIndex** (RAG/Research) | **AI/ML API** |
| **Crucible** | **Plan Reviewer:** "Forges" the plan, audits Gambit's blueprint. | **Native Node.js / Custom** | **AI/ML API** |
| **Kuli** | **The Coder:** End-to-end brute-force executor writing HTML/Tailwind. | **LlamaIndex** | **AI/ML API** |
| **Catalyst** | **QA & Code Reviewer:** Tests Kuli's code, refactors for efficiency. | **LangChain** | **AI/ML API** |
| **Glassion** | **UI/UX Inquisitor:** Vision reviewer enforcing *Emil Kowalski* design principles against "AI Slop." Outputs CSS JSON. | **Native Node.js (Multimodal)** | **AI/ML API** |

## 5. Workflow & Logic Rules

### A. Initialization Phase
1. User inputs a prompt via the Oner Web GUI.
2. **The Librarian (LangChain)** evaluates the project, assigns models, and posts the *Model Routing Schema* to **Band**.

### B. The Forge (Planning)
1. **Gambit (LlamaIndex)** drafts the SPA structure and posts the summary to Band.
2. **Crucible (Native)** pulls the state from Band, reviews the draft, and iterates. Once approved, Band state updates to `PLAN_LOCKED`.

### C. Assembly & Refactoring (The Coding Loop)
1. **Kuli (LlamaIndex)** reads `PLAN_LOCKED` from Band, writes the HTML/JS, and posts a changelog.
2. **Catalyst (LangChain)** pulls the code from Band, audits for errors/cleanliness, and posts revision instructions back to Band. Kuli revises.

### D. The Aesthetic Inquisition (Vision QA)
1. A headless browser captures a screenshot of Kuli's output.
2. **Glassion (Native Multimodal)** analyzes the UI against its high-taste guidelines. It posts explicit CSS JSON payloads to Band for Kuli to execute.

### E. Escalation Protocol (Human-in-the-Loop)
* If Kuli reaches **2 consecutive failures**, Band halts automated communication.
* An escalation event displays on the GUI: `[ESCALATION TRIGGERED] Kuli has failed 2 consecutive revisions.`
* **HitL Intervention:** The Lead Developer (user) steps in via the GUI, manually edits the code, and resumes the swarm via Band.

## 6. API & Payload Specifications
To optimize tokens and meet the "Meaningful Band usage" requirement:
* Agents **do not** pass raw code via direct API calls. All state, context sharing, and task delegation happen via structured JSON payloads pushed to **Band**.

## 7. Hackathon Success Metrics (Judging Criteria Alignment)
* **Cross-Framework Multi-Agent System (Challenge Rule):** By orchestrating LangChain, LlamaIndex, and Native agents through a single Band collaboration layer, Oner perfectly fulfills the core challenge requirement.
* **Meaningful Band Usage:** Band is the absolute backbone of the workflow. Task handoffs (Gambit -> Kuli), state coordination (`PLAN_LOCKED`), and escalation (HitL) are natively driven by Band.
* **Best Use of AI/ML API:** Utilizing AI/ML API for high-tier reasoning (Librarian) and advanced multimodal vision QA (Glassion).

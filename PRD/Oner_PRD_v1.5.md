# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.5

**Project Name:** Oner
**Tagline:** The continuous-shot autonomous developer swarm.
**Target Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)

## 1. Executive Summary

**Oner** is an autonomous, multi-agent developer swarm packaged as a full-stack web application. Designed to execute software engineering from planning to visual QA in one seamless, continuous workflow (a "oner"), it provides users with a rich Graphical User Interface (GUI) to interact with and monitor the AI agents. 

Inspired heavily by the **Codeband** architecture, Oner orchestrates a graph-based communication layer where agents seamlessly share context without hallucination. Oner maximizes the potential of the **AI/ML API** to create a judging "Wow Factor" through **Dynamic Model Routing** and **Multimodal Anti-Slop QA**. While brute-force coding and testing are routed through the **Bluesminds API** to maximize cost efficiency, the premium AI/ML API powers the Librarian's intelligent model assignment and Glassion's brutal, high-taste visual reviews.

## 2. Product Scope & Roadmap

### MVP (Hackathon Deliverable)
* **The "Continuous Shot" Split-Screen Dashboard:** A premium, fluid GUI built with modern web principles (spring animations, glassmorphism). The left pane displays a beautiful, live feed of the Band communication network. The right pane features a live `iframe` that refreshes upon successful builds, allowing users to watch the application visually construct itself.
* **Single Page Application (SPA) Builder:** The swarm's primary output capability for the MVP focuses on generating, refining, and visually auditing multi-purpose frontend interfaces (e.g., company profiles, landing pages).
* **The AI/ML API "Wow Factor":** Showcasing the power of top-tier AI/ML API endpoints for complex reasoning (The Librarian) and multimodal vision analysis (Glassion).
* **Metadata-Only Graph Communication:** Inspired by Codeband, agents share changelogs and architectural states via a collaborative layer, keeping payloads lightweight and avoiding context window bloat.

### Future Roadmap (Post-MVP)
* **Phase 2 - Fullstack App Generation:** Expanding the swarm's capabilities to write and wire up databases, API routes, and backend logic.
* **Phase 3 - Deployment Agent:** Integrating an agent responsible for automated CI/CD pipelines, containerization, and cloud deployment directly from the Oner dashboard.

## 3. Agent Lineup & API Allocations

| Agent Name | Role & Objective | Target API / Allocation |
| :--- | :--- | :--- |
| **The Librarian** | **Dispatcher:** Analyzes the user's prompt and acts as the brain of the operation. Dynamically selects and assigns the most effective and efficient LLM models to the other agents based on task complexity. | **AI/ML API** (High Reasoning) |
| **Gambit** | **The Planner:** Performs inference, researches the best use cases for the requested project, and creates the architectural blueprint & design system mapping. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Crucible** | **Plan Reviewer:** "Forges" the plan. Audits Gambit's blueprint for structural logic gaps and iterates until it is mature enough to be pushed to the coders. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Kuli** | **The Coder:** The end-to-end brute-force executor. Writes the boilerplate, components, and styling based on the locked plan. | **Bluesminds API** (Execution) |
| **Catalyst** | **QA & Code Reviewer:** Tests Kuli's code to catch rendering/syntax failures, while also performing full code reviews to remove junk, duplicate functions, and useless elements. Ensures the code is clean, effective, and efficient. | **Bluesminds API** (Execution & Refactoring) |
| **Glassion** | **UI/UX Inquisitor:** The visual reviewer. Utilizing Vision models, Glassion ruthlessly audits the UI screenshot against "AI Slop." Driven by the design principles of *Emil Kowalski*, *Impeccable Style*, and *Tasteskill*, Glassion enforces high-taste micro-interactions, premium typography, and perfect color harmony. Outputs strict CSS JSON for Kuli to implement. | **AI/ML API** (Advanced Vision) |

## 4. Workflow & Logic Rules

### A. Initialization Phase
1. User inputs a prompt via the Oner Web GUI (e.g., *"Build a cinematic shotlist application for a production house."*).
2. **The Librarian** evaluates the project requirements, assigns the most efficient models to the swarm, and posts the JSON *Model Routing Schema* to the Codeband-inspired collaboration layer.

### B. The Forge (Planning)
1. **Gambit** drafts the SPA structure, researching best practices for the requested app type, and posts the summary to the Band.
2. **Crucible** reviews and refines the draft. If flawed, it is sent back to Gambit. Once "forged" and approved, the state updates to `PLAN_LOCKED`.

### C. Assembly & Refactoring (The Coding Loop)
1. **Kuli** reads `PLAN_LOCKED`, writes the end-to-end code, and posts a metadata changelog to the Band.
2. **Catalyst** audits the code for both execution errors and code cleanliness. Catalyst posts specific revision instructions to the Band. Kuli revises. The user watches this back-and-forth natively in the Oner GUI left pane.

### D. The Aesthetic Inquisition (Vision QA)
1. The backend renders the UI in a headless browser and captures a screenshot.
2. The screenshot is sent to **Glassion** via the AI/ML API.
3. **Glassion** analyzes the UI against its high-taste design guidelines. If the design lacks micro-interactions, has poor spacing, or feels like generic "AI Slop," Glassion posts explicit CSS JSON payloads to the Band (e.g., enforcing spring animations or fixing contrast ratios) for Kuli to execute.

### E. Escalation Protocol (Human-in-the-Loop Fail-Safe)
* To prevent infinite loops, Kuli's revision attempts are tracked.
* If Kuli's loop counter reaches **2 consecutive failures** on feedback from Catalyst or Glassion, automated communication halts.
* The system triggers an escalation event, displaying an alert on the user's Web GUI: `[ESCALATION TRIGGERED] Kuli has failed 2 consecutive revisions. Manual intervention required.` 
* **HitL Intervention:** The Lead Developer (user) can step in via the GUI, manually edit the code to resolve the bottleneck, and hit **"Resume Swarm"** to un-pause the workflow.

## 5. API & Payload Specifications
To optimize token usage and prevent hallucination, agents rely on state-sharing rather than passing raw code continuously.
* **Allowed Payload Format (Example from Kuli):**
    `"Task: Executed Hero Section styling. Action: Applied dark mode protocol and spring physics to primary CTA based on Glassion feedback. Status: Ready for re-audit. Components Updated: Hero.jsx lines 45-80."`

## 6. Hackathon Success Metrics (Judging Criteria Alignment)
* **Best Use of AI/ML API (The Wow Factor):** Powering Glassion with advanced multimodal vision models to critique UI aesthetics based on industry-leading design systems (*Emil Kowalski/Tasteskill*), and utilizing high-tier reasoning for the Librarian's dynamic model allocation.
* **Business Value:** Demonstrates extreme cost efficiency. By intelligently routing the heavy-lifting coding and testing phases to the Bluesminds API, Oner preserves premium credits for high-stakes tasks, presenting an enterprise-viable architecture.
* **Originality:** The graph-based Codeband orchestration visualized through a highly interactive, "continuous-shot" Web GUI, combined with the HitL recovery system, pushes far beyond standard text-based coding assistants.

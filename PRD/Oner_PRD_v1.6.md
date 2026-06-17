# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.6

**Project Name:** Oner
**Tagline:** The continuous-shot autonomous developer swarm.
**Target Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)

## 1. Executive Summary

**Oner** is an autonomous, multi-agent developer swarm packaged as a full-stack web application. Designed to execute software engineering from planning to visual QA in one seamless, continuous workflow (a "oner"), it provides users with a rich Graphical User Interface (GUI) to interact with and monitor the AI agents. 

Inspired heavily by the **Codeband** architecture, Oner orchestrates a graph-based communication layer where agents seamlessly share context without hallucination. To maximize the potential of the **AI/ML API** and secure the "Wow Factor" for judging, the production/demo environment will run exclusively on AI/ML API's premium endpoints (powering the Librarian's intelligent model assignment and Glassion's brutal, high-taste visual reviews). 

**Strategic API Usage:** During the internal development and testing phase, the swarm will temporarily route requests through the **Bluesminds API**. This ensures we do not burn valuable AI/ML API credits while debugging. For the final deployment, demo video, and hackathon judging timeline, all agents will be permanently switched over to the AI/ML API.

## 2. Product Scope & Roadmap

### MVP (Hackathon Deliverable)
* **The "Continuous Shot" Split-Screen Dashboard:** A premium, fluid GUI built with modern web principles (spring animations, glassmorphism). The left pane displays a beautiful, live feed of the Band communication network. The right pane features a live `iframe` that refreshes upon successful builds, allowing users to watch the application visually construct itself.
* **Single Page Application (SPA) Builder:** The swarm's primary output capability for the MVP focuses on generating, refining, and visually auditing multi-purpose frontend interfaces (e.g., company profiles, landing pages).
* **The AI/ML API "Wow Factor":** Showcasing the full power of AI/ML API in the demo by running all complex reasoning (The Librarian), coding, and multimodal vision analysis (Glassion) through their platform.
* **Metadata-Only Graph Communication:** Inspired by Codeband, agents share changelogs and architectural states via a collaborative layer, keeping payloads lightweight and avoiding context window bloat.

### Future Roadmap (Post-MVP)
* **Phase 2 - Fullstack App Generation:** Expanding the swarm's capabilities to write and wire up databases, API routes, and backend logic.
* **Phase 3 - Deployment Agent:** Integrating an agent responsible for automated CI/CD pipelines, containerization, and cloud deployment directly from the Oner dashboard.

## 3. Agent Lineup & API Allocations

*Note: All agents will utilize Bluesminds API during internal development. Below is the allocation for the final Hackathon Demo/Deployment.*

| Agent Name | Role & Objective | Target API (Demo/Prod) |
| :--- | :--- | :--- |
| **The Librarian** | **Dispatcher:** Analyzes the user's prompt and acts as the brain of the operation. Dynamically selects and assigns the most effective and efficient LLM models to the other agents based on task complexity. | **AI/ML API** |
| **Gambit** | **The Planner:** Performs inference, researches the best use cases for the requested project, and creates the architectural blueprint & design system mapping. | **AI/ML API** |
| **Crucible** | **Plan Reviewer:** "Forges" the plan. Audits Gambit's blueprint for structural logic gaps and iterates until it is mature enough to be pushed to the coders. | **AI/ML API** |
| **Kuli** | **The Coder:** The end-to-end brute-force executor. Writes the boilerplate, components, and styling based on the locked plan. | **AI/ML API** |
| **Catalyst** | **QA & Code Reviewer:** Tests Kuli's code to catch rendering/syntax failures, while also performing full code reviews to remove junk, duplicate functions, and useless elements. Ensures the code is clean, effective, and efficient. | **AI/ML API** |
| **Glassion** | **UI/UX Inquisitor:** The visual reviewer. Utilizing Vision models, Glassion ruthlessly audits the UI screenshot against "AI Slop." Driven by the design principles of *Emil Kowalski*, *Impeccable Style*, and *Tasteskill*, Glassion enforces high-taste micro-interactions, premium typography, and perfect color harmony. Outputs strict CSS JSON for Kuli to implement. | **AI/ML API** (Vision) |

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
2. The screenshot is sent to **Glassion**.
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
* **Best Use of AI/ML API:** During the final demo and judging phase, the entire swarm transitions to the AI/ML API. This demonstrates the platform's ability to handle high-tier reasoning for dynamic model allocation (The Librarian) and advanced multimodal vision analysis for aesthetic QA (Glassion), resulting in a massive "Wow Factor."
* **Business Value (Cost Efficiency):** Oner's architecture allows developers to swap providers. By utilizing cheaper models (Bluesminds API) strictly for internal development/testing, and switching to premium AI/ML API for production, Oner presents an enterprise-viable, cost-scalable architecture.
* **Originality:** The graph-based Codeband orchestration visualized through a highly interactive, "continuous-shot" Web GUI, combined with the HitL recovery system, pushes far beyond standard text-based coding assistants.

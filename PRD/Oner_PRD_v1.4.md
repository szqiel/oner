# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.4

**Project Name:** Oner
**Tagline:** The continuous-shot autonomous developer swarm.
**Target Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)

## 1. Executive Summary

**Oner** is an autonomous, multi-agent developer swarm packaged as a full-stack web application. Designed to execute software engineering from planning to visual QA in one seamless, continuous workflow (a "oner"), it provides users with a rich Graphical User Interface (GUI) to interact with and monitor the AI agents. 

Oner implements **Dynamic Model Routing** and **Multimodal Anti-Slop QA** (evaluating UI aesthetics against high-level design principles). To ensure sustainability and preserve premium AI/ML API credits strictly for the judging timeline and video demonstrations, the core building and testing phases are routed through the **Bluesminds API**. Orchestrated entirely over the **Band** collaboration layer, Oner prevents infinite agent loops through strict escalation protocols, integrates a Human-in-the-Loop (HitL) fail-safe, and visually surfaces all agent communications on the user dashboard in real-time.

## 2. Product Scope & Roadmap

### MVP (Hackathon Deliverable)
* **The "Continuous Shot" Split-Screen Dashboard:** A full-stack GUI. The left pane displays a beautiful, animated feed of the Band metadata communication network. The right pane features a live `iframe` that refreshes upon successful builds, allowing users to watch the app construct itself.
* **Single Page Application (SPA) Builder:** The swarm's primary output capability for the MVP focuses on generating, refining, and visually auditing frontend interfaces (HTML/CSS/JS).
* **Strategic API Dispatching:** The Librarian dynamically assigns models to agents, routing heavy reasoning/vision tasks to the AI/ML API, while delegating the brute-force coding, debugging, and refactoring to the Bluesminds API.
* **Metadata-Only Communication:** Agents share changelogs and architectural decisions via Band, keeping payloads lightweight and efficient and avoiding context window bloat.

### Future Roadmap (Post-MVP)
* **Phase 2 - Fullstack App Generation:** Expanding the swarm's capabilities to write and wire up databases, API routes, and backend logic.
* **Phase 3 - Deployment Agent:** Integrating an agent responsible for automated CI/CD pipelines, containerization, and cloud deployment directly from the Oner dashboard.

## 3. Agent Lineup & API Allocations

| Agent Name | Role & Objective | Target API / Allocation |
| :--- | :--- | :--- |
| **The Librarian** | **Dispatcher:** Reads the prompt, analyzes the scope, outputs a JSON config to dynamically assign tasks, and **explicitly assigns specific LLM models to each agent** based on task complexity. | **AI/ML API** (Reserved for Demo/Judging) |
| **Gambit** | **The Planner:** Performs *Brief Inference* and creates the architectural blueprint & design system mapping. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Crucible** | **Plan Reviewer:** Audits Gambit's blueprint for structural logic gaps. Locks the plan. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Kuli** | **The Coder:** The brute-force executor. Writes the boilerplate, components, and styling based on the locked plan. | **Bluesminds API** (Execution) |
| **Catalyst** | **QA Engineer:** Tests Kuli's code to catch syntax/rendering failures AND refactors the codebase to remove junk/duplicate functions, optimizing for efficiency. | **Bluesminds API** (Execution & Refactoring) |
| **Glassion** | **UI/UX Inquisitor:** Audits UI screenshots against Anti-Slop mandates. **Outputs strictly formatted JSON** containing exact CSS selectors and properties that need changing to fix spatial harmony and contrast. | **AI/ML API** (Vision - Reserved for Demo/Judging) |

## 4. Workflow & Logic Rules

### A. Initialization Phase
1. User inputs a prompt via the Oner Web GUI (e.g., *"Build a cinematic landing page for a production house, minimalist, dark mode."*).
2. **The Librarian** evaluates the prompt, determines the necessary models for the job, and posts the JSON *Model Routing Schema* to the Band platform, assigning specific models to each agent.

### B. The Forge (Planning)
1. **Gambit** drafts the SPA structure and design protocol, posting the summary to Band. This draft is visible on the user dashboard.
2. **Crucible** reviews the draft. If flawed, it is sent back to Gambit (Max 2 loops). Once approved, the state updates to `PLAN_LOCKED`.

### C. Assembly & Refactoring (The Bluesminds Loop)
1. **Kuli** reads `PLAN_LOCKED`, writes the code, and posts a metadata changelog to Band.
2. **Catalyst** audits the code for both execution errors and structural efficiency. Catalyst posts specific revision instructions to Band. Kuli revises based on these instructions. The user watches this back-and-forth natively in the Oner GUI left pane, while the right pane iframe waits for a successful build.

### D. The Aesthetic Inquisition (Vision QA)
1. The backend renders the UI in a headless browser and captures a screenshot.
2. The screenshot and the strict Anti-Slop design prompt are sent to **Glassion**.
3. **Glassion** evaluates the visual output. If the design feels generic, Glassion posts an explicit JSON payload to Band (e.g., `{"target": ".hero-cta", "suggested_css": "background-color: #FFFFFF;"}`) for Kuli to execute.

### E. Escalation Protocol (Human-in-the-Loop Fail-Safe)
* To prevent infinite loops, Kuli's revision attempts are tracked.
* If Kuli's loop counter reaches **2 consecutive failures** on feedback from Catalyst or Glassion, automated communication halts.
* Band triggers an escalation event, displaying an alert on the user's Web GUI: `[ESCALATION TRIGGERED] Kuli has failed 2 consecutive revisions. Manual intervention required.` 
* **HitL Intervention:** The Lead Developer (user) can step in via the GUI, manually edit the code to fix the issue, and hit **"Resume Swarm"** to un-pause the workflow.

## 5. API & Payload Specifications
To optimize token usage and prevent rate-limiting, agents **must not** send raw source code blocks through the Band platform.
* **Allowed Payload Format (Example from Kuli):**
    `"Task: Executed Hero Section styling. Action: Applied dark mode protocol and spring physics to primary CTA. Status: Ready for Glassion visual audit. Components Updated: Hero.jsx lines 45-80."`

## 6. Hackathon Success Metrics (Judging Criteria Alignment)
* **Business Value:** Demonstrates extreme cost efficiency. By intelligently routing the heavy-lifting coding and testing phases to the Bluesminds API, Oner preserves premium AI/ML API credits for high-stakes reasoning and vision QA, presenting an enterprise-viable scalable architecture.
* **Application of Technology:** Seamless orchestration of various LLMs and Vision models, entirely tethered together using Band's collaborative shared context, visualized through a highly interactive, "continuous-shot" Web GUI.
* **Originality:** The dynamic "self-assembling" model allocation (The Librarian), the multimodal aesthetic review loop (Glassion) producing structured CSS JSON, and the HitL recovery system push far beyond standard text-based coding assistants.

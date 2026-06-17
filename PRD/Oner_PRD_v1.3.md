# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.3

**Project Name:** Oner
**Tagline:** The continuous-shot autonomous developer swarm.
**Target Event:** Band of Agents Hackathon (Track 2: Multi-Agent Software Development)

## 1. Executive Summary

**Oner** is an autonomous, multi-agent developer swarm packaged as a full-stack web application. Designed to execute software engineering from planning to visual QA in one seamless, continuous workflow (a "oner"), it provides users with a rich Graphical User Interface (GUI) to interact with and monitor the AI agents. 

Oner implements **Dynamic Model Routing** and **Multimodal Anti-Slop QA** (evaluating UI aesthetics against high-level design principles). To ensure sustainability and preserve premium AI/ML API credits strictly for the judging timeline and video demonstrations, the core building and testing phases are routed through the **Bluesminds API**. Orchestrated entirely over the **Band** collaboration layer, Oner prevents infinite agent loops through strict escalation protocols and visually surfaces all agent communications on the user dashboard.

## 2. Product Scope & Roadmap

### MVP (Hackathon Deliverable)
* **Web-Based Swarm Dashboard:** A full-stack GUI where users input prompts, monitor agent debates in real-time, and view the final rendered output.
* **Single Page Application (SPA) Builder:** The swarm's primary output capability for the MVP focuses on generating, refining, and visually auditing frontend interfaces (HTML/CSS/JS).
* **Strategic API Dispatching:** Routing heavy reasoning/vision tasks to the AI/ML API, while delegating the brute-force coding, debugging, and refactoring to the Bluesminds API.
* **Metadata-Only Communication:** Agents share changelogs and architectural decisions via Band, keeping payloads lightweight and efficient.

### Future Roadmap (Post-MVP)
* **Phase 2 - Fullstack App Generation:** Expanding the swarm's capabilities to write and wire up databases, API routes, and backend logic.
* **Phase 3 - Deployment Agent:** Integrating an agent responsible for automated CI/CD pipelines, containerization, and cloud deployment directly from the Oner dashboard.

## 3. Agent Lineup & API Allocations

| Agent Name | Role & Objective | Target API / Allocation |
| :--- | :--- | :--- |
| **The Librarian** | **Dispatcher:** Reads the prompt, analyzes the scope, and outputs a JSON config to dynamically assign tasks. | **AI/ML API** (Reserved for Demo/Judging) |
| **Gambit** | **The Planner:** Performs *Brief Inference* and creates the architectural blueprint & design system mapping. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Crucible** | **Plan Reviewer:** Audits Gambit's blueprint for structural logic gaps. Locks the plan. | **Bluesminds API** (Mid-Tier Reasoning) |
| **Kuli** | **The Coder:** The brute-force executor. Writes the boilerplate, components, and styling based on the locked plan. | **Bluesminds API** (Execution) |
| **Boug** | **The Debugger:** Tests Kuli's code to catch syntax errors, missing imports, and rendering failures. | **Bluesminds API** (Execution) |
| **Catalyst** | **Code Reviewer:** Refactors the codebase, removes junk/duplicate functions, and optimizes for efficiency. | **Bluesminds API** (Refactoring) |
| **Glassion** | **UI/UX Inquisitor:** Audits UI screenshots against Anti-Slop mandates (spatial harmony, contrast) and dictates design fixes. | **AI/ML API** (Vision - Reserved for Demo/Judging) |

## 4. Workflow & Logic Rules

### A. Initialization Phase
1. User inputs a prompt via the Oner Web GUI (e.g., *"Build a cinematic landing page for a production house, minimalist, dark mode."*).
2. **The Librarian** evaluates the prompt and posts the JSON *Model Routing Schema* to the Band platform.

### B. The Forge (Planning)
1. **Gambit** drafts the SPA structure and design protocol, posting the summary to Band. This draft is visible on the user dashboard.
2. **Crucible** reviews the draft. If flawed, it is sent back to Gambit (Max 2 loops). Once approved, the state updates to `PLAN_LOCKED`.

### C. Assembly & Refactoring (The Bluesminds Loop)
1. **Kuli** reads `PLAN_LOCKED`, writes the code, and posts a metadata changelog to Band.
2. **Boug** and **Catalyst** audit the code and post specific revision instructions to Band. Kuli revises based on these instructions. The user watches this back-and-forth natively in the Oner GUI.

### D. The Aesthetic Inquisition (Vision QA)
1. The backend renders the UI in a headless browser and captures a screenshot.
2. The screenshot and the strict Anti-Slop design prompt are sent to **Glassion**.
3. **Glassion** evaluates the visual output. If the design feels generic, Glassion posts explicit CSS correction metrics to Band for Kuli to execute.

### E. Escalation Protocol (The "Fail-Safe")
* To prevent infinite loops, Kuli's revision attempts are tracked.
* If Kuli's loop counter reaches **2 consecutive failures** on feedback from any reviewer agent, automated communication halts.
* Band triggers an escalation event, displaying a prominent alert on the user's Web GUI: `[ESCALATION TRIGGERED] Kuli has failed 2 consecutive revisions requested by [Agent_Name]. Manual intervention required.` 

## 5. API & Payload Specifications
To optimize token usage and prevent rate-limiting, agents **must not** send raw source code blocks through the Band platform.
* **Allowed Payload Format (Example from Kuli):**
    `"Task: Executed Hero Section styling. Action: Applied dark mode protocol and spring physics to primary CTA. Status: Ready for Glassion visual audit. Components Updated: Hero.jsx lines 45-80."`

## 6. Hackathon Success Metrics (Judging Criteria Alignment)
* **Business Value:** Demonstrates extreme cost efficiency. By intelligently routing the heavy-lifting coding and testing phases to the Bluesminds API, Oner preserves premium AI/ML API credits for high-stakes reasoning and vision QA, presenting an enterprise-viable scalable architecture.
* **Application of Technology:** Seamless orchestration of various LLMs and Vision models, entirely tethered together using Band's collaborative shared context, visualized through a clean Web GUI.
* **Originality:** The dynamic "self-assembling" model allocation (The Librarian) and the multimodal aesthetic review loop (Glassion) push beyond standard text-based coding assistants.
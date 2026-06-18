# Oner Project Handoff — 2026-06-19

## Mission

Finish and validate **Oner**, a continuous-shot autonomous web-builder swarm for the Band of Agents Hackathon.

The submission must visibly demonstrate:

1. At least three agents collaborating through Band.
2. Real agent-to-agent delegation, structured context sharing, review loops, and handoffs through Band.
3. Multiple agent frameworks working together.
4. Band acting as the collaboration layer, not merely as a final notification channel.
5. A smooth end-to-end web experience from user prompt to generated live preview.

Read these files before making further changes:

- `PRD/Oner_PRD_v2.0.md`
- `context.md`
- `context_backend.md`
- This handoff document

Official references:

- Hackathon: https://lablab.ai/ai-hackathons/band-of-agents-hackathon
- Hacker guide: https://www.band.ai/hacker-guide
- Band documentation: https://docs.band.ai/

## Current Repository State

- Branch: `main`
- Worktree is intentionally dirty.
- Do not discard or overwrite existing changes.
- No commit was created during this work session.
- Supabase credentials and six Band agent credential pairs exist in `backend/.env`.
- Frontend Supabase and backend URL variables exist in `frontend/.env.local`.
- Secrets were not copied into this document.

### Known Modified or New Files

Backend:

- `backend/agents/crucible.js`
- `backend/agents/gambit.js`
- `backend/agents/glassion.js`
- `backend/agents/kuli.js`
- `backend/agents/librarian.js`
- `backend/lib/llamaIndexLLM.js`
- `backend/lib/llm.js`
- `backend/lib/provider.js` — new
- `backend/services/bandApi.js` — new/untracked
- `backend/services/bandState.js`
- `backend/services/workflowRunner.js`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/node_modules/.package-lock.json`
- `backend/python/kuli_agent.py` — deleted
- `backend/python/requirements.txt` — deleted
- `backend/python/__pycache__/` — untracked generated directory; remove safely

Frontend:

- `frontend/src/app/page.tsx`
- `frontend/src/components/LandingScreen.tsx`
- `frontend/src/components/Dashboard.tsx`
- `frontend/src/components/AgentChatPanel.tsx`

Documentation:

- `context_backend.md` already contained extensive prior-agent additions.

## What Was Inspected

The entire small repository was inventoried and the major frontend/backend files were read.

Baseline verification before the latest refactor:

- `frontend npm run build` passed.
- `frontend npm run lint` failed with five errors and one warning:
  - four `prefer-const` errors in `src/app/page.tsx`
  - one `no-explicit-any` error and one unused-variable warning in `Dashboard.tsx`
- Supabase connectivity was verified successfully for `runs` and `agent_events`.
- Backend JavaScript modules loaded before the latest refactor.
- The machine does not have a usable Python installation:
  - `python` resolves to MSYS Python without `pip`
  - `py -3.12` reports no installed Python

The latest commands were interrupted before post-refactor verification completed. Treat all new backend changes as unverified until the checklist below passes.

## Important Problems Found

### 1. The real user prompt was lost

The old orchestrator passed the literal string `"Execute Prompt"` to agents. This made generated output unrelated to the actual request.

Current fix:

- `bandState.createRun()` now initializes `shared_context` with `{ prompt }`.
- The rewritten workflow reads `context.prompt` for every agent.

### 2. Band run IDs were discarded

The old listener attempted to read:

`message.mentions[0].metadata.runId`

Band rejects undocumented metadata fields, so this always became `unknown_run_id` and agents silently stopped.

Current fix:

- Handoff messages contain `[RunID: uuid]`.
- They also contain a structured `[ONER_CONTEXT]{...}` JSON envelope.
- `workflowRunner.js` parses the run ID from message text and keeps a room-to-run map.

This format still needs testing against the actual Band payload shape.

### 3. Band message payload used unsupported metadata

The previous `sendMessage()` attached metadata to each mention, despite prior testing proving Band returns `422 Unexpected field`.

Current fix:

- `backend/services/bandApi.js` now sends only documented-looking `content` and `mentions: [{ id }]`.
- Custom state is encoded in the message content.

### 4. Band WebSocket initialization was race-prone

The previous code fired `connect()` without waiting and immediately checked `client.socket`, which did not prove the socket was open or channels were joined.

Current fix:

- `BandClient.connect()` returns a promise.
- Channel joins are awaited.
- Message processing and processed lifecycle calls are included.
- Duplicate message IDs are guarded in memory.

The exact WebSocket URL/topics/events must be verified against the current Band docs and real account behavior. Defaults currently are:

- REST: `https://app.band.ai/api/v1/agent`
- WebSocket: `wss://api.band.ai/socket`
- Topics: `agent_rooms:{agentId}` and `chat_room:{roomId}`
- Event: `message_created`

The `.env` can override them using `BAND_REST_URL` and `BAND_WS_URL`.

### 5. Frontend observed the wrong run

The old dashboard fetched “the most recent run,” which could display another browser/session’s build. Realtime subscriptions also listened to every row.

Current fix:

- `POST /api/start` response is parsed.
- Its returned `runId` is passed into `Dashboard`.
- Initial fetches and realtime subscriptions are filtered to that run.
- The landing screen remains visible if backend start fails.

### 6. HitL input did not resume anything

The old UI only inserted an event row into Supabase. The backend never consumed it.

Current fix:

- The chat input calls `POST /api/resume`.
- The backend merges human feedback into shared context and resumes from Kuli.

This UX should eventually only enable or prominently prompt input when status is `ESCALATED`.

### 7. Shared context updates could erase newer state

Agents fetched an old context object and later replaced the whole JSON column, which can overwrite another agent’s additions.

Current partial fix:

- `mergeSharedContext(runId, patch)` was added.
- Orchestration counters and room IDs use it.

Remaining:

- Agent files still sometimes call `updateSharedContext()` with a previously fetched object.
- For full correctness, implement an atomic Postgres JSONB merge RPC or serialize all updates through one orchestrator queue.

### 8. The Python/FastAPI/AutoGen setup was operationally brittle

The repo required a second FastAPI process and a Python runtime that does not exist on this machine. It weakened deployment reliability.

Current architectural decision:

- Remove the Python microservice.
- Keep one Node.js backend process.
- Maintain genuine cross-framework behavior using:
  - LangChain: Librarian and Catalyst
  - LlamaIndex: Gambit and Kuli
  - Native Node/fetch/Playwright: Crucible and Glassion
- All handoffs still flow through Band.

This is simpler and remains aligned with the challenge’s cross-framework requirement.

The PRD, context files, UI labels, and submission copy still mention AutoGen and must be updated.

### 9. LLM endpoint normalization was wrong

The old logic appended `v1` only when a URL ended with `/`, producing malformed URLs in some configurations.

Current fix:

- `backend/lib/provider.js` normalizes provider URLs.
- It prefers AI/ML API when `AI_ML_API_KEY` is configured and otherwise falls back to Bluesminds.

Current environment status:

- Bluesminds key appears configured.
- AI/ML key does not appear configured.

For judging and “Best Use of AI/ML API,” obtain and configure the AI/ML API key.

### 10. Gambit claimed LlamaIndex but had become LangChain

Current fix:

- `gambit.js` now calls a LlamaIndex `OpenAI` LLM directly through `configureLlamaIndex()`.
- Kuli was also rewritten to use LlamaIndex directly.
- Design guidelines now load `.txt` as well as `.md`; previously the only `.txt` guideline file was ignored.

The exact LlamaIndex completion response shape is not yet verified.

## Current Intended Agent Workflow

1. Frontend sends prompt to `POST /api/start`.
2. Backend creates a Supabase run with prompt in shared context.
3. Librarian executes LangChain model routing.
4. Librarian mentions Gambit through Band.
5. Gambit receives the Band message and creates a LlamaIndex blueprint.
6. Gambit mentions Crucible through Band.
7. Crucible performs native plan review.
8. Rejected plans loop back through Band to Gambit, maximum three plan attempts.
9. Approved plans hand off through Band to Kuli.
10. Kuli uses LlamaIndex to generate complete HTML.
11. Kuli hands off through Band to Catalyst.
12. Catalyst performs LangChain code QA.
13. Failed code loops back through Band to Kuli, maximum two failures before HitL.
14. Passed code hands off through Band to Glassion.
15. Glassion renders via Playwright and performs native multimodal review.
16. Failed visual review loops back through Band to Kuli, maximum two failures before HitL.
17. Passed visual review marks the run `COMPLETED`.
18. Frontend receives run updates and HTML through Supabase Realtime.

`BAND_MOCK_MODE=true` explicitly enables sequential local orchestration. The default should be real Band mode for the hackathon.

## Immediate Next Steps — Execute in This Order

### Step 1: Clean generated artifacts only

Safely remove:

- `backend/python/__pycache__/`

Do not discard any tracked changes.

Consider restoring `backend/node_modules/.package-lock.json` only if its modification is proven to be generated noise and does not represent an intended dependency change.

### Step 2: Run syntax and static checks

From `backend/`:

```powershell
npm.cmd run check
node -e "const { configureLlamaIndex } = require('./lib/llamaIndexLLM'); const llm = configureLlamaIndex('gpt-4o'); console.log(typeof llm.complete)"
```

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run build
```

Fix all failures before runtime testing.

Expected likely issue:

- `Dashboard.tsx` currently labels Kuli as `AutoGen`; change it to `LlamaIndex`.

### Step 3: Add backend tests before real API execution

Create Node built-in tests under `backend/test/` for:

- Provider URL normalization.
- Band handoff envelope construction and run-ID parsing.
- Mention matching for actual expected payload variants.
- `bandState.createRun()` preserving prompt.
- Retry/escalation counters.
- Frontend start endpoint contract if practical.

Export small pure helpers from `workflowRunner.js` or move them into a separate module to make testing easy.

### Step 4: Verify LlamaIndex against the configured provider

Run a minimal completion with the real Bluesminds endpoint.

Confirm:

- `additionalSessionOptions.baseURL` is the correct LlamaIndex configuration.
- `llm.complete({ prompt })` works.
- Response text is available at `response.text`.
- `gpt-4o` and dynamically routed model names are actually accepted by the provider.

If Bluesminds does not support some routed models, constrain Librarian’s allowed model list to known working IDs. Do not route Claude model names through an OpenAI-compatible endpoint unless confirmed supported.

### Step 5: Verify real Band REST contract

Use a harmless existing room if `BAND_ROOM_ID` is set.

Check:

- API base URL.
- Authentication header name.
- Message request body shape.
- Mention object key (`id` versus `agent_id`).
- Processing/processed endpoint paths.
- Events endpoint request body.
- Room creation and participant endpoints if dynamic rooms are required.

Do not send undocumented metadata.

Record actual success and failure payloads in `context_backend.md`, excluding secrets.

### Step 6: Verify Band WebSocket contract

Start the backend and inspect:

- WebSocket connection success.
- Global agent room channel join.
- Chat room channel join for all six agents.
- Actual incoming event name.
- Actual message payload shape.
- Sender identity shape.
- Mentions shape.

Adjust `BandClient` based on captured payloads.

Important: the current defaults are inferred from previous work and are not yet proven end-to-end.

### Step 7: Run the backend locally

From `backend/`:

```powershell
npm.cmd start
```

Check:

- `GET http://localhost:4000/health`
- `POST http://localhost:4000/api/start` with a small prompt.
- Supabase run status progression.
- `agent_events` entries.
- Band room messages showing actual delegation between agents.

If needed, temporarily set `BAND_MOCK_MODE=true` to validate all LLM and Supabase stages independently, but real Band mode must pass before submission.

### Step 8: Validate Playwright/Glassion

Confirm Chromium is installed for the backend Playwright version:

```powershell
npx.cmd playwright install chromium
```

Then test that Glassion:

- renders generated HTML,
- obtains a screenshot,
- sends a supported multimodal request,
- parses JSON reliably,
- loops visual feedback to Kuli instead of immediately failing.

### Step 9: Run frontend and perform browser QA

Start frontend:

```powershell
npm.cmd run dev
```

Use the in-app Browser plugin to test:

- Prompt submission.
- Failure toast when backend is unavailable.
- Correct run isolation.
- Realtime status updates.
- Agent messages in chronological order.
- Live preview appearing when HTML is written.
- Chat panel responsiveness on narrow screens.
- HitL resume path.
- No console errors.

Potential UX improvements:

- Add an explicit visible “Band connected” indicator based on backend state.
- Show a six-agent workflow timeline or graph.
- Disable HitL input unless the run is escalated, or relabel it as general intervention.
- Add restart/new-build action.
- Make the floating panel responsive; fixed `w-96` may overflow small screens.
- Add accessible focus states and labels.

### Step 10: Fix Supabase security

The current SQL creates public tables without RLS policies. This is unsafe if exposed through the Data API.

Required:

- Enable RLS on `runs` and `agent_events`.
- Decide whether this demo is anonymous single-user or authenticated.
- Add narrowly scoped select policies needed by the frontend.
- Keep all inserts/updates server-side where possible.
- Do not expose service-role credentials.

Also verify Realtime publication configuration. The current schema drops and recreates the entire `supabase_realtime` publication, which is too destructive for a shared project. Replace it with idempotent table additions.

### Step 11: Align documentation and submission narrative

Update:

- `PRD/Oner_PRD_v2.0.md`
- `context.md`
- `context_backend.md`
- `frontend/src/components/Dashboard.tsx` framework labels
- README/submission copy

New accurate framework story:

- Librarian — LangChain
- Gambit — LlamaIndex
- Crucible — Native Node.js
- Kuli — LlamaIndex
- Catalyst — LangChain
- Glassion — Native Node.js + Playwright + multimodal API

Explain that Band provides:

- the shared collaboration room,
- explicit agent mentions and handoffs,
- processing lifecycle,
- structured context envelopes,
- revision loops,
- escalation coordination.

Supabase is a persistence and UI realtime projection layer, not the agent collaboration layer.

### Step 12: Add deployment configuration

Frontend target:

- Vercel

Backend target:

- A persistent Node host that supports WebSockets and long-running orchestration.
- Hugging Face Docker is acceptable if configured correctly.

Add:

- Backend Dockerfile.
- Health check.
- Production CORS allowlist.
- Environment variable documentation.
- Graceful shutdown for Band sockets.
- Startup validation that fails clearly when required credentials are absent.

Avoid serverless deployment for the persistent Band WebSocket orchestrator.

### Step 13: Final end-to-end acceptance test

The project is only submission-ready when one fresh prompt demonstrates:

1. A Supabase run is created.
2. Librarian routing is visible.
3. Band shows Librarian → Gambit.
4. Band shows Gambit → Crucible.
5. A review rejection or approval is visible.
6. Band shows Crucible → Kuli.
7. Generated HTML appears in the live preview.
8. Band shows Kuli → Catalyst.
9. Catalyst feedback loops through Band if needed.
10. Band shows Catalyst → Glassion.
11. Glassion visual feedback loops through Band if needed.
12. Run reaches `COMPLETED`, or correctly reaches `ESCALATED` and resumes via user input.
13. Browser console and backend logs contain no unhandled errors.
14. The Band dashboard/chat visibly proves meaningful collaboration.

Record the successful run ID and capture screenshots/video for the submission.

## Known Risks and Decisions to Revisit

### Band transport uncertainty

The code’s REST and WebSocket details still require real-world verification. This is the highest priority.

### In-memory room mapping

`roomRuns` is in memory. Restarting the backend loses mappings, although run IDs are also encoded in messages and `band_room_id` is stored in Supabase. For production robustness, recover active room mappings from Supabase on startup.

### Duplicate delivery

The in-memory `processingMessages` set only prevents duplicates within one process lifetime. Persist processed Band message IDs for crash-safe idempotency if time allows.

### Context race conditions

JSONB replacement can lose concurrent changes. Prefer an atomic Supabase/Postgres merge function.

### LLM JSON reliability

Crucible, Gambit, Glassion, and routing depend on structured JSON. Add schema validation and one repair retry for malformed model output.

### Generated iframe security

`LivePreview` currently uses:

```html
sandbox="allow-scripts allow-same-origin"
```

`allow-same-origin` plus scripts weakens isolation. Remove `allow-same-origin` unless generated code genuinely requires it. Add a restrictive CSP to generated documents if possible.

### CORS

Backend currently uses unrestricted `cors()`. Restrict production origins.

### Model/provider mismatch

Librarian’s old allowed list includes model IDs that may not exist on Bluesminds. Verify and constrain routing.

## Suggested Definition of Done

- Frontend lint and production build pass.
- Backend syntax checks and tests pass.
- Mock workflow completes.
- Real Band workflow completes with at least three agents visibly collaborating.
- HitL escalation and resume work.
- Supabase is secured with RLS.
- No Python/FastAPI runtime is required.
- Documentation accurately reflects the implemented architecture.
- Deployment instructions are complete.
- A recorded demo proves the complete workflow.

## Final Note to the Next Agent

Do not optimize the visual polish before proving the actual Band message chain. The project already has a strong visual shell. Its submission risk is integration truth: real Band handoffs, correct run state, reliable retries, and a repeatable end-to-end demo.

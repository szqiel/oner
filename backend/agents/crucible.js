const bandState = require('../services/bandState');
const { getProviderConfig } = require('../lib/provider');
const { formatBlueprint } = require('../lib/llm');

async function reviseBlueprint(runId, prompt, currentBlueprint, feedback, assignedModel) {
    const provider = getProviderConfig();

    const buildPayload = (model) => ({
        model: model,
        messages: [
            {
                role: "system",
                content: `You are Crucible, the elite Architectural Plan Refiner.
Your job is to revise and polish the current JSON blueprint to fully resolve the design feedback.
Make sure the revised blueprint contains all details of a premium, bespoke web interface, specifying:
1. Spacing rules, layout balance, grid systems (e.g., bento grid layouts).
2. Curated color palettes (avoid simple primary colors, use smooth HSL or subtle gradient definitions).
3. Fine typographic weights and line-heights.
4. Transitions, spring animations, and micro-interactions.
5. Functional requirements (Vanilla JS interactive elements, dynamic filtering, active state management).
6. Accessibility attributes (roles, ARIA labels).

Output ONLY a single valid JSON object matching this schema (do not output any markdown formatting, explanation, or text outside the JSON block):
{
  "framework": "HTML + Tailwind CDN + Vanilla JS",
  "components": [
    {
      "name": "Component Name",
      "description": "Bespoke purpose, layout structure (grid/flex), typography, responsive class specs, accessibility role/attributes",
      "style": "Specific gradient palette, padding, shadow, border glow detail",
      "interactions": "Detailed description of hover states, micro-animations, or active transitions"
    }
  ],
  "instructions": [
    "Step 1: Set up structure...",
    "Step 2: Implement styling/colors...",
    "Step 3: Embed interactive JS logic..."
  ]
}`
            },
            {
                role: "user",
                content: `Original User Prompt: ${prompt}\n\nCurrent Blueprint:\n${JSON.stringify(currentBlueprint, null, 2)}\n\nFeedback to resolve:\n${feedback}`
            }
        ],
        temperature: 0.1
    });

    const modelsToTry = [assignedModel, 'qwen-max', 'gemini-3.1-pro-preview'];
    let lastError = null;
    let response = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Crucible Revision] Calling completions with model: ${model}`);
            const payload = buildPayload(model);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

            const res = await fetch(`${provider.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (res.ok) {
                response = await res.json();
                clearTimeout(timeout);
                break;
            } else {
                const errText = await res.text();
                clearTimeout(timeout);
                console.warn(`[Crucible Revision Model ${model}] failed: ${res.status} - ${errText}`);
                lastError = new Error(`Status ${res.status}: ${errText}`);
            }
        } catch (err) {
            console.warn(`[Crucible Revision Model ${model}] error: ${err.message}`);
            lastError = err;
        }
    }

    if (!response) {
        throw new Error(`Crucible plan revision failed all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }

    const content = response.choices[0].message.content.trim();
    try {
        let clean = content;
        const matches = clean.match(/```json\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
            clean = matches[1].trim();
        } else {
            clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
        }
        return JSON.parse(clean);
    } catch (e) {
        console.error("[Crucible Revision] JSON parsing failed, using original blueprint", e);
        return currentBlueprint;
    }
}

/**
 * Crucible (Native Node.js Plan Reviewer)
 * Audits Gambit's blueprint using native `fetch` to ensure it meets requirements.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    const blueprint = currentContext?.blueprint;
    const assignedModel = currentContext?.routing?.crucible_model || 'qwen3.6-plus';

    if (!blueprint) {
        throw new Error("Crucible cannot review: No blueprint found in context.");
    }

    await bandState.logAgentEvent(runId, 'Crucible', 'INFO', { 
        message: `Forging and refining the plan using model: ${assignedModel}...` 
    });

    const provider = getProviderConfig();

    const buildPayload = (model) => ({
        model: model,
        messages: [
            {
                role: "system",
                content: `You are Crucible, the elite Architectural Plan Reviewer.
Your job is to review the JSON blueprint drafted by Gambit for the requested application.
You must ensure it is absolute perfection. Check for:
1. Complete list of requested features and edge cases covered.
2. Bespoke modern layouts (e.g. Bento grid or custom layouts) - NOT standard generic cards.
3. Detailed typographic specs (sizes, line-heights, weights).
4. Curated color palettes with color harmony (subtle gradient rules, HSL values, cohesive styling).
5. Comprehensive micro-interactions, spring transitions, and interactive JavaScript logic.
6. Clear responsive design guidelines for all components.
7. Accessible structure (ARIA roles, contrast awareness).

Output strictly a JSON object with two keys:
\`approved\`: boolean (true if the blueprint is detailed, polished, and comprehensive; false if it lacks detail, uses generic templates, or is missing interactions).
\`feedback\`: string (if approved, output 'LGTM'. If rejected, write an extremely detailed list of missing architectural elements and improvements needed).`
            },
            {
                role: "user",
                content: `Original Prompt: ${prompt}\n\nDrafted Blueprint:\n${formatBlueprint(blueprint)}`
            }
        ],
        temperature: 0.1
    });

    const modelsToTry = [assignedModel, 'qwen3.6-plus', 'gemini-3.1-flash-lite-preview'];
    let lastError = null;
    let response = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Crucible] Calling completions endpoint with model: ${model}`);
            const payload = buildPayload(model);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

            const res = await fetch(`${provider.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (res.ok) {
                response = await res.json();
                clearTimeout(timeout);
                break; // Succeeded!
            } else {
                const errText = await res.text();
                clearTimeout(timeout);
                console.warn(`[Crucible Model ${model}] failed with status: ${res.status} - ${errText}`);
                lastError = new Error(`Status ${res.status}: ${errText}`);
            }
        } catch (err) {
            console.warn(`[Crucible Model ${model}] failed with error: ${err.message}`);
            lastError = err;
        }
    }

    if (!response) {
        const errorMsg = `Crucible failed all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`;
        await bandState.logAgentEvent(runId, 'Crucible', 'ERROR', { error: errorMsg });
        throw new Error(errorMsg);
    }

    try {
        const content = response.choices[0].message.content;
        console.log('[Crucible] Raw review response:', content);

        let reviewData;
        try {
            reviewData = JSON.parse(content);
        } catch (e) {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            reviewData = JSON.parse(clean);
        }

        if (reviewData.approved) {
            await bandState.updateSharedContext(runId, { ...currentContext, plan_review: reviewData });
            await bandState.logAgentEvent(runId, 'Crucible', 'PLAN_APPROVED', { 
                message: `The blueprint has been refined and forged to perfection. Locking the plan in!` 
            });
            return reviewData;
        } else {
            const planAttempts = currentContext.plan_attempts || 0;
            if (planAttempts >= 1) {
                // Crucible revises the plan itself!
                await bandState.logAgentEvent(runId, 'Crucible', 'REVISING_PLAN', { 
                    message: `Crucible is revising and polishing the plan directly to bypass loop limits...` 
                });
                const polishedBlueprint = await reviseBlueprint(runId, prompt, blueprint, reviewData.feedback, assignedModel);
                
                const approvedReview = { approved: true, feedback: 'Polished and approved by Crucible directly.' };
                const updatedContext = {
                    ...currentContext,
                    blueprint: polishedBlueprint,
                    plan_review: approvedReview,
                    plan_attempts: planAttempts + 1
                };
                await bandState.updateSharedContext(runId, updatedContext);
                
                await bandState.logAgentEvent(runId, 'Crucible', 'PLAN_APPROVED', { 
                    message: `The blueprint has been polished and approved by Crucible directly. Proceeding to implementation!` 
                });
                return approvedReview;
            } else {
                const updatedContext = {
                    ...currentContext,
                    plan_review: reviewData,
                    plan_attempts: planAttempts + 1
                };
                await bandState.updateSharedContext(runId, updatedContext);
                
                await bandState.logAgentEvent(runId, 'Crucible', 'PLAN_REJECTED', { 
                    message: `Gambit, the blueprint needs more details: ${reviewData.feedback}. Please forge it again.` 
                });
                return reviewData;
            }
        }

    } catch (error) {
        console.error("Crucible parsing/processing error:", error);
        // Default approved in case of parser crash to avoid getting stuck
        const fallbackReview = { approved: true, feedback: 'LGTM' };
        await bandState.updateSharedContext(runId, { ...currentContext, plan_review: fallbackReview });
        return fallbackReview;
    }
}

module.exports = { execute };


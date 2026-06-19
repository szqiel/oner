const path = require('path');
const fs = require('fs').promises;
const bandState = require('../services/bandState');
const { getProviderConfig } = require('../lib/provider');

/**
 * Gambit (Native Fetch completions)
 * The Planner. Drafts the architectural blueprint based on the prompt.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    
    // Check if there's feedback from Crucible
    const feedback = currentContext?.plan_review?.approved === false ? currentContext.plan_review.feedback : null;
    
    // Read assigned model with fallback
    const assignedModel = currentContext?.routing?.gambit_model || 'gemini-3.1-pro-preview';
    
    if (feedback) {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { 
            message: `Ah, I see. Revising the blueprint using model ${assignedModel} to address Crucible's feedback: ${feedback}` 
        });
    } else {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { 
            message: `Drafting a highly detailed architectural blueprint using model ${assignedModel}...` 
        });
    }
    
    try {
        // Read design guidelines from data/ directory
        const guidelinesDir = path.join(__dirname, '../data');
        const files = await fs.readdir(guidelinesDir);
        let guidelinesText = '';
        for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.txt')) {
                const content = await fs.readFile(path.join(guidelinesDir, file), 'utf8');
                guidelinesText += `\n--- ${file} ---\n${content}\n`;
            }
        }

        const formatInstructions = `Return only a single valid JSON object matching this schema:
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
    "Step 3: Embed interactive JS logic (e.g. search filters, tab switches, dynamic counters)..."
  ]
}`;

        let templateString = `
Based on the following design guidelines:
{guidelinesText}

And the following user request:
"{prompt}"

Draft a highly detailed and comprehensive architectural blueprint for the web application.
Your plan must cover all necessary parts of a premium, bespoke web interface, specifying:
1. Spacing rules, layout balance, grid systems (e.g., bento grid layouts).
2. Curated color palettes (avoid simple primary colors, use smooth HSL or subtle gradient definitions).
3. Fine typographic weights and line-heights.
4. Transitions, spring animations, and micro-interactions.
5. Functional requirements (Vanilla JS interactive elements, dynamic filtering, active state management).
6. Accessibility attributes (roles, ARIA labels).

{formatInstructions}
`;

        if (feedback) {
            templateString = `
You previously drafted a blueprint for "{prompt}", but it was rejected with this feedback: "{feedback}".
Please revise and perfect the architectural blueprint to address this feedback while adhering to the design guidelines.

Design Guidelines:
{guidelinesText}

{formatInstructions}
`;
        }

        const formattedPrompt = templateString
            .replaceAll('{prompt}', prompt)
            .replaceAll('{guidelinesText}', guidelinesText)
            .replaceAll('{feedback}', feedback || '')
            .replaceAll('{formatInstructions}', formatInstructions);

        // Try assigned model, with fallback models if rate-limited or fails (strictly from user images)
        const modelsToTry = [assignedModel, 'gemini-3.1-pro-preview', 'qwen-max', 'qwen3.6-plus'];
        let lastError = null;
        let response = null;
        const provider = getProviderConfig();

        const buildPayload = (model) => ({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are Gambit, the elite multi-agent swarm architect. Draft a highly detailed architectural blueprint in JSON format."
                },
                {
                    role: "user",
                    content: formattedPrompt
                }
            ],
            temperature: 0.1
        });

        for (const model of modelsToTry) {
            try {
                console.log(`[Gambit] Calling completions endpoint with model: ${model}`);
                const payload = buildPayload(model);
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 35000); // 35s timeout
                
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
                    console.warn(`[Gambit Model ${model}] failed with status: ${res.status} - ${errText}`);
                    lastError = new Error(`Status ${res.status}: ${errText}`);
                }
            } catch (err) {
                console.warn(`[Gambit Model ${model}] failed with error: ${err.message}`);
                lastError = err;
                // Add a pacing delay of 3 seconds to cool down rate limits
                await new Promise(res => setTimeout(res, 3000));
            }
        }

        if (!response) {
            throw new Error(`Gambit failed all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`);
        }

        const rawText = response.choices[0].message.content.trim();

        const raw = rawText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
            
        const blueprint = JSON.parse(raw);
        if (!blueprint.framework || !Array.isArray(blueprint.components) || !Array.isArray(blueprint.instructions)) {
            throw new Error('Gambit returned an invalid blueprint shape.');
        }

        // Update Band State
        await bandState.updateSharedContext(runId, { ...currentContext, blueprint });
        await bandState.logAgentEvent(runId, 'Gambit', 'BLUEPRINT_READY', { 
            message: `Architectural blueprint is completed and detailed. Crucible, please forge and refine it!` 
        });

    } catch (error) {
        console.error("Gambit Error:", error);
        await bandState.logAgentEvent(runId, 'Gambit', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

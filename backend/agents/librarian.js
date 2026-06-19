const { z } = require('zod');
const { PromptTemplate } = require('@langchain/core/prompts');
const { getLLM } = require('../lib/llm');
const bandState = require('../services/bandState');

// Available models on AI/ML API (strictly from the user's images)
const MODEL_LIBRARY = [
    "gemma-4-31b-it",
    "minimax/m2-7-20260402",
    "gpt-5.4-pro-2026-03-05",
    "gpt-5.4-2026-03-05",
    "minimax/m2-5-20260218",
    "qwen3.5-plus",
    "gemini-3.1-pro-preview",
    "claude-sonnet-4-6",
    "glm-5",
    "moonshot/kimi-k2-5",
    "claude-opus-4-6",
    "qwen3.6-flash",
    "qwen3.6-max-preview",
    "qwen3.6-plus",
    "qwen3.6-35b-a3b",
    "xiaomi/mimo-v2.5",
    "xiaomi/mimo-v2.5-pro",
    "qwen3.6-27b",
    "moonshot/kimi-k2-6",
    "minimax/m2-1-highspeed",
    "minimax/m2-7-highspeed",
    "minimax/m2-her",
    "grok-4-20-0309-reasoning",
    "glm-5.1",
    "deepseek-v4-flash",
    "gemini-3.1-flash-lite-preview",
    "gpt-5.2-2025-12-11",
    "claude-opus-4-5-20251101",
    "gpt-5.1-2025-11-13",
    "qwen3-vl-plus",
    "gpt-5-pro",
    "qwen-max",
    "qwen-plus",
    "glm-5.2",
    "xai/grok-build-0-1",
    "stepfun/step-3.7-flash",
    "qwen3.7-plus",
    "minimax/minimax-m3",
    "qwen3.7-max",
    "nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "nemotron-3-super-120b-a12b"
];

// Helper to sanitize JSON response from LLM
function sanitizeJSON(content) {
    let clean = content.trim();
    
    // Look for markdown code block
    const matches = clean.match(/```json\s*([\s\S]*?)\s*```/);
    if (matches && matches[1]) {
        clean = matches[1].trim();
    } else {
        // Fallback: strip any backticks
        clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    return JSON.parse(clean);
}

/**
 * The Librarian (LangChain router)
 * Evaluates the user prompt and assigns models.
 */
async function execute(runId, prompt) {
    await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING', { 
        message: `Evaluating prompt complexity and routing using AI/ML API...` 
    });
    
    const formatInstructions = `Output strictly a JSON object with keys:
'gambit_model', 'crucible_model', 'kuli_model', 'catalyst_model', and 'glassion_model'.
Values MUST be model names selected from the provided list: {model_list}. Do not output schemas or markdown formatting outside the JSON block.`;

    const promptTemplate = new PromptTemplate({
        template: `You are The Librarian, the master dispatcher of the Oner multi-agent developer swarm.
Your job is to analyze the user's prompt and assign the most appropriate LLM model for each role.

Here is the library of models available:
{model_list}

Use these routing guidelines:
1. **Gambit (The Planner)**: Needs heavy architectural reasoning. Choose a strong model like "gemini-3.1-pro-preview", "qwen-max", or "gpt-5.4-pro-2026-03-05".
2. **Crucible (The plan refiner)**: Needs strong validation logic. Choose a model like "qwen3.6-plus" or "gemini-3.1-flash-lite-preview".
3. **Kuli (The Coder)**: Needs precise code generation. Choose a model like "qwen-max", "gemini-3.1-pro-preview", or "claude-sonnet-4-6".
4. **Catalyst (The Code QA)**: Needs fast syntax validation. Choose a model like "qwen3.6-flash" or "gemini-3.1-flash-lite-preview".
5. **Glassion (The Visual QA)**: MUST support vision (multimodal). Choose from: "gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview", "qwen3-vl-plus".

Analyze this prompt:
"{prompt}"

{format_instructions}
`,
        inputVariables: ["prompt"],
        partialVariables: { 
            format_instructions: formatInstructions,
            model_list: MODEL_LIBRARY.join(', ')
        }
    });

    // Librarian strictly uses Gemini 3.1 Pro only
    const modelsToTry = ['gemini-3.1-pro-preview'];
    let lastError = null;
    let response = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Librarian] Invoking LangChain LLM with model: ${model}`);
            const llm = getLLM(model);
            const chain = promptTemplate.pipe(llm);
            response = await chain.invoke({ prompt });
            break;
        } catch (err) {
            console.warn(`[Librarian Model ${model}] failed: ${err.message}`);
            lastError = err;
        }
    }

    if (!response) {
        const errorMsg = `Librarian failed to call all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`;
        await bandState.logAgentEvent(runId, 'The Librarian', 'ERROR', { error: errorMsg });
        throw new Error(errorMsg);
    }

    const content = response.content || String(response);
    console.log('[Librarian] Raw response:', content);

    try {
        const routingData = sanitizeJSON(content);

        // Validate shape and apply base fallbacks if any are missing or invalid
        const finalRouting = {
            gambit_model: MODEL_LIBRARY.includes(routingData.gambit_model) ? routingData.gambit_model : 'gemini-3.1-pro-preview',
            crucible_model: MODEL_LIBRARY.includes(routingData.crucible_model) ? routingData.crucible_model : 'qwen3.6-plus',
            kuli_model: MODEL_LIBRARY.includes(routingData.kuli_model) ? routingData.kuli_model : 'qwen-max',
            catalyst_model: MODEL_LIBRARY.includes(routingData.catalyst_model) ? routingData.catalyst_model : 'qwen3.6-flash',
            glassion_model: ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview", "qwen3-vl-plus"].includes(routingData.glassion_model)
                ? routingData.glassion_model 
                : 'gemini-3.1-pro-preview'
        };

        console.log(`[Librarian] Model routing locked:`, JSON.stringify(finalRouting));

        // Update Band State
        const currentContext = await bandState.getSharedContext(runId);
        await bandState.updateSharedContext(runId, { ...currentContext, routing: finalRouting });
        
        await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING_COMPLETE', { 
            message: `Decided model assignments: Gambit (${finalRouting.gambit_model}), Crucible (${finalRouting.crucible_model}), Kuli (${finalRouting.kuli_model}), Catalyst (${finalRouting.catalyst_model}), Glassion (${finalRouting.glassion_model}). Let's build!` 
        });
        
    } catch (error) {
        console.error("Librarian parsing/validation error:", error);
        const defaultRouting = {
            gambit_model: 'gemini-3.1-pro-preview',
            crucible_model: 'qwen3.6-plus',
            kuli_model: 'qwen-max',
            catalyst_model: 'qwen3.6-flash',
            glassion_model: 'gemini-3.1-pro-preview'
        };
        const currentContext = await bandState.getSharedContext(runId);
        await bandState.updateSharedContext(runId, { ...currentContext, routing: defaultRouting });
        await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING_COMPLETE', { 
            message: `Librarian parsing failed; fell back to default AI/ML API routing.` 
        });
    }
}

module.exports = { execute };


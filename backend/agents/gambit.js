const path = require('path');
const fs = require('fs').promises;
const { configureLlamaIndex } = require('../lib/llamaIndexLLM');
const bandState = require('../services/bandState');

/**
 * Gambit (LlamaIndex)
 * The Planner. Drafts the architectural blueprint based on the prompt.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    
    // Check if there's feedback from Crucible
    const feedback = currentContext?.plan_review?.approved === false ? currentContext.plan_review.feedback : null;
    
    // We enforce gpt-4o because of Bluesminds API compatibility
    const modelName = 'gpt-4o';
    
    if (feedback) {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { message: `Ah, I see. Revising the blueprint now to address your feedback: ${feedback}` });
    } else {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { message: `Got it, boss. Reading our design guidelines right now. I'll draft the blueprint layout shortly.` });
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

        const llm = configureLlamaIndex(modelName);
        const formatInstructions = `Return only JSON with this schema:
{"framework":"HTML + Tailwind CDN + Vanilla JS","components":["..."],"instructions":["..."]}`;

        let templateString = `
Based on the following design guidelines:
{guidelinesText}

And the following user request:
"{prompt}"

Draft an architectural blueprint for the web application. 
{formatInstructions}
`;

        if (feedback) {
            templateString = `
You previously drafted a blueprint for "{prompt}", but it was rejected with this feedback: "{feedback}".
Please revise the architectural blueprint to address this feedback while adhering to the design guidelines.

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

        const response = await llm.complete({ prompt: formattedPrompt });
        const raw = String(response.text || response.message?.content || response)
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
        const blueprint = JSON.parse(raw);
        if (!blueprint.framework || !Array.isArray(blueprint.components) || !Array.isArray(blueprint.instructions)) {
            throw new Error('Gambit returned an invalid blueprint shape.');
        }

        // Update Band State
        await bandState.updateSharedContext(runId, { ...currentContext, blueprint });
        
        await bandState.logAgentEvent(runId, 'Gambit', 'BLUEPRINT_READY', { message: `Alright Crucible, the blueprint is ready and locked in. Please review it!` });

    } catch (error) {
        console.error("Gambit Error:", error);
        await bandState.logAgentEvent(runId, 'Gambit', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

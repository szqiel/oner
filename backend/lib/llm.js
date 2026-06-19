require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');
const { getProviderConfig } = require('./provider');

/**
 * Initializes and returns a ChatOpenAI instance configured for the active API provider.
 * During development, we use Bluesminds API.
 * 
 * @param {string} modelName - The model to use (e.g. 'gpt-5-nano')
 * @returns {ChatOpenAI}
 */
function getLLM(modelName = 'gpt-4o') {
    const provider = getProviderConfig();

    return new ChatOpenAI({
        apiKey: provider.apiKey,
        modelName: modelName,
        temperature: 0.1,
        maxRetries: 0,
        timeout: 30000, // 30s timeout
        configuration: {
            baseURL: provider.baseURL,
        }
    });
}

function formatBlueprint(blueprint) {
    if (!blueprint) return '';
    const framework = blueprint.framework || 'HTML + Tailwind CDN + Vanilla JS';
    const components = Array.isArray(blueprint.components) 
        ? blueprint.components.map(c => `- ${typeof c === 'object' ? JSON.stringify(c) : c}`).join('\n') 
        : '';
    const instructions = Array.isArray(blueprint.instructions) 
        ? blueprint.instructions.map(i => `- ${typeof i === 'object' ? JSON.stringify(i) : i}`).join('\n') 
        : '';
    return `Framework: ${framework}\n\nComponents:\n${components}\n\nInstructions:\n${instructions}`;
}

module.exports = { getLLM, formatBlueprint };

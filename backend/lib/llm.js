require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

/**
 * Initializes and returns a ChatOpenAI instance configured for the active API provider.
 * During development, we use Bluesminds API.
 * 
 * @param {string} modelName - The model to use (e.g. 'gpt-5-nano')
 * @returns {ChatOpenAI}
 */
function getLLM(modelName = 'gpt-5-nano') {
    // If AI_ML API is active (production), we would switch this.
    // But currently we enforce Bluesminds API for development.
    const apiKey = process.env.BLUESMINDS_API_KEY || 'placeholder_key';
    const baseURL = process.env.BLUESMINDS_API_BASE_URL || 'https://api.bluesminds.com/v1';

    return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.1, // Low temperature for deterministic routing
        configuration: {
            baseURL: baseURL,
        }
    });
}

module.exports = { getLLM };

const { Settings } = require('llamaindex');
const { OpenAI } = require('@llamaindex/openai');
const { getProviderConfig } = require('./provider');
require('dotenv').config();

/**
 * Configures the global LlamaIndex Settings to use our selected model and custom API endpoint (Bluesminds).
 */
function configureLlamaIndex(modelName) {
    const provider = getProviderConfig();

    const llm = new OpenAI({
        model: modelName,
        apiKey: provider.apiKey,
        maxRetries: 0,
        timeout: 30000, // 30s timeout
        additionalSessionOptions: {
            baseURL: provider.baseURL
        }
    });

    const { BaseEmbedding } = require('llamaindex');
    class DummyEmbedding extends BaseEmbedding {
        async getTextEmbedding(text) { return [0]; }
        async getQueryEmbedding(query) { return [0]; }
    }
    const embedModel = new DummyEmbedding();

    Settings.llm = llm;
    Settings.embedModel = embedModel;
    return llm;
}

module.exports = { configureLlamaIndex };

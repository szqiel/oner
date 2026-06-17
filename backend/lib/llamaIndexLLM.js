const { OpenAI, OpenAIEmbedding, Settings } = require('llamaindex');
require('dotenv').config();

/**
 * Configures the global LlamaIndex Settings to use our selected model and custom API endpoint (Bluesminds).
 */
function configureLlamaIndex(modelName) {
    const apiKey = process.env.BLUESMINDS_API_KEY || 'placeholder_key';
    const baseURL = process.env.BLUESMINDS_API_BASE_URL || 'https://api.bluesminds.com/v1';

    const llm = new OpenAI({
        model: modelName,
        apiKey: apiKey,
        additionalSessionOptions: {
            baseURL: baseURL
        }
    });

    // Configure the embedding model. Even though we are querying a local file, LlamaIndex needs to embed the query.
    // If the custom API provider does not support text-embedding-ada-002, this might need to be changed to a supported embedding model.
    const embedModel = new OpenAIEmbedding({
        model: 'text-embedding-ada-002',
        apiKey: apiKey,
        additionalSessionOptions: {
            baseURL: baseURL
        }
    });

    Settings.llm = llm;
    Settings.embedModel = embedModel;
}

module.exports = { configureLlamaIndex };

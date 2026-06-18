require('dotenv').config();

function normalizeBaseUrl(value) {
    const trimmed = value.replace(/\/+$/, '');
    return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function getProviderConfig() {
    const aiMlApiKey = process.env.AI_ML_API_KEY;
    const isAiMlConfigured = aiMlApiKey && 
        !aiMlApiKey.includes('placeholder') && 
        !aiMlApiKey.includes('YOUR_') && 
        aiMlApiKey.trim() !== '';

    if (isAiMlConfigured) {
        return {
            name: 'AI/ML API',
            apiKey: aiMlApiKey,
            baseURL: normalizeBaseUrl(process.env.AI_ML_API_BASE_URL || 'https://api.aimlapi.com/v1')
        };
    }

    if (process.env.BLUESMINDS_API_KEY && !process.env.BLUESMINDS_API_KEY.includes('YOUR_')) {
        return {
            name: 'Bluesminds',
            apiKey: process.env.BLUESMINDS_API_KEY,
            baseURL: normalizeBaseUrl(process.env.BLUESMINDS_API_BASE_URL || 'https://api.bluesminds.com/v1')
        };
    }

    throw new Error('No LLM provider is configured. Set AI_ML_API_KEY or BLUESMINDS_API_KEY.');
}

module.exports = { getProviderConfig, normalizeBaseUrl };

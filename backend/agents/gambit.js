const path = require('path');
const { SimpleDirectoryReader, VectorStoreIndex } = require('llamaindex');
const bandState = require('../services/bandState');
const { configureLlamaIndex } = require('../lib/llamaIndexLLM');

/**
 * Gambit (LlamaIndex)
 * The Planner. Drafts the architectural blueprint based on the prompt.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    
    // Check if there's feedback from Crucible
    const feedback = currentContext?.plan_review?.approved === false ? currentContext.plan_review.feedback : null;
    
    // Retrieve the model name
    const modelName = currentContext?.routing?.gambit_model || 'llama-3-70b-instruct';
    
    if (feedback) {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { message: `Ah, I see. Revising the blueprint now to address your feedback: ${feedback}` });
    } else {
        await bandState.logAgentEvent(runId, 'Gambit', 'PLANNING', { message: `Got it, boss. Reading our design guidelines right now using RAG. I'll draft the blueprint layout shortly.` });
    }
    
    // 1. Initialize LlamaIndex LLM Config
    configureLlamaIndex(modelName);

    try {
        // 2. Load Documents (RAG)
        const reader = new SimpleDirectoryReader();
        const documents = await reader.loadData({ directoryPath: path.join(__dirname, '../data') });
        
        // 3. Create Vector Index
        const index = await VectorStoreIndex.fromDocuments(documents);
        const queryEngine = index.asQueryEngine();

        // 4. Query the index
        // We instruct the LLM to output pure JSON so we can parse it easily.
        let query = `
Based on the design guidelines in the context, and the following user request:
"${prompt}"

Draft an architectural blueprint for the web application. 
Your output MUST be a valid JSON object matching this structure exactly (do not wrap in markdown tags):
{
  "framework": "HTML/Vanilla JS/Tailwind",
  "components": ["List of high level UI components required"],
  "instructions": ["Specific coding instructions or constraints for the coder based on the guidelines"]
}
`;
        if (feedback) {
            query = `
You previously drafted a blueprint for "${prompt}", but it was rejected with this feedback: "${feedback}".
Please revise the architectural blueprint to address this feedback while adhering to the design guidelines.
Your output MUST be a valid JSON object matching this structure exactly (do not wrap in markdown tags):
{
  "framework": "HTML/Vanilla JS/Tailwind",
  "components": ["List of high level UI components required"],
  "instructions": ["Specific coding instructions or constraints for the coder based on the guidelines"]
}
`;
        }
        
        const response = await queryEngine.query({ query });
        
        // Try to parse the JSON string from the response
        let jsonResponse = response.response;
        // Clean up markdown if the LLM hallucinated it
        jsonResponse = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const mockBlueprint = JSON.parse(jsonResponse);

        // 5. Update Band State
        await bandState.updateSharedContext(runId, { ...currentContext, blueprint: mockBlueprint });
        
        await bandState.logAgentEvent(runId, 'Gambit', 'BLUEPRINT_READY', { message: `Alright Kuli, the blueprint is ready and locked in. Everything is structured perfectly. Over to you for the code!` });

    } catch (error) {
        console.error("Gambit LlamaIndex Error:", error);
        await bandState.logAgentEvent(runId, 'Gambit', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

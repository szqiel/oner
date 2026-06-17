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
    
    // Retrieve the model name allocated to Gambit by The Librarian
    // Default to llama-3-70b-instruct if missing for some reason
    const modelName = currentContext?.routing?.gambit_model || 'llama-3-70b-instruct';
    
    await bandState.logAgentEvent(runId, 'Gambit', 'INFO', { message: `Drafting architectural blueprint using ${modelName} and RAG over design guidelines...` });
    
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
        const query = `
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
        
        const response = await queryEngine.query({ query });
        
        // Try to parse the JSON string from the response
        let jsonResponse = response.response;
        // Clean up markdown if the LLM hallucinated it
        jsonResponse = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const mockBlueprint = JSON.parse(jsonResponse);

        // 5. Update Band State
        await bandState.updateSharedContext(runId, { ...currentContext, blueprint: mockBlueprint });
        
        await bandState.logAgentEvent(runId, 'Gambit', 'PLAN_CREATED', { blueprint: mockBlueprint });

    } catch (error) {
        console.error("Gambit LlamaIndex Error:", error);
        await bandState.logAgentEvent(runId, 'Gambit', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

const { z } = require('zod');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { getLLM } = require('../lib/llm');
const bandState = require('../services/bandState');

/**
 * The Librarian (LangChain router)
 * Evaluates the user prompt and assigns models.
 */
async function execute(runId, prompt) {
    await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING', { message: `I'll take a look at the requirements! Routing this prompt to Gambit, Kuli, Catalyst, and Glassion now...` });
    
    // 1. Initialize the LLM
    const llm = getLLM('gpt-4o');

    // 2. Define the desired output schema using Zod
    const schema = z.object({
        gambit_model: z.string().describe("The model to assign to Gambit (The Planner)"),
        kuli_model: z.string().describe("The model to assign to Kuli (The Coder)"),
        glassion_model: z.string().describe("The model to assign to Glassion (The Visual QA)")
    });

    const parser = StructuredOutputParser.fromZodSchema(schema);
    const formatInstructions = parser.getFormatInstructions();

    // 3. Create the Prompt Template
    const promptTemplate = new PromptTemplate({
        template: `You are The Librarian, the master dispatcher of the Oner multi-agent developer swarm.
Your job is to analyze the user's prompt and assign the most efficient LLM models to the downstream agents.

Available models to choose from:
- gpt-4o (High reasoning, best for complex coding, planning, and vision QA)
- gpt-4o-mini (Fast and efficient for simple coding or routing)
- gpt-5-mini (Highly capable general-purpose model)
- gpt-5-nano (Fast and lightweight)

Analyze the following prompt and assign the models accordingly.
Prompt: {prompt}

{format_instructions}
`,
        inputVariables: ["prompt"],
        partialVariables: { format_instructions: formatInstructions }
    });

    try {
        console.log(`[Librarian] Invoking LangChain LLM for prompt: "${prompt}"`);
        // 4. Construct and invoke the chain
        const chain = promptTemplate.pipe(llm).pipe(parser);
        
        const routingData = await chain.invoke({ prompt: prompt });
        // Enforce gpt-4o for all agents to ensure provider compatibility
        routingData.gambit_model = 'gpt-4o';
        routingData.kuli_model = 'gpt-4o';
        routingData.glassion_model = 'gpt-4o';
        console.log(`[Librarian] LLM invoke completed. Data:`, JSON.stringify(routingData));

        // 5. Update Band State
        console.log(`[Librarian] Updating bandState...`);
        const currentContext = await bandState.getSharedContext(runId);
        await bandState.updateSharedContext(runId, { ...currentContext, routing: routingData });
        
        console.log(`[Librarian] Logging event...`);
        await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING_COMPLETE', { message: `All set. I've routed the tasks based on the required frameworks. Gambit, you're up next for the architectural blueprint!` });
        console.log(`[Librarian] Execution completed successfully.`);
    } catch (error) {
        console.error("Librarian LangChain Error:", error);
        await bandState.logAgentEvent(runId, 'Librarian', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

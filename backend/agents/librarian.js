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
    
    // 1. Initialize the LLM (using user-requested gpt-5-nano)
    const llm = getLLM('gpt-5-nano');

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
- gpt-4o (High reasoning, good for complex coding or planning)
- claude-3-5-sonnet (Excellent at visual/UI QA)
- llama-3-70b-instruct (Fast and efficient for straightforward planning)
- gpt-5-nano (Fast, lightweight routing/logic)

Analyze the following prompt and assign the models accordingly.
Prompt: {prompt}

{format_instructions}
`,
        inputVariables: ["prompt"],
        partialVariables: { format_instructions: formatInstructions }
    });

    try {
        // 4. Construct and invoke the chain
        const chain = promptTemplate.pipe(llm).pipe(parser);
        
        const routingData = await chain.invoke({ prompt: prompt });

        // 5. Update Band State
        const currentContext = await bandState.getSharedContext(runId);
        await bandState.updateSharedContext(runId, { ...currentContext, routing: routingData });
        
        await bandState.logAgentEvent(runId, 'The Librarian', 'ROUTING_COMPLETE', { message: `All set. I've routed the tasks based on the required frameworks. Gambit, you're up next for the architectural blueprint!` });

    } catch (error) {
        console.error("Librarian LangChain Error:", error);
        await bandState.logAgentEvent(runId, 'Librarian', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

require('dotenv').config();
const workflowRunner = require('./services/workflowRunner');

async function test() {
    console.log("Starting Oner Backend Test...");
    try {
        // 1. Initialize a run (Tests Supabase connection)
        console.log("1. Initializing run in Supabase...");
        const runId = await workflowRunner.initializeRun("Build a sleek login page");
        console.log("✅ Run initialized successfully. Run ID:", runId);

        // 2. Run the swarm (Tests LangChain and LlamaIndex orchestration)
        console.log("2. Starting swarm execution...");
        await workflowRunner.runSwarm(runId);
        
        console.log("✅ Swarm execution completed successfully.");
    } catch(e) {
        console.error("❌ Test failed:");
        console.error(e.message || e);
    }
}

test();

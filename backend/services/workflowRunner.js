const bandState = require('./bandState');
const librarian = require('../agents/librarian');
const gambit = require('../agents/gambit');
const kuli = require('../agents/kuli');
const glassion = require('../agents/glassion');

/**
 * Initializes a new run in Supabase and returns the run ID.
 */
async function initializeRun(prompt) {
    const run = await bandState.createRun(prompt);
    return run.id;
}

/**
 * Resumes a paused/escalated run with an updated state.
 */
async function resumeRun(runId, updatedState) {
    await bandState.updateSharedContext(runId, updatedState);
    await bandState.updateRunStatus(runId, 'RESUMED');
    await bandState.logAgentEvent(runId, 'System', 'HITL_RESUME', { message: 'Workflow resumed by Lead Developer.' });
}

/**
 * The core orchestration loop for Oner.
 * Sequentially invokes agents based on the Codeband graph logic.
 */
async function runSwarm(runId) {
    try {
        let currentStatus = 'STARTING';
        await bandState.updateRunStatus(runId, currentStatus);

        const sharedContext = await bandState.getSharedContext(runId);
        
        // Ensure failure count exists for HitL tracking
        if (sharedContext.kuli_failures === undefined) {
            sharedContext.kuli_failures = 0;
            await bandState.updateSharedContext(runId, sharedContext);
        }

        // 1. The Librarian (LangChain Routing)
        await bandState.updateRunStatus(runId, 'ROUTING');
        // We simulate fetching the original prompt from the DB here:
        await librarian.execute(runId, 'Execute Prompt');

        // 2. Gambit (LlamaIndex Planning)
        await bandState.updateRunStatus(runId, 'PLANNING');
        await gambit.execute(runId, 'Execute Prompt');
        
        await bandState.updateRunStatus(runId, 'PLAN_LOCKED');

        // 3. Kuli (AutoGen/CrewAI Coding) & Glassion (Native QA)
        // Note: For hackathon MVP we do a straight pass. In reality this loops.
        await bandState.updateRunStatus(runId, 'ASSEMBLING');
        
        try {
            await kuli.execute(runId);
            // Reset failures on success
            const contextAfterKuli = await bandState.getSharedContext(runId);
            contextAfterKuli.kuli_failures = 0;
            await bandState.updateSharedContext(runId, contextAfterKuli);
        } catch (error) {
            const context = await bandState.getSharedContext(runId);
            context.kuli_failures += 1;
            await bandState.updateSharedContext(runId, context);

            if (context.kuli_failures >= 2) {
                // HitL Escalation Protocol
                await bandState.updateRunStatus(runId, 'ESCALATED');
                await bandState.logAgentEvent(runId, 'System', 'ESCALATION', { 
                    message: 'Kuli failed 2 consecutive times. Escalating to Human-in-the-Loop.' 
                });
                return; // Halt workflow
            } else {
                throw error; // Re-throw to be caught by the outer catch (or we could loop here)
            }
        }

        // 4. Glassion Visual QA
        await bandState.updateRunStatus(runId, 'VISUAL_QA');
        await glassion.execute(runId);

        // Workflow Complete
        await bandState.updateRunStatus(runId, 'COMPLETED');
        await bandState.logAgentEvent(runId, 'System', 'WORKFLOW_COMPLETE', { message: 'Swarm execution finished successfully.' });

    } catch (error) {
        console.error(`Swarm error on run ${runId}:`, error);
        await bandState.updateRunStatus(runId, 'FAILED');
        await bandState.logAgentEvent(runId, 'System', 'FATAL_ERROR', { error: error.message });
    }
}

module.exports = {
    initializeRun,
    resumeRun,
    runSwarm
};

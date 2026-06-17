const bandState = require('./bandState');
const librarian = require('../agents/librarian');
const gambit = require('../agents/gambit');
const kuli = require('../agents/kuli');
const catalyst = require('../agents/catalyst');
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

        // 3. Kuli (Coder) & Catalyst (QA) Feedback Loop
        const MAX_QA_LOOPS = 2;
        let qaPassed = false;
        let qaLoopCount = 0;

        while (!qaPassed && qaLoopCount <= MAX_QA_LOOPS) {
            await bandState.updateRunStatus(runId, 'ASSEMBLING');
            try {
                // Pass "Execute Prompt" assuming workflowRunner gets the real prompt elsewhere, 
                // but actually Kuli reads the blueprint from state.
                await kuli.execute(runId, 'Execute Prompt');
                
                const contextAfterKuli = await bandState.getSharedContext(runId);
                contextAfterKuli.kuli_failures = 0;
                await bandState.updateSharedContext(runId, contextAfterKuli);

                // Run Catalyst QA
                await bandState.updateRunStatus(runId, 'CODE_REVIEW');
                const reviewData = await catalyst.execute(runId);

                if (reviewData.passed) {
                    qaPassed = true;
                } else {
                    qaLoopCount++;
                    if (qaLoopCount <= MAX_QA_LOOPS) {
                        await bandState.logAgentEvent(runId, 'System', 'INFO', { message: `Catalyst rejected code. Looping back to Kuli (Attempt ${qaLoopCount}/${MAX_QA_LOOPS})...` });
                    }
                }

            } catch (error) {
                const context = await bandState.getSharedContext(runId);
                context.kuli_failures = (context.kuli_failures || 0) + 1;
                await bandState.updateSharedContext(runId, context);

                if (context.kuli_failures >= 2) {
                    await bandState.updateRunStatus(runId, 'ESCALATED');
                    await bandState.logAgentEvent(runId, 'System', 'ESCALATION', { 
                        message: 'Kuli failed 2 consecutive times. Escalating to Human-in-the-Loop.' 
                    });
                    return; // Halt workflow
                } else {
                    // Try again in the loop? Actually, let's just break out and fail if it's a fatal spawn error, 
                    // but for HitL we want to wait. Wait, if kuli_failures < 2, we just loop again.
                    await bandState.logAgentEvent(runId, 'System', 'WARNING', { message: 'Kuli crashed. Retrying...' });
                }
            }
        }

        if (!qaPassed) {
            await bandState.updateRunStatus(runId, 'ESCALATED');
            await bandState.logAgentEvent(runId, 'System', 'ESCALATION', { message: 'Catalyst QA failed after max retries. Escalating to Human-in-the-Loop.' });
            return;
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

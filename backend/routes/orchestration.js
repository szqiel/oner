const express = require('express');
const router = express.Router();
const workflowRunner = require('../services/workflowRunner');

/**
 * POST /api/start
 * Fire-and-forget endpoint to trigger a new multi-agent Codeband workflow.
 * Expected body: { prompt: "Create a glassmorphic login page" }
 */
router.post('/start', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Initialize the run (this returns quickly)
        const runId = await workflowRunner.initializeRun(prompt);
        
        // Asynchronously start the swarm without awaiting its completion
        workflowRunner.runSwarm(runId).catch(err => {
            console.error(`Swarm run ${runId} failed:`, err);
        });

        // Immediately return the runId to the frontend so it can subscribe to Supabase
        return res.status(202).json({ 
            message: 'Codeband Swarm initialized', 
            runId: runId 
        });
    } catch (error) {
        console.error('Failed to start run:', error);
        return res.status(500).json({ error: 'Failed to start Codeband orchestration' });
    }
});

/**
 * POST /api/resume
 * Endpoint to resume a halted Codeband workflow after a Human-in-the-Loop (HitL) intervention.
 * Expected body: { runId: "uuid", updatedState: { ... } }
 */
router.post('/resume', async (req, res) => {
    const { runId, updatedState } = req.body;

    if (!runId || !updatedState) {
        return res.status(400).json({ error: 'runId and updatedState are required' });
    }

    try {
        // Update the state in Supabase and resume the workflow
        await workflowRunner.resumeRun(runId, updatedState);

        return res.status(202).json({ message: 'Codeband Swarm resumed', runId });
    } catch (error) {
        console.error('Failed to resume run:', error);
        return res.status(500).json({ error: 'Failed to resume Codeband orchestration' });
    }
});

module.exports = router;

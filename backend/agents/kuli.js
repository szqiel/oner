const path = require('path');
const { spawn } = require('child_process');
const bandState = require('../services/bandState');

/**
 * Kuli (AutoGen/CrewAI - Python Bridge)
 * The Coder. Generates raw HTML/Tailwind payload.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    
    // Retrieve model name assigned to Kuli by The Librarian
    const modelName = currentContext?.routing?.kuli_model || 'gpt-4o';
    const blueprint = currentContext?.blueprint;

    if (!blueprint) {
        throw new Error("Missing architectural blueprint from Gambit.");
    }

    await bandState.logAgentEvent(runId, 'Kuli', 'INFO', { message: `Initializing AutoGen using ${modelName} to generate code based on blueprint...` });

    const apiKey = process.env.BLUESMINDS_API_KEY || '';
    const baseUrl = process.env.BLUESMINDS_API_BASE_URL || 'https://api.bluesminds.com/v1';

    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../python/kuli_agent.py'),
            prompt,
            JSON.stringify(blueprint),
            modelName,
            apiKey,
            baseUrl
        ]);

        let payload = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            payload += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error("Python Error Output:", errorOutput);
                const errorMsg = `Kuli AutoGen process failed with exit code ${code}. Error: ${errorOutput}`;
                await bandState.logAgentEvent(runId, 'Kuli', 'ERROR', { error: errorMsg });
                return reject(new Error(errorMsg));
            }

            // Successfully got the payload
            payload = payload.trim();
            // Clean up any stray markdown formatting the model might have returned despite instructions
            payload = payload.replace(/```html/g, '').replace(/```/g, '').trim();

            await bandState.updateSharedContext(runId, { ...currentContext, html: payload });
            await bandState.logAgentEvent(runId, 'Kuli', 'CODE_GENERATED', { length: payload.length });
            
            resolve();
        });
    });
}

module.exports = { execute };

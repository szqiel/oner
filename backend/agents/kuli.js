const { spawn } = require('child_process');
const path = require('path');
const bandState = require('../services/bandState');

/**
 * Kuli (AutoGen/CrewAI - Python integration)
 * End-to-end coder. Spawned as a child process.
 */
async function execute(runId) {
    await bandState.logAgentEvent(runId, 'Kuli', 'INFO', { message: 'Initializing Python AutoGen swarm...' });
    
    const context = await bandState.getSharedContext(runId);
    
    return new Promise((resolve, reject) => {
        // Mock Python script execution
        // In reality, this would point to a python script: path.join(__dirname, '../python/kuli.py')
        const pythonProcess = spawn('node', ['-e', `console.log(JSON.stringify({ code: '<h1>Hello World</h1>' }))`]);

        let outputData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            bandState.logAgentEvent(runId, 'Kuli', 'ERROR', { error: data.toString() }).catch(console.error);
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                return reject(new Error(`Kuli exited with code ${code}`));
            }
            try {
                const result = JSON.parse(outputData);
                const currentContext = await bandState.getSharedContext(runId);
                await bandState.updateSharedContext(runId, { ...currentContext, code: result.code });
                await bandState.logAgentEvent(runId, 'Kuli', 'CODE_COMPLETE', { message: 'Code generation complete.' });
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = { execute };

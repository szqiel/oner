const bandState = require('./bandState');
const { BandClient } = require('./bandApi');
const librarian = require('../agents/librarian');
const gambit = require('../agents/gambit');
const crucible = require('../agents/crucible');
const kuli = require('../agents/kuli');
const catalyst = require('../agents/catalyst');
const glassion = require('../agents/glassion');

const clients = {};
const roomRuns = new Map();
const processingMessages = new Set();
let clientsPromise = null;

const agentDefinitions = [
    ['librarian', 'Librarian'],
    ['gambit', 'Gambit'],
    ['crucible', 'Crucible'],
    ['kuli', 'Kuli'],
    ['catalyst', 'Catalyst'],
    ['glassion', 'Glassion']
];

function credentialName(key, suffix) {
    return `BAND_${key.toUpperCase()}_${suffix}`;
}

function buildEnvelope(runId, stage, instruction, context = {}) {
    return `${instruction}
[RunID: ${runId}]
[ONER_CONTEXT]${JSON.stringify({ runId, stage, ...context })}`;
}

function parseRunId(message, roomId) {
    const content = String(message.content || message.text || '');
    const match = content.match(/\[RunID:\s*([0-9a-f-]{36})\]/i);
    return match?.[1] || roomRuns.get(String(roomId)) || null;
}

function isAgentMentioned(message, agent) {
    const mentions = message.mentions || [];
    return mentions.some((mention) => {
        const id = mention.id || mention.agent_id || mention.agent?.id;
        return String(id) === String(agent.agentId);
    }) || String(message.content || '').toLowerCase().includes(`@${agent.agentName.toLowerCase()}`);
}

async function sendHandoff(senderKey, targetKey, roomId, runId, stage, instruction, context = {}) {
    const sender = clients[senderKey];
    const target = clients[targetKey];
    if (!sender || !target) throw new Error(`Band handoff ${senderKey} -> ${targetKey} is unavailable.`);
    const content = buildEnvelope(runId, stage, `@${target.agentName} ${instruction}`, context);
    await sender.sendMessage(roomId, content, [{ id: target.agentId }]);
}

async function initializeBandClients() {
    if (clientsPromise) return clientsPromise;

    clientsPromise = (async () => {
        for (const [key, name] of agentDefinitions) {
            const id = process.env[credentialName(key, 'AGENT_ID')];
            const apiKey = process.env[credentialName(key, 'API_KEY')];
            if (!id || !apiKey) throw new Error(`Missing Band credentials for ${name}.`);
            clients[key] = new BandClient(id, apiKey, name);
        }

        for (const [key] of agentDefinitions) {
            if (key === 'librarian') continue;
            const agent = clients[key];
            agent.onMessage(async ({ message, room_id: roomId }) => {
                if (!isAgentMentioned(message, agent)) return;
                const messageId = message.id || `${roomId}:${message.content}`;
                if (processingMessages.has(messageId)) return;
                processingMessages.add(messageId);

                try {
                    const runId = parseRunId(message, roomId);
                    if (!runId) throw new Error('Band handoff did not contain a run ID.');
                    roomRuns.set(String(roomId), runId);
                    if (message.id) await agent.markProcessing(roomId, message.id);
                    await executeAgentLogic(key, runId, roomId);
                    if (message.id) await agent.markProcessed(roomId, message.id);
                } catch (error) {
                    console.error(`[BandOrchestrator] ${agent.agentName} failed`, error);
                    const runId = parseRunId(message, roomId);
                    if (runId) {
                        await bandState.updateRunStatus(runId, 'FAILED').catch(() => {});
                        await bandState.logAgentEvent(runId, agent.agentName, 'ERROR', { message: error.message }).catch(() => {});
                    }
                    await agent.sendEvent(roomId, 'error', error.message).catch(() => {});
                } finally {
                    processingMessages.delete(messageId);
                }
            });
        }

        await Promise.all(Object.values(clients).map((client) => client.connect()));
    })();

    return clientsPromise;
}

async function executeAgentLogic(agentKey, runId, roomId) {
    const context = await bandState.getSharedContext(runId);
    const prompt = context.prompt;

    if (agentKey === 'gambit') {
        await bandState.updateRunStatus(runId, 'PLANNING');
        await gambit.execute(runId, prompt);
        await sendHandoff('gambit', 'crucible', roomId, runId, 'PLAN_REVIEW', 'Review the blueprint artifact.', { artifact: 'blueprint' });
        return;
    }

    if (agentKey === 'crucible') {
        const review = await crucible.execute(runId, prompt);
        if (review.approved) {
            await bandState.updateRunStatus(runId, 'PLAN_LOCKED');
            await sendHandoff('crucible', 'kuli', roomId, runId, 'IMPLEMENTATION', 'The plan is approved. Build the complete interface.', { artifact: 'blueprint' });
        } else {
            const next = await bandState.mergeSharedContext(runId, { plan_attempts: (context.plan_attempts || 0) + 1 });
            if (next.plan_attempts >= 3) {
                await escalate(runId, 'The planning loop failed three reviews.');
            } else {
                await sendHandoff('crucible', 'gambit', roomId, runId, 'PLAN_REVISION', 'Revise the blueprint using Crucible feedback.', { feedback: review.feedback });
            }
        }
        return;
    }

    if (agentKey === 'kuli') {
        await bandState.updateRunStatus(runId, 'ASSEMBLING');
        await kuli.execute(runId, prompt);
        await sendHandoff('kuli', 'catalyst', roomId, runId, 'CODE_REVIEW', 'Review the generated HTML artifact.', { artifact: 'html' });
        return;
    }

    if (agentKey === 'catalyst') {
        await bandState.updateRunStatus(runId, 'CODE_REVIEW');
        const review = await catalyst.execute(runId);
        if (review.passed) {
            await sendHandoff('catalyst', 'glassion', roomId, runId, 'VISUAL_QA', 'Render and visually inspect the generated interface.', { artifact: 'html' });
        } else {
            const next = await bandState.mergeSharedContext(runId, { code_attempts: (context.code_attempts || 0) + 1 });
            if (next.code_attempts >= 2) {
                await bandState.logAgentEvent(runId, 'Catalyst', 'FORCE_PASS', { 
                    message: 'Kuli failed two consecutive code reviews. Bypassing Catalyst and proceeding to Glassion visual review.' 
                });
                await sendHandoff('catalyst', 'glassion', roomId, runId, 'VISUAL_QA', 'Render and visually inspect the generated interface.', { artifact: 'html' });
            } else {
                await sendHandoff('catalyst', 'kuli', roomId, runId, 'CODE_REVISION', 'Fix the QA findings and regenerate the interface.', { feedback: review.feedback });
            }
        }
        return;
    }

    if (agentKey === 'glassion') {
        await bandState.updateRunStatus(runId, 'VISUAL_QA');
        const review = await glassion.execute(runId);
        if (review.passed) {
            await bandState.updateRunStatus(runId, 'COMPLETED');
            await bandState.logAgentEvent(runId, 'Band Orchestrator', 'WORKFLOW_COMPLETE', { message: 'The cross-framework swarm completed the build.' });
        } else {
            const next = await bandState.mergeSharedContext(runId, { visual_attempts: (context.visual_attempts || 0) + 1 });
            if (next.visual_attempts >= 2) {
                await escalate(runId, 'The interface failed two consecutive visual reviews.');
            } else {
                await sendHandoff('glassion', 'kuli', roomId, runId, 'VISUAL_REVISION', 'Apply the visual review and regenerate the interface.', { feedback: review.feedback });
            }
        }
    }
}

async function escalate(runId, reason) {
    await bandState.updateRunStatus(runId, 'ESCALATED');
    await bandState.logAgentEvent(runId, 'Band Orchestrator', 'ESCALATION', { message: `${reason} Human intervention is required.` });
}

async function initializeRun(prompt) {
    const run = await bandState.createRun(prompt);
    return run.id;
}

async function createOrJoinRoom(runId) {
    const configuredRoomId = process.env.BAND_ROOM_ID;
    if (configuredRoomId) {
        await Promise.all(Object.values(clients).map((client) => client.joinChannel(`chat_room:${configuredRoomId}`)));
        roomRuns.set(String(configuredRoomId), runId);
        return configuredRoomId;
    }

    const response = await clients.librarian.createRoom(runId);
    const roomId = response?.data?.id || response?.chat?.id || response?.id;
    if (!roomId) throw new Error(`Band did not return a chat room ID: ${JSON.stringify(response)}`);

    for (const [key] of agentDefinitions) {
        if (key !== 'librarian') await clients.librarian.addParticipant(roomId, clients[key].agentId);
    }
    await Promise.all(Object.values(clients).map((client) => client.joinChannel(`chat_room:${roomId}`)));
    roomRuns.set(String(roomId), runId);
    return roomId;
}

async function runSwarm(runId) {
    try {
        await bandState.updateRunStatus(runId, 'STARTING');
        const context = await bandState.getSharedContext(runId);
        const prompt = context.prompt;

        if (process.env.BAND_MOCK_MODE === 'true') {
            return runMockSwarm(runId);
        }

        await initializeBandClients();
        const roomId = await createOrJoinRoom(runId);
        await bandState.mergeSharedContext(runId, { band_room_id: roomId });
        await bandState.updateRunStatus(runId, 'ROUTING');
        await librarian.execute(runId, prompt);
        await sendHandoff('librarian', 'gambit', roomId, runId, 'PLANNING', 'Create an implementation blueprint for the user request.', { prompt });
    } catch (error) {
        console.error(`[BandOrchestrator] run ${runId} failed`, error);
        await bandState.updateRunStatus(runId, 'FAILED').catch(() => {});
        await bandState.logAgentEvent(runId, 'Band Orchestrator', 'FATAL_ERROR', { message: error.message }).catch(() => {});
        throw error;
    }
}

async function resumeRun(runId, updatedState) {
    const next = await bandState.mergeSharedContext(runId, {
        ...updatedState,
        review: null,
        ux_review: null,
        code_attempts: 0,
        visual_attempts: 0
    });
    await bandState.updateRunStatus(runId, 'RESUMED');
    await bandState.logAgentEvent(runId, 'Lead Developer', 'HITL_RESUME', { message: updatedState.human_feedback || 'Human intervention supplied.' });

    if (process.env.BAND_MOCK_MODE !== 'true') {
        await initializeBandClients();
    }

    const roomId = next.band_room_id || process.env.BAND_ROOM_ID;
    if (roomId && clients.kuli) {
        await sendHandoff('librarian', 'kuli', roomId, runId, 'HITL_RESUME', 'Resume the build using the human intervention.', { feedback: updatedState.human_feedback });
    } else {
        await runMockFromKuli(runId);
    }
}

async function runMockFromKuli(runId) {
    const context = await bandState.getSharedContext(runId);
    await bandState.updateRunStatus(runId, 'ASSEMBLING');
    await kuli.execute(runId, context.prompt);
    await new Promise(r => setTimeout(r, 3000));
    
    const codeReview = await catalyst.execute(runId);
    await new Promise(r => setTimeout(r, 3000));
    if (!codeReview.passed) {
        await bandState.logAgentEvent(runId, 'Catalyst', 'FORCE_PASS', { 
            message: 'Resumed build failed code review. Bypassing Catalyst and proceeding to Glassion visual review.' 
        });
    }
    
    const visualReview = await glassion.execute(runId);
    await new Promise(r => setTimeout(r, 3000));
    if (!visualReview.passed) return escalate(runId, 'The resumed build failed visual review.');
    
    await bandState.updateRunStatus(runId, 'COMPLETED');
}

async function runMockSwarm(runId) {
    const context = await bandState.getSharedContext(runId);
    const prompt = context.prompt;
    await librarian.execute(runId, prompt);
    await new Promise(r => setTimeout(r, 3000));

    for (let attempt = 0; attempt < 3; attempt += 1) {
        await bandState.updateRunStatus(runId, 'PLANNING');
        await gambit.execute(runId, prompt);
        await new Promise(r => setTimeout(r, 3000));
        
        const planReview = await crucible.execute(runId, prompt);
        await new Promise(r => setTimeout(r, 3000));
        if (planReview.approved) break;
        if (attempt === 2) return escalate(runId, 'The planning loop failed three reviews.');
    }

    await bandState.updateRunStatus(runId, 'PLAN_LOCKED');
    for (let attempt = 0; attempt < 2; attempt += 1) {
        await kuli.execute(runId, prompt);
        await new Promise(r => setTimeout(r, 3000));
        
        const codeReview = await catalyst.execute(runId);
        await new Promise(r => setTimeout(r, 3000));
        if (codeReview.passed) break;
        if (attempt === 1) {
            await bandState.logAgentEvent(runId, 'Catalyst', 'FORCE_PASS', { 
                message: 'Kuli failed two consecutive code reviews. Bypassing Catalyst and proceeding to Glassion visual review.' 
            });
        }
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const visualReview = await glassion.execute(runId);
        await new Promise(r => setTimeout(r, 3000));
        if (visualReview.passed) {
            await bandState.updateRunStatus(runId, 'COMPLETED');
            return;
        }
        if (attempt === 1) return escalate(runId, 'The interface failed two consecutive visual reviews.');
        await kuli.execute(runId, prompt);
        await new Promise(r => setTimeout(r, 3000));
    }
}

module.exports = { 
    initializeRun, 
    resumeRun, 
    runSwarm, 
    runMockSwarm, 
    parseRunId, 
    isAgentMentioned, 
    buildEnvelope, 
    initializeBandClients, 
    clients 
};

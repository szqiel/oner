const test = require('node:test');
const assert = require('node:assert');
const { normalizeBaseUrl } = require('../lib/provider');
const { parseRunId, isAgentMentioned, buildEnvelope } = require('../services/workflowRunner');

test('Provider - normalizeBaseUrl', (t) => {
    assert.strictEqual(normalizeBaseUrl('https://api.bluesminds.com/'), 'https://api.bluesminds.com/v1');
    assert.strictEqual(normalizeBaseUrl('https://api.bluesminds.com'), 'https://api.bluesminds.com/v1');
    assert.strictEqual(normalizeBaseUrl('https://api.bluesminds.com/v1'), 'https://api.bluesminds.com/v1');
    assert.strictEqual(normalizeBaseUrl('https://api.bluesminds.com/v1/'), 'https://api.bluesminds.com/v1');
});

test('Orchestrator - buildEnvelope', (t) => {
    const runId = 'e2c349e5-9ba4-4c24-b4b3-9fb1e48bec3f';
    const stage = 'PLANNING';
    const instruction = 'Create a login page';
    const context = { key: 'value' };

    const envelope = buildEnvelope(runId, stage, instruction, context);

    assert.match(envelope, /\[RunID:\s*e2c349e5-9ba4-4c24-b4b3-9fb1e48bec3f\]/);
    assert.match(envelope, /\[ONER_CONTEXT\]/);
    
    const contextJsonStr = envelope.substring(envelope.indexOf('[ONER_CONTEXT]') + 14);
    const parsedContext = JSON.parse(contextJsonStr);
    assert.strictEqual(parsedContext.runId, runId);
    assert.strictEqual(parsedContext.stage, stage);
    assert.strictEqual(parsedContext.key, 'value');
});

test('Orchestrator - parseRunId', (t) => {
    const runId = 'e2c349e5-9ba4-4c24-b4b3-9fb1e48bec3f';
    
    // 1. Parse from message content envelope
    const msgWithRunId = {
        content: `Hi @Kuli! Make it glassmorphic.\n[RunID: ${runId}]\n[ONER_CONTEXT]{}`
    };
    const parsed1 = parseRunId(msgWithRunId, 'room123');
    assert.strictEqual(parsed1, runId);

    // 2. Parse from roomRuns fallback
    const msgWithoutEnvelope = {
        content: 'Simple message without envelope'
    };
    const parsed2 = parseRunId(msgWithoutEnvelope, 'room123');
    assert.strictEqual(parsed2, null);
});

test('Orchestrator - isAgentMentioned', (t) => {
    const agent = {
        agentId: 'agent-uuid-123',
        agentName: 'Gambit'
    };

    // 1. Mentioned via mentions array
    const msg1 = {
        mentions: [{ id: 'agent-uuid-123' }],
        content: 'please review this'
    };
    assert.strictEqual(isAgentMentioned(msg1, agent), true);

    // 2. Mentioned via text content name (case insensitive)
    const msg2 = {
        content: 'Hi @gambit, please planning'
    };
    assert.strictEqual(isAgentMentioned(msg2, agent), true);

    // 3. Not mentioned
    const msg3 = {
        mentions: [{ id: 'different-agent' }],
        content: 'Hi @Kuli'
    };
    assert.strictEqual(isAgentMentioned(msg3, agent), false);
});

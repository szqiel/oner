const bandState = require('../services/bandState');
const { configureLlamaIndex } = require('../lib/llamaIndexLLM');
const { formatBlueprint } = require('../lib/llm');

async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    const modelName = currentContext?.routing?.kuli_model || 'gpt-4o';
    const blueprint = currentContext?.blueprint;

    if (!blueprint) {
        throw new Error('Kuli cannot build without Gambit’s blueprint.');
    }

    const feedback = currentContext?.review?.passed === false
        ? currentContext.review.feedback
        : currentContext?.ux_review?.passed === false
            ? currentContext.ux_review.feedback
            : '';

    await bandState.logAgentEvent(runId, 'Kuli', 'IMPLEMENTING', {
        message: `I’m implementing the locked blueprint with LlamaIndex${feedback ? ' and applying the latest review' : ''}.`
    });

    const llm = configureLlamaIndex(modelName);
    let response;
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            response = await llm.complete({
                prompt: `You are Kuli, the implementation agent in a multi-agent web development swarm.
Generate one complete, production-quality index.html document using HTML, Tailwind CSS via CDN, and Vanilla JavaScript.
Return raw HTML only. Do not use Markdown fences or explanations.
The page must be responsive, accessible, and visually polished.

User request:
${prompt}

Locked blueprint:
${formatBlueprint(blueprint)}

Review feedback to apply:
${feedback || 'None'}`
            });
            break;
        } catch (err) {
            console.warn(`[Kuli Attempt ${attempt}] failed: ${err.message}`);
            if (attempt === maxRetries) throw err;
            await new Promise(res => setTimeout(res, 5000 * attempt));
        }
    }

    const rawHtml = String(response.text || response.message?.content || response).trim();
    console.log('[Kuli] Raw response length:', rawHtml.length);

    let html = rawHtml
        .replace(/```html/gi, '')
        .replace(/```/g, '')
        .trim();

    // Auto-wrap with html tags if missing to prevent validation failure
    if (!/<html[\s>]/i.test(html)) {
        console.log('[Kuli] Auto-wrapping output with <html> tags');
        html = `<!DOCTYPE html>\n<html>\n${html}\n</html>`;
    }

    if (!/<\/html>/i.test(html)) {
        html = `${html}\n</html>`;
    }

    await bandState.updateSharedContext(runId, { ...currentContext, html });
    await bandState.logAgentEvent(runId, 'Kuli', 'CODE_GENERATED', {
        message: 'The complete HTML artifact is ready. Catalyst, please review it.'
    });
}

module.exports = { execute };

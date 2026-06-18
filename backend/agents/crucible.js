const bandState = require('../services/bandState');

/**
 * Crucible (Native Node.js Plan Reviewer)
 * Audits Gambit's blueprint using native `fetch` to ensure it meets requirements.
 */
async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    const blueprint = currentContext?.blueprint;
    const modelName = currentContext?.routing?.crucible_model || 'gpt-4o';

    if (!blueprint) {
        throw new Error("Crucible cannot review: No blueprint found in context.");
    }

    await bandState.logAgentEvent(runId, 'Crucible', 'INFO', { message: `Let me take a look at Gambit's drafted blueprint using ${modelName}...` });

    const apiKey = process.env.BLUESMINDS_API_KEY || '';
    const baseUrl = process.env.BLUESMINDS_API_BASE_URL || 'https://api.bluesminds.com/v1';

    const payload = {
        model: modelName,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `You are Crucible, the elite Architectural Plan Reviewer. 
Your job is to review the JSON blueprint drafted by Gambit for the requested application.
Ensure it contains all necessary components, logical structures, and follows modern SPA constraints.
Output strictly a JSON object with two keys: \`approved\` (boolean) and \`feedback\` (string detailing any missing components or structural flaws. If approved, just say 'LGTM').`
            },
            {
                role: "user",
                content: `Original Prompt: ${prompt}\n\nDrafted Blueprint:\n${JSON.stringify(blueprint, null, 2)}`
            }
        ],
        temperature: 0.1
    };

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Crucible API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        let reviewData;
        try {
            reviewData = JSON.parse(content);
        } catch (e) {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            reviewData = JSON.parse(clean);
        }

        await bandState.updateSharedContext(runId, { ...currentContext, plan_review: reviewData });

        if (reviewData.approved) {
            await bandState.logAgentEvent(runId, 'Crucible', 'PLAN_APPROVED', { message: `The blueprint is rock solid. I'm locking the plan in!` });
            return reviewData;
        } else {
            await bandState.logAgentEvent(runId, 'Crucible', 'PLAN_REJECTED', { message: `Gambit, you missed some things: ${reviewData.feedback}. Please revise the blueprint.` });
            return reviewData;
        }

    } catch (error) {
        console.error("Crucible API Error:", error);
        await bandState.logAgentEvent(runId, 'Crucible', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

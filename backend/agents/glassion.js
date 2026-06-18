const { chromium } = require('playwright');
const bandState = require('../services/bandState');
const { getProviderConfig } = require('../lib/provider');

/**
 * Glassion (Native Multimodal UI/UX Reviewer)
 * Takes a screenshot of the generated code and uses native `fetch` to call a Vision API.
 */
async function execute(runId) {
    const currentContext = await bandState.getSharedContext(runId);
    const htmlCode = currentContext?.html;
    const modelName = currentContext?.routing?.glassion_model || 'gpt-4o';

    if (!htmlCode) {
        throw new Error("Glassion cannot review: No HTML code found in context.");
    }

    await bandState.logAgentEvent(runId, 'Glassion', 'INFO', { message: `My turn! Taking a screenshot of Kuli's code now to review its aesthetic execution...` });

    // 1. Capture Screenshot with Playwright
    let browser;
    let base64Screenshot = '';
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlCode, { waitUntil: 'networkidle' });
        // Take a full page screenshot encoded in base64
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        base64Screenshot = screenshotBuffer.toString('base64');
    } catch (err) {
        console.error("Playwright Error:", err);
        throw new Error("Failed to render HTML with Playwright.");
    } finally {
        if (browser) await browser.close();
    }

    // 2. Native fetch to Vision API
    await bandState.logAgentEvent(runId, 'Glassion', 'INFO', { message: `Got the screenshot. Checking if the glassmorphism and padding match modern standards...` });
    
    const provider = getProviderConfig();

    const payload = {
        model: modelName,
        messages: [
            {
                role: "system",
                content: "You are Glassion, the elite Multimodal UI/UX Reviewer. Review the provided screenshot. Does it follow high-end aesthetic standards (glassmorphism, good padding, clear contrast)? Output strictly a JSON object with two keys: `passed` (boolean) and `feedback` (string describing any aesthetic flaws or 'LGTM')."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Please review this UI rendering." },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${base64Screenshot}` } }
                ]
            }
        ],
        temperature: 0.1
    };

    try {
        let response;
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                response = await fetch(`${provider.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey}`
                    },
                    body: JSON.stringify(payload)
                });
                if (response.ok) break;
                const errText = await response.text();
                console.warn(`[Glassion Attempt ${attempt}] failed: ${response.status} - ${errText}`);
                if (attempt === maxRetries) {
                    throw new Error(`Vision API error: ${response.status} - ${errText}`);
                }
            } catch (err) {
                if (attempt === maxRetries) throw err;
                console.warn(`[Glassion Attempt ${attempt}] error: ${err.message}`);
            }
            await new Promise(res => setTimeout(res, 3000 * attempt));
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        let reviewData;
        try {
            reviewData = JSON.parse(content);
        } catch (e) {
            // Fallback parsing if LLM hallucinated markdown block
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            reviewData = JSON.parse(clean);
        }

        await bandState.updateSharedContext(runId, { ...currentContext, ux_review: reviewData });

        if (reviewData.passed) {
            await bandState.logAgentEvent(runId, 'Glassion', 'UX_APPROVED', { message: `Aesthetics are flawless! Clean glassmorphism and perfect contrast. Outstanding work, everyone!` });
            return reviewData;
        } else {
            await bandState.logAgentEvent(runId, 'Glassion', 'UX_FAILED', { message: `I found visual issues: ${reviewData.feedback}. Kuli, please revise the interface.` });
            return reviewData;
        }

    } catch (error) {
        console.error("Glassion Vision API Error:", error);
        await bandState.logAgentEvent(runId, 'Glassion', 'ERROR', { error: error.message });
        throw error;
    }
}

module.exports = { execute };

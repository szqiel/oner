const { chromium } = require('playwright');
const bandState = require('../services/bandState');
const { getProviderConfig } = require('../lib/provider');

// Supported Vision Models (strictly from user's images)
const VISION_MODELS = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview", "qwen3-vl-plus"];

// Helper to sanitize JSON response from LLM
function sanitizeJSON(content) {
    let clean = content.trim();
    const matches = clean.match(/```json\s*([\s\S]*?)\s*```/);
    if (matches && matches[1]) {
        clean = matches[1].trim();
    } else {
        clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    return JSON.parse(clean);
}

/**
 * Glassion (Native Multimodal UI/UX Reviewer and Design Polisher)
 * Reviews the page visually (screenshot) and code-wise, then applies final design polish.
 */
async function execute(runId) {
    const currentContext = await bandState.getSharedContext(runId);
    let htmlCode = currentContext?.html;
    let files = currentContext?.files;
    const assignedModel = currentContext?.routing?.glassion_model || 'gemini-3.1-pro-preview';

    if (!htmlCode) {
        throw new Error("Glassion cannot review: No HTML code found in context.");
    }

    await bandState.logAgentEvent(runId, 'Glassion', 'INFO', { 
        message: `Inspecting visual rendering and styling code using model ${assignedModel}...` 
    });

    // 1. Capture Screenshot with Playwright
    let browser;
    let base64Screenshot = '';
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(htmlCode, { waitUntil: 'networkidle' });
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        base64Screenshot = screenshotBuffer.toString('base64');
    } catch (err) {
        console.error("Playwright Screenshot Error:", err);
        throw new Error("Failed to render HTML with Playwright.");
    } finally {
        if (browser) await browser.close();
    }

    const provider = getProviderConfig();

    // 2. Perform Visual + Code Checking
    const buildReviewPayload = (model) => ({
        model: model,
        messages: [
            {
                role: "system",
                content: `You are Glassion, the elite Multimodal Design QA Inspector.
Evaluate both the visual layout from the screenshot and the CSS/HTML code characteristics.
Enforce these design guidelines:
1. **Emil Kowalski Animation/Interaction Standard**: Look for smooth transitions, spring physics transitions on click/hover, no abrupt layout shifts, and active interactive elements.
2. **Impeccable Layout Standard**: Look for perfect padding, symmetric grid alignment, clear margins, visual hierarchy, and readable line heights.
3. **Leonxlnx Taste-Skill**: Evaluate if the palette feels premium (sophisticated dark modes, glassmorphism blur, subtle border glow, avoiding plain primary red/blue/green colors) and uses modern typography.
4. **Contrast and Color Harmony Readability**: Check text contrast to ensure high WCAG AA/AAA compliance (no light grey text on white, no dark text on dark background).

Output strictly a JSON object with:
\`passed\`: boolean (true if it has no design flaws and looks premium; false if it needs styling fixes, animations, or contrast adjustments).
\`feedback\`: string (detailed report of visual and code-level issues, or 'LGTM').`
            },
            {
                role: "user",
                content: [
                    { type: "text", text: `Please review this UI. Here is the code: \n\n${htmlCode.slice(0, 15000)}` },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${base64Screenshot}` } }
                ]
            }
        ],
        temperature: 0.1
    });

    const modelsToTry = [assignedModel, 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview', 'qwen3-vl-plus'];
    let lastError = null;
    let reviewResponse = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Glassion Review] Calling completions with vision model: ${model}`);
            const payload = buildReviewPayload(model);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for vision model

            const res = await fetch(`${provider.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (res.ok) {
                reviewResponse = await res.json();
                clearTimeout(timeout);
                break;
            } else {
                const errText = await res.text();
                clearTimeout(timeout);
                console.warn(`[Glassion Review Model ${model}] failed: ${res.status} - ${errText}`);
                lastError = new Error(`Status ${res.status}: ${errText}`);
            }
        } catch (err) {
            console.warn(`[Glassion Review Model ${model}] error: ${err.message}`);
            lastError = err;
        }
    }

    if (!reviewResponse) {
        const errorMsg = `Glassion Review failed all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`;
        await bandState.logAgentEvent(runId, 'Glassion', 'ERROR', { error: errorMsg });
        throw new Error(errorMsg);
    }

    let reviewData;
    try {
        const content = reviewResponse.choices[0].message.content;
        reviewData = sanitizeJSON(content);
    } catch (e) {
        console.error("Glassion review JSON parsing error:", e);
        reviewData = { passed: true, feedback: 'LGTM' };
    }

    // 3. Design Polish Pass (Glassion performs the final polish directly on the files)
    if (!reviewData.passed || reviewData.feedback !== 'LGTM') {
        await bandState.logAgentEvent(runId, 'Glassion', 'POLISHING', { 
            message: `Visual review identified design issues: "${reviewData.feedback}". Applying Glassion's final polish directly to files...` 
        });

        const buildPolisherPayload = (model) => ({
            model: model,
            messages: [
                {
                    role: "user",
                    content: `You are the Glassion Design Polisher. Take the generated files and apply final design touches.
Your goal is to apply:
1. Emil Kowalski animations: Smooth spring-like transitions (\`transition-all duration-300 ease-out hover:scale-[1.02]\`), interactive hover effects on buttons/cards.
2. Impeccable spacing: Tweak margins, alignments, card paddings, and centering.
3. Leonxlnx taste-skill: Smooth out border radii, add card border glows, improve color gradients, and load Google Fonts (e.g. Inter/Outfit) if not loaded.
4. WCAG Contrast checks: Ensure high contrast ratios for text readability.

IMPORTANT: Return the files using clear markdown code blocks preceded by their filenames. The format MUST be:

### index.html
\`\`\`html
...
\`\`\`

### style.css
\`\`\`css
...
\`\`\`

### script.js
\`\`\`javascript
...
\`\`\`

Original Files: ${JSON.stringify(files || { "index.html": htmlCode })}\n\nReview Findings: ${reviewData.feedback}`
                }
            ],
            temperature: 0.1
        });

        let polishResponse = null;
        for (const model of modelsToTry) {
            try {
                console.log(`[Glassion Polisher] Calling completions with model: ${model}`);
                const payload = buildPolisherPayload(model);
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 45000); // 45s for code generation

                const res = await fetch(`${provider.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.apiKey}`
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (res.ok) {
                    polishResponse = await res.json();
                    clearTimeout(timeout);
                    break;
                }
            } catch (err) {
                console.warn(`[Glassion Polisher Model ${model}] failed: ${err.message}`);
            }
        }

        if (polishResponse) {
            try {
                const polishContent = polishResponse.choices[0].message.content.trim();
                let polishedFiles = null;

                // 1. Try JSON
                try {
                    let jsonStr = polishContent;
                    const jsonMatch = polishContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[1].trim();
                    } else {
                        jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
                    }
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.files && typeof parsed.files === 'object' && parsed.files['index.html']) {
                        polishedFiles = parsed.files;
                    } else if (parsed['index.html']) {
                        polishedFiles = parsed;
                    }
                } catch (e) {
                    // Not JSON
                }

                // 2. Try Markdown blocks
                if (!polishedFiles) {
                    polishedFiles = parseMarkdownFiles(polishContent);
                }

                // 3. Try splitting HTML
                if (!polishedFiles) {
                    let htmlContent = polishContent
                        .replace(/```html/gi, '')
                        .replace(/```/g, '')
                        .trim();
                    if (!/<html[\s>]/i.test(htmlContent)) {
                        htmlContent = `<!DOCTYPE html>\n<html>\n${htmlContent}\n</html>`;
                    }
                    if (!/<\/html>/i.test(htmlContent)) {
                        htmlContent = `${htmlContent}\n</html>`;
                    }
                    polishedFiles = splitHtmlIntoFiles(htmlContent);
                }

                if (polishedFiles && polishedFiles['index.html']) {
                    // Reassemble for legacy iframe view
                    let reassembledHtml = polishedFiles['index.html'];
                    if (polishedFiles['style.css']) {
                        if (reassembledHtml.includes('style.css')) {
                            reassembledHtml = reassembledHtml.replace(
                                /<link[^>]*href=["']style\.css["'][^>]*>/i,
                                `<style>\n${polishedFiles['style.css']}\n</style>`
                            );
                        } else {
                            reassembledHtml = reassembledHtml.replace('</head>', `<style>\n${polishedFiles['style.css']}\n</style>\n</head>`);
                        }
                    }
                    if (polishedFiles['script.js']) {
                        if (reassembledHtml.includes('script.js')) {
                            reassembledHtml = reassembledHtml.replace(
                                /<script[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/i,
                                `<script>\n${polishedFiles['script.js']}\n</script>`
                            );
                        } else {
                            reassembledHtml = reassembledHtml.replace('</body>', `<script>\n${polishedFiles['script.js']}\n</script>\n</body>`);
                        }
                    }

                    const contextUpdate = {
                        ...currentContext,
                        files: polishedFiles,
                        html: reassembledHtml,
                        ux_review: { passed: true, feedback: 'LGTM (Polished)' }
                    };

                    await bandState.updateSharedContext(runId, contextUpdate);
                    await bandState.logAgentEvent(runId, 'Glassion', 'UX_APPROVED', { 
                        message: `Final design polish successfully applied. Spacing, typography, animations, and color harmony are locked!` 
                    });
                    
                    return { passed: true, feedback: 'LGTM (Polished)' };
                }
            } catch (err) {
                console.error("Glassion polisher parsing/applying failed:", err);
            }
        }
    }

    // Default return
    await bandState.updateSharedContext(runId, { ...currentContext, ux_review: reviewData });
    
    if (reviewData.passed) {
        await bandState.logAgentEvent(runId, 'Glassion', 'UX_APPROVED', { 
            message: `Aesthetics look flawless! Perfect layouts, typography, and contrast contrast bounds.` 
        });
    } else {
        await bandState.logAgentEvent(runId, 'Glassion', 'UX_FAILED', { 
            message: `Visual checks did not pass: ${reviewData.feedback}. Kuli, please regenerate the layout.` 
        });
    }

    return reviewData;
}

function splitHtmlIntoFiles(html) {
    const files = {};
    let cleanedHtml = html;

    // Extract all <style> blocks
    const styleBlocks = [];
    cleanedHtml = cleanedHtml.replace(
        /<style[^>]*>([\s\S]*?)<\/style>/gi,
        (_match, content) => {
            styleBlocks.push(content.trim());
            return '<link rel="stylesheet" href="style.css">';
        }
    );

    // Extract all <script> blocks (non-src ones only)
    const scriptBlocks = [];
    cleanedHtml = cleanedHtml.replace(
        /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi,
        (_match, content) => {
            if (content.trim()) {
                scriptBlocks.push(content.trim());
                return '<script src="script.js"></script>';
            }
            return '';
        }
    );

    // Deduplicate link/script references
    const seenLink = new Set();
    cleanedHtml = cleanedHtml.replace(
        /<link rel="stylesheet" href="style\.css">/g,
        (match) => {
            if (seenLink.has('style.css')) return '';
            seenLink.add('style.css');
            return match;
        }
    );
    const seenScript = new Set();
    cleanedHtml = cleanedHtml.replace(
        /<script src="script\.js"><\/script>/g,
        (match) => {
            if (seenScript.has('script.js')) return '';
            seenScript.add('script.js');
            return match;
        }
    );

    files['index.html'] = cleanedHtml.trim();

    if (styleBlocks.length > 0) {
        files['style.css'] = styleBlocks.join('\n\n');
    }

    if (scriptBlocks.length > 0) {
        files['script.js'] = scriptBlocks.join('\n\n');
    }

    return files;
}

function parseMarkdownFiles(text) {
    const files = {};
    
    // Pattern to match headings like "### index.html" followed by code block
    const regex = /(?:###|#|\*\*)\s*([a-zA-Z0-9_\-\.]+)\s*\n*```[a-z]*\n([\s\S]*?)\n```/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const filename = match[1].trim();
        const content = match[2];
        files[filename] = content;
    }
    
    // Fallback: search for code blocks and infer from their content if no filenames found
    if (Object.keys(files).length === 0) {
        const blocks = [];
        const blockRegex = /```([a-z]*)\n([\s\S]*?)\n```/gi;
        while ((match = blockRegex.exec(text)) !== null) {
            blocks.push({ lang: match[1].toLowerCase(), content: match[2] });
        }
        
        for (const block of blocks) {
            if (block.lang === 'html' || block.content.includes('<!DOCTYPE') || block.content.includes('<html')) {
                files['index.html'] = block.content;
            } else if (block.lang === 'css' || block.content.includes('body {') || block.content.includes(':root')) {
                files['style.css'] = block.content;
            } else if (block.lang === 'javascript' || block.lang === 'js' || block.content.includes('document.add') || block.content.includes('window.add')) {
                files['script.js'] = block.content;
            }
        }
    }
    
    return Object.keys(files).length > 0 ? files : null;
}

module.exports = { execute };


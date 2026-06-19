const bandState = require('../services/bandState');
const { formatBlueprint } = require('../lib/llm');
const { getProviderConfig } = require('../lib/provider');

async function execute(runId, prompt) {
    const currentContext = await bandState.getSharedContext(runId);
    const assignedModel = currentContext?.routing?.kuli_model || 'qwen-max';
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
        message: `Implementing the blueprint using model ${assignedModel}${feedback ? ' and applying review feedback' : ''}...`
    });

    const buildSystemPrompt = () => `You are Kuli, the implementation agent in a multi-agent web development swarm.
Generate a premium, custom, and highly polished web page as separate files.

IMPORTANT: Return the files using clear markdown code blocks preceded by their filenames. The format MUST be:

### index.html
\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    ...
    <script src="script.js"></script>
  </body>
</html>
\`\`\`

### style.css
\`\`\`css
/* All CSS styles here */
\`\`\`

### script.js
\`\`\`javascript
// All JavaScript here
\`\`\`

Strict Quality Rules:
1. **NO GENERIC AI SLOP**: Standard template layouts (e.g. flat white background, standard header, card list with simple text, plain buttons) are STRICTLY FORBIDDEN.
2. **RICH DESIGN SYSTEM**:
   - Use custom modern layouts: Bento grid layouts, asymmetric grids, or sliding panel dashboards.
   - Use smooth gradients, glows, card glassmorphism (e.g., \`backdrop-filter: blur(12px);\`), thin elegant borders (\`border-white/10\`), and soft ambient shadows.
   - Use sophisticated typography (e.g. load "Inter" or "Outfit" font from Google Fonts).
   - Use curated color palettes (e.g., deep dark indigo/slate background with neon purple/emerald accents, never flat colors).
3. **MICRO-ANIMATIONS**: Add transitions and micro-interactions for all hover states and active buttons.
4. **REAL CONTENT ONLY**: Do not write placeholder text like "Lorem Ipsum" or "Placeholder". Use rich, descriptive, context-appropriate copy.
5. **INTERACTIVE LOGIC**: Implement rich client-side interactivity in script.js (e.g., search/filter capabilities, dark mode toggling, stateful active tab rendering, data visualizations, or interactive modals).
6. **LINKING**:
   - index.html must link to style.css via <link rel="stylesheet" href="style.css">
   - index.html must reference script.js via <script src="script.js"></script>
   - Include Tailwind CSS CDN in index.html head for initial utility classes: <script src="https://cdn.tailwindcss.com"></script>
7. **ENTERPRISE LOGIC & ACCESSIBILITY**:
   - **Focus Trap**: For any modal, bento card, or interactive overlay, implement proper focus trap keydown handlers in JS.
   - **CSRF Token**: Always include a CSRF token placeholder meta tag in index.html: \`<meta name="csrf-token" content="{{CSRF_TOKEN_PLACEHOLDER}}">\`.
   - **Input Sanitization**: Always sanitize form inputs in JS using a custom helper function (e.g., escaping HTML characters) before processing.
   - **Tailwind Arbitrary Syntax**: Always use correct Tailwind syntax for custom dimensions/values (e.g., \`text-[1.2rem]\`, \`leading-[1.5]\`, \`h-[300px]\`, never \`text-1.2rem\` or \`leading-1.5\`).
   - **State Machine**: Manage UI states (idle, validating, loading, success, error) with a clear state machine object in script.js (never just toggle a boolean). Do not destroy the form DOM on success; show a success screen within a preserved container or toggle classes.
   - **Success Morph**: On successful submission/operation, animate the primary button to morph into a success checkmark with smooth spring physics (\`cubic-bezier(0.34, 1.56, 0.64, 1)\`).
   - **Screen Reader Live Regions**: Use live regions (\`role="status"\` or \`aria-live="polite"\`) with absolute position or \`sr-only\` hiding to announce status/errors to screen readers without visual layout shifts.
8. **CSS STYLING REQUIREMENT**: You MUST write substantial, custom CSS rules inside the \`style.css\` file (such as CSS custom properties/variables, custom glassmorphism overrides, radial background gradients, keyframe animations like \`@keyframes shake\`, custom scrollbar stylings, and transition utilities). Do not write all styles inline in index.html or leave style.css empty.

User request:
${prompt}

Locked blueprint:
${formatBlueprint(blueprint)}

Review feedback to apply:
${feedback || 'None'}`;

    const modelsToTry = [assignedModel, 'qwen-max', 'gemini-3.1-pro-preview', 'claude-sonnet-4-6'];
    let lastError = null;
    let response = null;
    const provider = getProviderConfig();

    const buildPayload = (model) => ({
        model: model,
        messages: [
            {
                role: "user",
                content: `${buildSystemPrompt()}\n\nGenerate the bespoke website now as requested in the system instructions. Output the files using clear markdown code blocks.`
            }
        ],
        temperature: 0.1
    });

    for (const model of modelsToTry) {
        try {
            console.log(`[Kuli] Calling completions endpoint with model: ${model}`);
            const payload = buildPayload(model);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for code generation
            
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
                response = await res.json();
                clearTimeout(timeout);
                break; // Succeeded!
            } else {
                const errText = await res.text();
                clearTimeout(timeout);
                console.warn(`[Kuli Model ${model}] failed with status: ${res.status} - ${errText}`);
                lastError = new Error(`Status ${res.status}: ${errText}`);
            }
        } catch (err) {
            console.warn(`[Kuli Model ${model}] failed with error: ${err.message}`);
            lastError = err;
            await new Promise(res => setTimeout(res, 3000)); // Pacing delay
        }
    }

    if (!response) {
        throw new Error(`Kuli failed all fallback models. Last error: ${lastError ? lastError.message : 'Unknown'}`);
    }

    let rawOutput = response.choices[0].message.content.trim();
    console.log('[Kuli] Raw response length:', rawOutput.length);

    let files = null;
    let html = null;

    // 1. Try to parse as multi-file JSON (in case it still outputs JSON)
    try {
        let jsonStr = rawOutput;
        const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        } else {
            jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.files && typeof parsed.files === 'object' && parsed.files['index.html']) {
            files = parsed.files;
            console.log('[Kuli] Multi-file JSON parsed successfully:', Object.keys(files).join(', '));
        } else if (parsed['index.html']) {
            files = parsed;
            console.log('[Kuli] Flat JSON files parsed successfully:', Object.keys(files).join(', '));
        }
    } catch (e) {
        // Not JSON or failed to parse
    }

    // 2. Try to parse as Markdown blocks with filenames
    if (!files) {
        files = parseMarkdownFiles(rawOutput);
        if (files) {
            console.log('[Kuli] Multi-file Markdown parsed successfully:', Object.keys(files).join(', '));
        }
    }

    // 3. Fallback: treat as raw HTML (single-file mode) and split it
    if (!files) {
        let htmlContent = rawOutput
            .replace(/```html/gi, '')
            .replace(/```/g, '')
            .trim();

        // Auto-wrap with html tags if missing
        if (!/<html[\s>]/i.test(htmlContent)) {
            console.log('[Kuli] Auto-wrapping output with <html> tags');
            htmlContent = `<!DOCTYPE html>\n<html>\n${htmlContent}\n</html>`;
        }
        if (!/<\/html>/i.test(htmlContent)) {
            htmlContent = `${htmlContent}\n</html>`;
        }
        
        console.log('[Kuli] Splitting single HTML file into multi-file structure');
        files = splitHtmlIntoFiles(htmlContent);
    }

    // Reassemble HTML for legacy downstream agents (Catalyst/Glassion screenshot preview)
    if (files && files['index.html']) {
        html = files['index.html'];
        if (files['style.css']) {
            if (html.includes('style.css')) {
                html = html.replace(
                    /<link[^>]*href=["']style\.css["'][^>]*>/i,
                    `<style>\n${files['style.css']}\n</style>`
                );
            } else {
                html = html.replace('</head>', `<style>\n${files['style.css']}\n</style>\n</head>`);
            }
        }
        if (files['script.js']) {
            if (html.includes('script.js')) {
                html = html.replace(
                    /<script[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/i,
                    `<script>\n${files['script.js']}\n</script>`
                );
            } else {
                html = html.replace('</body>', `<script>\n${files['script.js']}\n</script>\n</body>`);
            }
        }
    }

    // Update shared context with both formats
    const contextUpdate = { ...currentContext, html };
    if (files) {
        contextUpdate.files = files;
    }

    await bandState.updateSharedContext(runId, contextUpdate);
    await bandState.logAgentEvent(runId, 'Kuli', 'CODE_GENERATED', {
        message: files
            ? `Generated ${Object.keys(files).length} files: ${Object.keys(files).join(', ')}. Catalyst, please review.`
            : 'The complete HTML artifact is ready. Catalyst, please review it.'
    });
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



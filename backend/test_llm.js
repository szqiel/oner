const crucible = require('./agents/crucible');

async function main() {
    const runId = "d007536a-f83d-485e-b258-c9a8ce0dd5b8";
    const prompt = "Build a sleek login page";
    console.log(`Running Crucible execute for runId: ${runId}...`);
    try {
        const result = await crucible.execute(runId, prompt);
        console.log("Result:", result);
    } catch (err) {
        console.error("Crucible execution failed:", err);
    }
}

main();

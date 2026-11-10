const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["node_modules", "uploads", ".git"]);
let checked = 0;

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (SKIP.has(entry.name)) continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        else if (entry.isFile() && entry.name.endsWith(".js")) {
            new vm.Script(fs.readFileSync(fullPath, "utf8"), { filename: fullPath });
            checked += 1;
        }
    }
}

try {
    walk(ROOT);
    console.log(`Syntax check passed for ${checked} JavaScript files.`);
} catch (error) {
    console.error(`Syntax check failed: ${error.message}`);
    process.exitCode = 1;
}

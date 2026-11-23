import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(script) {
  console.log(`\n=== Running ${script} ===`);
  execFileSync(process.execPath, [path.join(__dirname, script)], { stdio: "inherit" });
}

run("validate-mermaid.mjs");
run("validate-consistency.mjs");
console.log("\nALL AUTOMATED ARCHITECTURE & MERMAID CHECKS PASSED.");

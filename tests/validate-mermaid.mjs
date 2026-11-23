import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "out"]);

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

function extractMermaidBlocks(mdContent) {
  const blocks = [];
  const regex = /```mermaid\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(mdContent)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

async function main() {
  // Set up JSDOM + DOMPurify so Mermaid v11 parser runs natively in Node
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.Node = dom.window.Node;
  globalThis.Element = dom.window.Element;
  globalThis.SVGElement = dom.window.SVGElement || dom.window.Element;
  const { default: createDOMPurify } = await import("dompurify");
  globalThis.DOMPurify = createDOMPurify(dom.window);

  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

  const allFiles = walk(repoRoot);
  const mmdFiles = allFiles.filter((f) => f.endsWith(".mmd")).sort();
  const mdFiles = allFiles.filter((f) => f.endsWith(".md")).sort();

  const targets = [];

  for (const file of mmdFiles) {
    targets.push({
      label: path.relative(repoRoot, file),
      code: fs.readFileSync(file, "utf8").trim(),
    });
  }

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, "utf8");
    const blocks = extractMermaidBlocks(content);
    blocks.forEach((code, idx) => {
      targets.push({
        label: `${path.relative(repoRoot, file)} [mermaid block #${idx + 1}]`,
        code,
      });
    });
  }

  if (targets.length === 0) {
    console.error("FAIL: No Mermaid diagrams found.");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const target of targets) {
    try {
      await mermaid.parse(target.code);
      console.log(`PASS: ${target.label}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${target.label}`);
      console.error(`  -> ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  // Also verify every blueprint's README embeds the exact .mmd diagrams
  const blueprintsDir = path.join(repoRoot, "blueprints");
  for (const slug of fs.readdirSync(blueprintsDir).sort()) {
    const bpDir = path.join(blueprintsDir, slug);
    if (!fs.statSync(bpDir).isDirectory()) continue;
    const readme = fs.readFileSync(path.join(bpDir, "README.md"), "utf8").replace(/\r\n/g, "\n");
    const arch = fs.readFileSync(path.join(bpDir, "architecture-diagram.mmd"), "utf8").replace(/\r\n/g, "\n").trim();
    const seq = fs.readFileSync(path.join(bpDir, "sequence-diagram.mmd"), "utf8").replace(/\r\n/g, "\n").trim();
    if (!readme.includes(arch)) {
      console.error(`FAIL: ${slug}/README.md embedded architecture diagram drifts from architecture-diagram.mmd`);
      failed++;
    } else if (!readme.includes(seq)) {
      console.error(`FAIL: ${slug}/README.md embedded sequence diagram drifts from sequence-diagram.mmd`);
      failed++;
    } else {
      console.log(`PASS: ${slug} README.md embedded diagrams match canonical .mmd files 100%`);
      passed++;
    }
  }

  console.log(`\nMermaid Validation Summary: ${passed} passed, ${failed} failed (${targets.length} diagrams parsed).`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

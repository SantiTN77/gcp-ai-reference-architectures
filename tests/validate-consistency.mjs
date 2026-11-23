import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const REQUIRED_BLUEPRINTS = [
  {
    slug: "01-technical-support-automation",
    requiredServices: [
      "Cloud Run",
      "Firestore",
      "Cloud DLP",
      "Model Armor",
      "Gemini 3.8 Flash",
      "Gemini Pro",
      "Cloud NAT",
      "Private Service Connect",
      "Cloud Armor",
      "Secret Manager",
      "Cloud KMS",
      "BigQuery",
    ],
  },
  {
    slug: "02-contract-processing-pipeline",
    requiredServices: [
      "Document AI",
      "Eventarc",
      "Cloud Workflows",
      "Cloud Run",
      "Cloud DLP",
      "Model Armor",
      "Gemini 3.8 Flash",
      "Gemini Pro",
      "Cloud Storage",
      "BigQuery",
      "Cloud NAT",
      "Private Service Connect",
      "Cloud KMS",
      "Secret Manager",
    ],
  },
  {
    slug: "03-internal-sql-analytics-agent",
    requiredServices: [
      "Cloud Run",
      "Cloud SQL",
      "BigQuery",
      "Cloud DLP",
      "Model Armor",
      "Gemini 3.8 Flash",
      "Gemini Pro",
      "IAP",
      "Cloud Armor",
      "Private Service Connect",
      "Cloud KMS",
      "Secret Manager",
      "Cloud Audit Logs",
    ],
  },
];

const REQUIRED_BP_FILES = [
  "README.md",
  "architecture-diagram.mmd",
  "sequence-diagram.mmd",
  "cost-estimation.md",
  "security-threat-model.md",
];

const REQUIRED_MADR_SECTIONS = [
  "## Context",
  "## Decision Drivers",
  "## Considered Options",
  "## Decision Outcome",
  "## Quantitative Trade-off Matrix",
  "## Consequences",
  "## Revisit Triggers",
];

const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "out"]);

let passed = 0;
let failed = 0;

function assert(condition, passMsg, failMsg) {
  if (condition) {
    console.log(`PASS: ${passMsg}`);
    passed++;
  } else {
    console.error(`FAIL: ${failMsg}`);
    failed++;
  }
}

function parseUsd(cell) {
  const cleaned = cell.replace(/\*\*/g, "").replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function validateCostTableSums(slug, mdContent) {
  const lines = mdContent.replace(/\r\n/g, "\n").split("\n");
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  // Locate the main 3-tier cost table header
  const headerIdx = tableLines.findIndex((l) => l.includes("GCP Service / Line Item"));
  if (headerIdx === -1) {
    assert(false, "", `${slug}/cost-estimation.md missing 'GCP Service / Line Item' table`);
    return;
  }

  const sums = [0, 0, 0];
  let totalRow = null;

  for (let i = headerIdx + 2; i < tableLines.length; i++) {
    const cols = tableLines[i]
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cols.length < 4) break;
    if (cols[0].includes("Total Estimated Monthly Cost")) {
      totalRow = [parseUsd(cols[1]), parseUsd(cols[2]), parseUsd(cols[3])];
      break;
    }
    const vals = [parseUsd(cols[1]), parseUsd(cols[2]), parseUsd(cols[3])];
    if (vals.every((v) => v !== null)) {
      sums[0] += vals[0];
      sums[1] += vals[1];
      sums[2] += vals[2];
    }
  }

  assert(
    totalRow !== null && totalRow.every((v) => v !== null),
    `${slug}/cost-estimation.md parsed Total Estimated Monthly Cost row`,
    `${slug}/cost-estimation.md missing valid Total Estimated Monthly Cost row`
  );

  if (totalRow) {
    ["Pilot", "Growth", "Enterprise"].forEach((tier, idx) => {
      const expected = Math.round(sums[idx] * 100) / 100;
      const stated = totalRow[idx];
      const diff = Math.abs(expected - stated);
      assert(
        diff < 0.005,
        `${slug} ${tier} cost sum verified ($${expected.toFixed(2)} == $${stated.toFixed(2)})`,
        `${slug} ${tier} cost mismatch: line-item sum=$${expected.toFixed(2)} vs stated=$${stated.toFixed(2)}`
      );
    });
  }
}

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

function main() {
  // 1. Blueprint completeness, cross-artifact service parity, and cost math
  for (const bp of REQUIRED_BLUEPRINTS) {
    const bpDir = path.join(repoRoot, "blueprints", bp.slug);
    assert(fs.existsSync(bpDir), `Blueprint directory exists: ${bp.slug}`, `Missing blueprint dir: ${bp.slug}`);

    for (const file of REQUIRED_BP_FILES) {
      const full = path.join(bpDir, file);
      assert(fs.existsSync(full), `${bp.slug}/${file} exists`, `Missing ${bp.slug}/${file}`);
    }

    const arch = fs.readFileSync(path.join(bpDir, "architecture-diagram.mmd"), "utf8");
    const cost = fs.readFileSync(path.join(bpDir, "cost-estimation.md"), "utf8");
    const threat = fs.readFileSync(path.join(bpDir, "security-threat-model.md"), "utf8");

    for (const svc of bp.requiredServices) {
      const re = new RegExp(svc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      assert(
        re.test(arch),
        `${bp.slug} diagram includes ${svc}`,
        `${bp.slug}/architecture-diagram.mmd missing service: ${svc}`
      );
      assert(
        re.test(cost),
        `${bp.slug} cost-estimation includes ${svc}`,
        `${bp.slug}/cost-estimation.md missing service: ${svc}`
      );
    }

    assert(
      /STRIDE/i.test(threat) && /OWASP/i.test(threat) && /Cloud DLP/i.test(threat) && /VPC-SC|VPC Service Controls/i.test(threat),
      `${bp.slug} security-threat-model covers STRIDE, OWASP LLM, Cloud DLP & VPC-SC`,
      `${bp.slug}/security-threat-model.md missing required security frameworks/controls`
    );

    validateCostTableSums(bp.slug, cost);
  }

  // 2. ADR completeness & MADR structure
  const adrsDir = path.join(repoRoot, "adrs");
  const adrFiles = fs.readdirSync(adrsDir).filter((f) => f.startsWith("ADR-") && f.endsWith(".md")).sort();
  assert(adrFiles.length >= 6, `Found ${adrFiles.length} ADRs (>= 6 required)`, `Only ${adrFiles.length} ADRs found`);

  for (const file of adrFiles) {
    const content = fs.readFileSync(path.join(adrsDir, file), "utf8");
    for (const section of REQUIRED_MADR_SECTIONS) {
      assert(
        content.includes(section),
        `${file} contains MADR section '${section}'`,
        `${file} missing MADR section '${section}'`
      );
    }
  }

  // 3. Portal content bundle sync check
  const bundlePath = path.join(repoRoot, "portal", "src", "generated", "content-bundle.json");
  assert(fs.existsSync(bundlePath), "Portal content-bundle.json exists", "Missing portal/src/generated/content-bundle.json");
  if (fs.existsSync(bundlePath)) {
    const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    assert(
      bundle.blueprints.length === 3 && bundle.adrs.length === adrFiles.length,
      `Portal bundle synced (${bundle.blueprints.length} blueprints, ${bundle.adrs.length} ADRs)`,
      `Portal bundle out of sync`
    );
  }

  // 4. Zero npm / package-lock.json check
  const allFiles = walk(repoRoot);
  const pkgLock = allFiles.filter((f) => path.basename(f) === "package-lock.json");
  assert(pkgLock.length === 0, "Zero package-lock.json files in repository", `Found package-lock.json: ${pkgLock.join(", ")}`);

  const forbiddenNpmHits = [];
  for (const file of allFiles) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    if (
      rel === "pnpm-lock.yaml" ||
      rel === "portal/pnpm-lock.yaml" ||
      rel === "tests/validate-consistency.mjs" ||
      rel === "scripts/generate-audit-report.mjs" ||
      rel === "docs/CLAUDE_VERIFICATION.md"
    ) {
      continue;
    }
    if (!/\.(md|mjs|ts|tsx|json|ps1|yml|yaml)$/i.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/\bnpm\s+(install|run|ci|build|test|start)\b/i.test(text)) {
      forbiddenNpmHits.push(rel);
    }
  }
  assert(
    forbiddenNpmHits.length === 0,
    "Zero forbidden npm command references across codebase",
    `Found npm command references in: ${forbiddenNpmHits.join(", ")}`
  );

  console.log(`\nConsistency Validation Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portalDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(portalDir, "..");

const BLUEPRINT_META = {
  "01-technical-support-automation": {
    number: "01",
    shortTitle: "Technical Support Automation",
    tagline:
      "Omnichannel L1/L2 triage with Firestore Vector Search, inline Cloud DLP redaction, Model Armor, and ADK Zendesk/Jira escalation.",
    tierUnit: "tickets/mo",
    pilotCost: "$84.25/mo",
    growthCost: "$230.95/mo",
    enterpriseCost: "$1,705.92/mo",
    routingSplit: "85% Flash / 15% Pro",
    sloHighlight: "P95 <= 2.8s | 99.95% SLA | >= 62% Deflection",
    tags: [
      "Cloud Run v2",
      "Firestore Vector Search",
      "Cloud DLP",
      "Model Armor",
      "ADK",
      "Cloud NAT",
      "VPC-SC",
    ],
  },
  "02-contract-processing-pipeline": {
    number: "02",
    shortTitle: "Contract Processing Pipeline",
    tagline:
      "Event-driven Document AI + Cloud Workflows + Cloud Run Jobs with deterministic KMS-wrapped DLP tokenization and BigQuery audit ledger.",
    tierUnit: "contracts/mo",
    pilotCost: "$151.83/mo",
    growthCost: "$1,116.95/mo",
    enterpriseCost: "$10,746.10/mo",
    routingSplit: "75% Flash / 25% Pro",
    sloHighlight: "P95 <= 45s / 20p PDF | 99.99% Durability | >= 98.5% Recall",
    tags: [
      "Document AI",
      "Eventarc",
      "Cloud Workflows",
      "Cloud Run Jobs",
      "Cloud DLP FPE",
      "BigQuery",
      "CMEK",
    ],
  },
  "03-internal-sql-analytics-agent": {
    number: "03",
    shortTitle: "Internal SQL Analytics Agent",
    tagline:
      "Zero-trust ADK + MCP read-only SQL tool server with deterministic AST guardrails, IAP identity RLS propagation, and 10 GB BigQuery dry-run caps.",
    tierUnit: "queries/mo",
    pilotCost: "$111.10/mo",
    growthCost: "$366.57/mo",
    enterpriseCost: "$1,377.53/mo",
    routingSplit: "70% Flash / 30% Pro",
    sloHighlight: "P95 <= 5.5s | 0% DDL/DML | 10 GB Dry-Run Cap",
    tags: [
      "MCP Server",
      "ADK",
      "Cloud SQL RO",
      "BigQuery RLS",
      "SQL AST Guardrail",
      "IAP",
      "Private Service Connect",
    ],
  },
};

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractField(md, label) {
  const re = new RegExp(`^-\\s*\\*\\*${label}\\*\\*:\\s*(.+)$`, "m");
  const match = md.match(re);
  return match ? match[1].trim() : "";
}

function extractSectionSummary(md, heading) {
  const re = new RegExp(`##\\s+${heading}\\n\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
  const match = md.match(re);
  if (!match) return "";
  return match[1].trim().split("\n\n")[0].replace(/\s+/g, " ");
}

function syncContent() {
  const blueprintsDir = path.join(repoRoot, "blueprints");
  const adrsDir = path.join(repoRoot, "adrs");

  const blueprintSlugs = fs
    .readdirSync(blueprintsDir)
    .filter((entry) => fs.statSync(path.join(blueprintsDir, entry)).isDirectory())
    .sort();

  const blueprints = blueprintSlugs.map((slug) => {
    const dir = path.join(blueprintsDir, slug);
    const readme = readText(path.join(dir, "README.md"));
    const architectureDiagram = readText(path.join(dir, "architecture-diagram.mmd"));
    const sequenceDiagram = readText(path.join(dir, "sequence-diagram.mmd"));
    const costEstimation = readText(path.join(dir, "cost-estimation.md"));
    const securityThreatModel = readText(path.join(dir, "security-threat-model.md"));
    const meta = BLUEPRINT_META[slug];

    return {
      slug,
      title: extractTitle(readme),
      ...meta,
      readme,
      architectureDiagram,
      sequenceDiagram,
      costEstimation,
      securityThreatModel,
    };
  });

  const adrFiles = fs
    .readdirSync(adrsDir)
    .filter((f) => f.startsWith("ADR-") && f.endsWith(".md"))
    .sort();

  const adrs = adrFiles.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const content = readText(path.join(adrsDir, file));
    const title = extractTitle(content);
    const idMatch = slug.match(/^(ADR-\d+)/);
    return {
      id: idMatch ? idMatch[1] : slug,
      slug,
      title,
      status: extractField(content, "Status") || "Accepted",
      date: extractField(content, "Date") || "2026-11-23",
      appliesTo: extractField(content, "Applies To") || "All Blueprints",
      summary: extractSectionSummary(content, "Context"),
      decisionOutcome: extractSectionSummary(content, "Decision Outcome"),
      content,
    };
  });

  const outDir = path.join(portalDir, "src", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "content-bundle.json");
  const bundle = { blueprints, adrs };
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
  console.log(
    `Synced ${blueprints.length} blueprints and ${adrs.length} ADRs -> ${path.relative(repoRoot, outPath)}`
  );
}

syncContent();

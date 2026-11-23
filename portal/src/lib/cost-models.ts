export type BlueprintId =
  | "01-technical-support-automation"
  | "02-contract-processing-pipeline"
  | "03-internal-sql-analytics-agent";

export type TierKey = "pilot" | "growth" | "enterprise";

export interface CostLineItem {
  service: string;
  category: "Compute" | "AI & Models" | "Data & Storage" | "Privacy & Security" | "Networking" | "Observability";
  monthlyUsd: number;
  formula: string;
}

export interface CostCalculationResult {
  blueprintId: BlueprintId;
  volume: number;
  unitLabel: string;
  flashSharePct: number;
  lineItems: CostLineItem[];
  totalMonthlyUsd: number;
  unitCostUsd: number;
  allProMonthlyUsd: number;
  routingSavingsUsd: number;
  baselineNotes: string;
}

export interface BlueprintCostPreset {
  id: BlueprintId;
  name: string;
  unitLabel: string;
  defaultFlashPct: number;
  minVolume: number;
  maxVolume: number;
  step: number;
  tiers: Record<TierKey, { label: string; volume: number }>;
}

export const BLUEPRINT_COST_PRESETS: Record<BlueprintId, BlueprintCostPreset> = {
  "01-technical-support-automation": {
    id: "01-technical-support-automation",
    name: "BP01 — Technical Support Automation",
    unitLabel: "support tickets / mo",
    defaultFlashPct: 85,
    minVolume: 1000,
    maxVolume: 1500000,
    step: 5000,
    tiers: {
      pilot: { label: "Pilot (10k/mo)", volume: 10000 },
      growth: { label: "Growth (100k/mo)", volume: 100000 },
      enterprise: { label: "Enterprise (1M/mo)", volume: 1000000 },
    },
  },
  "02-contract-processing-pipeline": {
    id: "02-contract-processing-pipeline",
    name: "BP02 — Contract Processing Pipeline",
    unitLabel: "20-page contracts / mo",
    defaultFlashPct: 75,
    minVolume: 100,
    maxVolume: 75000,
    step: 500,
    tiers: {
      pilot: { label: "Pilot (500/mo)", volume: 500 },
      growth: { label: "Growth (5k/mo)", volume: 5000 },
      enterprise: { label: "Enterprise (50k/mo)", volume: 50000 },
    },
  },
  "03-internal-sql-analytics-agent": {
    id: "03-internal-sql-analytics-agent",
    name: "BP03 — Internal SQL Analytics Agent",
    unitLabel: "analytics queries / mo",
    defaultFlashPct: 70,
    minVolume: 1000,
    maxVolume: 500000,
    step: 2500,
    tiers: {
      pilot: { label: "Pilot (5k/mo)", volume: 5000 },
      growth: { label: "Growth (50k/mo)", volume: 50000 },
      enterprise: { label: "Enterprise (250k/mo)", volume: 250000 },
    },
  },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateBlueprintCost(
  blueprintId: BlueprintId,
  volume: number,
  flashSharePct: number,
  amortizeSharedVpc: boolean
): CostCalculationResult {
  const flashRatio = Math.max(0, Math.min(100, flashSharePct)) / 100;
  const proRatio = 1 - flashRatio;

  if (blueprintId === "01-technical-support-automation") {
    const warmInstancesCost = volume >= 500000 ? 25.76 : 0;
    const cloudRun = round2((volume / 100000) * 3.54 + warmInstancesCost);
    const flash = round2(flashRatio * volume * (2400 * 0.15 + 450 * 0.6) / 1e6);
    const pro = round2(proRatio * volume * (2400 * 1.25 + 450 * 5.0) / 1e6);
    const allProLlm = round2(volume * (2400 * 1.25 + 450 * 5.0) / 1e6);
    const embed = round2((volume * 150 * 0.025) / 1e6);
    const storageGb = volume <= 20000 ? 2 : volume <= 200000 ? 10 : 50;
    const firestore = round2((volume * 8 * 0.06) / 100000 + (volume * 0.2 * 0.18) / 100000 + storageGb * 0.18);
    const dlp = round2(((volume * 4) / 1_000_000) * 3.0);
    const modelArmor = round2((volume * 2 / 1000) * 0.1);
    const albArmor = amortizeSharedVpc
      ? round2((volume / 1_000_000) * 0.75)
      : round2(18.25 + 6.0 + (volume / 1_000_000) * 0.75);
    const natPsc = amortizeSharedVpc
      ? round2((volume / 1_000_000) * 0.2)
      : round2(32.85 + 7.3 + (volume / 1_000_000) * 0.2);
    const kmsSecrets = round2(2.18 + (volume / 1_000_000) * 0.32);
    const obs = round2(volume <= 10000 ? 1.5 : volume <= 100000 ? 4.5 : 4.5 + ((volume - 100000) / 900000) * 19.5);

    const lineItems: CostLineItem[] = [
      { service: "Cloud Run v2 (Triage GW + RAG + ADK)", category: "Compute", monthlyUsd: cloudRun, formula: warmInstancesCost > 0 ? "Active compute + 2 warm instances ($15.16)" : "min_instances=0 (Zero Idle Cost)" },
      { service: `Vertex AI — Gemini 3.8 Flash (${Math.round(flashRatio * 100)}%)`, category: "AI & Models", monthlyUsd: flash, formula: `${Math.round(flashRatio * 100)}% * N * (2400*$0.15 + 450*$0.60)/1M` },
      { service: `Vertex AI — Gemini Pro (${Math.round(proRatio * 100)}%)`, category: "AI & Models", monthlyUsd: pro, formula: `${Math.round(proRatio * 100)}% * N * (2400*$1.25 + 450*$5.00)/1M` },
      { service: "Vertex AI — text-embedding-005", category: "AI & Models", monthlyUsd: embed, formula: "N * 150 tokens * $0.025/1M" },
      { service: "Cloud Firestore (Native + Vector Search)", category: "Data & Storage", monthlyUsd: firestore, formula: `8 reads/req + ${storageGb} GB storage ($0 idle index)` },
      { service: "Cloud DLP (Inspect + De-identify)", category: "Privacy & Security", monthlyUsd: dlp, formula: "N * 4 KB * $3.00/GB" },
      { service: "Model Armor (Prompt Screening)", category: "Privacy & Security", monthlyUsd: modelArmor, formula: "N * $0.10 / 1,000 requests" },
      { service: "External ALB + Cloud Armor + IAP", category: "Networking", monthlyUsd: albArmor, formula: amortizeSharedVpc ? "Shared VPC amortized (marginal WAF reqs)" : "ALB ($18.25) + Armor ($6.00) + WAF reqs" },
      { service: "Cloud NAT + Private Service Connect", category: "Networking", monthlyUsd: natPsc, formula: amortizeSharedVpc ? "Shared VPC amortized (marginal egress)" : "NAT ($32.85) + PSC ($7.30) + egress" },
      { service: "Secret Manager + Cloud KMS (CMEK)", category: "Privacy & Security", monthlyUsd: kmsSecrets, formula: "2 CMEK keys + 3 secrets + API ops" },
      { service: "Cloud Logging + Monitoring + BigQuery", category: "Observability", monthlyUsd: obs, formula: "Structured audit sink + weekly LLMOps evals" },
    ];

    const totalMonthlyUsd = round2(lineItems.reduce((acc, item) => acc + item.monthlyUsd, 0));
    const routingSavingsUsd = round2(Math.max(0, allProLlm - (flash + pro)));
    return {
      blueprintId,
      volume,
      unitLabel: BLUEPRINT_COST_PRESETS[blueprintId].unitLabel,
      flashSharePct,
      lineItems,
      totalMonthlyUsd,
      unitCostUsd: volume > 0 ? totalMonthlyUsd / volume : 0,
      allProMonthlyUsd: round2(totalMonthlyUsd + routingSavingsUsd),
      routingSavingsUsd,
      baselineNotes: "Firestore Vector Search saves ~$156–$260/mo vs always-on Vertex AI Vector Search Index Endpoints.",
    };
  }

  if (blueprintId === "02-contract-processing-pipeline") {
    const docAi = round2(volume * 20 * 0.01);
    const totalInput = 16000;
    const totalOutput = 2000;
    const flashIn = totalInput * flashRatio;
    const flashOut = totalOutput * (flashRatio === 0.75 ? 0.6 : flashRatio);
    const proIn = totalInput - flashIn;
    const proOut = totalOutput - flashOut;
    const flash = round2((volume * (flashIn * 0.15 + flashOut * 0.6)) / 1e6);
    const pro = round2((volume * (proIn * 1.25 + proOut * 5.0)) / 1e6);
    const allProLlm = round2((volume * (totalInput * 1.25 + totalOutput * 5.0)) / 1e6);
    const dlp = round2(((volume * 60) / 1_000_000) * 3.0);
    const modelArmor = round2((volume / 1000) * 0.1);
    const workflows = round2((volume * 12 * 0.01) / 1000);
    const cloudRun = round2((volume / 500) * 0.4);
    const storageBq = round2(volume <= 500 ? 1.2 : volume <= 5000 ? 6.5 : 6.5 + ((volume - 5000) / 45000) * 41.5);
    const natPsc = amortizeSharedVpc
      ? round2((volume / 50000) * 0.45)
      : round2(32.85 + 7.3 + (volume / 50000) * 0.45);
    const kmsSecrets = round2(3.12 + (volume / 50000) * 0.38);
    const obs = round2(volume <= 500 ? 1.0 : volume <= 5000 ? 3.5 : 3.5 + ((volume - 5000) / 45000) * 14.5);

    const lineItems: CostLineItem[] = [
      { service: "Document AI (Layout Parser — 20 pages/doc)", category: "AI & Models", monthlyUsd: docAi, formula: "N * 20 pages * $0.01/page" },
      { service: `Vertex AI — Gemini 3.8 Flash (${Math.round(flashRatio * 100)}% Clauses)`, category: "AI & Models", monthlyUsd: flash, formula: `${Math.round(flashIn)} in + ${Math.round(flashOut)} out tokens/contract` },
      { service: `Vertex AI — Gemini Pro (${Math.round(proRatio * 100)}% High-Risk)`, category: "AI & Models", monthlyUsd: pro, formula: `${Math.round(proIn)} in + ${Math.round(proOut)} out tokens/contract` },
      { service: "Cloud DLP (Deterministic FPE Tokenization)", category: "Privacy & Security", monthlyUsd: dlp, formula: "N * 60 KB * $3.00/GB" },
      { service: "Model Armor (PDF Injection Screening)", category: "Privacy & Security", monthlyUsd: modelArmor, formula: "N * $0.10 / 1,000 contracts" },
      { service: "Cloud Workflows + Eventarc", category: "Compute", monthlyUsd: workflows, formula: "N * 12 steps * $0.01/1k steps" },
      { service: "Cloud Run Jobs + CLM Notifier (min=0)", category: "Compute", monthlyUsd: cloudRun, formula: "Serverless batch 2 vCPU / 2 GiB (Zero Idle Cost)" },
      { service: "Cloud Storage + BigQuery Audit Ledger", category: "Data & Storage", monthlyUsd: storageBq, formula: "CMEK raw PDFs + immutable compliance ledger" },
      { service: "Cloud NAT + Private Service Connect", category: "Networking", monthlyUsd: natPsc, formula: amortizeSharedVpc ? "Shared VPC amortized" : "NAT ($32.85) + PSC ($7.30) + webhook egress" },
      { service: "Cloud KMS (CMEK) + Secret Manager", category: "Privacy & Security", monthlyUsd: kmsSecrets, formula: "3 CMEK keys + 2 secrets + crypto ops" },
      { service: "Cloud Logging + Monitoring", category: "Observability", monthlyUsd: obs, formula: "Pipeline SLA & audit trail" },
    ];

    const totalMonthlyUsd = round2(lineItems.reduce((acc, item) => acc + item.monthlyUsd, 0));
    const routingSavingsUsd = round2(Math.max(0, allProLlm - (flash + pro)));
    return {
      blueprintId,
      volume,
      unitLabel: BLUEPRINT_COST_PRESETS[blueprintId].unitLabel,
      flashSharePct,
      lineItems,
      totalMonthlyUsd,
      unitCostUsd: volume > 0 ? totalMonthlyUsd / volume : 0,
      allProMonthlyUsd: round2(totalMonthlyUsd + routingSavingsUsd),
      routingSavingsUsd,
      baselineNotes: "Routing digital-native PDFs around Document AI OCR cuts Enterprise spend by up to 60.5%.",
    };
  }

  // Blueprint 03 — Internal SQL Analytics Agent
  const warmMcp = volume >= 150000 ? 12.88 : 0;
  const cloudRun = round2((volume / 50000) * 2.22 + warmMcp);
  const flash = round2(flashRatio * volume * (3500 * 0.15 + 600 * 0.6) / 1e6);
  const pro = round2(proRatio * volume * (3500 * 1.25 + 600 * 5.0) / 1e6);
  const allProLlm = round2(volume * (3500 * 1.25 + 600 * 5.0) / 1e6);
  const cloudSql = volume <= 15000 ? 59.5 : volume <= 100000 ? 119.0 : 248.0;
  const scannedTb = (volume * 0.25) / 1000;
  const bq = round2(Math.max(1.25, (Math.max(0, scannedTb - 1) * 5.0)));
  const dlp = round2(((volume * 20) / 1_000_000) * 3.0);
  const modelArmor = round2((volume / 1000) * 0.1);
  const albPsc = amortizeSharedVpc
    ? round2((volume / 250000) * 0.19)
    : round2(18.25 + 6.0 + 7.3 + (volume / 250000) * 0.19);
  const kmsSecrets = round2(2.12 + (volume / 250000) * 0.18);
  const obs = round2(volume <= 5000 ? 1.5 : volume <= 50000 ? 4.5 : 4.5 + ((volume - 50000) / 200000) * 11.5);

  const lineItems: CostLineItem[] = [
    { service: "Cloud Run v2 (ADK Agent + MCP Server)", category: "Compute", monthlyUsd: cloudRun, formula: warmMcp > 0 ? "Active compute + 1 warm MCP instance ($7.58)" : "min_instances=0 (Zero Idle Cost)" },
    { service: `Vertex AI — Gemini 3.8 Flash (${Math.round(flashRatio * 100)}%)`, category: "AI & Models", monthlyUsd: flash, formula: `${Math.round(flashRatio * 100)}% * N * (3500*$0.15 + 600*$0.60)/1M` },
    { service: `Vertex AI — Gemini Pro (${Math.round(proRatio * 100)}%)`, category: "AI & Models", monthlyUsd: pro, formula: `${Math.round(proRatio * 100)}% * N * (3500*$1.25 + 600*$5.00)/1M` },
    { service: "Cloud SQL PostgreSQL (Dedicated RO Replica)", category: "Data & Storage", monthlyUsd: cloudSql, formula: "Private IP read replica isolating OLTP primary" },
    { service: "BigQuery (On-Demand Scans w/ 10 GB Cap)", category: "Data & Storage", monthlyUsd: bq, formula: "Avg 250 MB/query minus 1 TB/mo free tier * $5/TB" },
    { service: "Cloud DLP (Prompt + SQL Row Scrubbing)", category: "Privacy & Security", monthlyUsd: dlp, formula: "N * 20 KB * $3.00/GB" },
    { service: "Model Armor (Prompt Screening)", category: "Privacy & Security", monthlyUsd: modelArmor, formula: "N * $0.10 / 1,000 queries" },
    { service: "ALB + Cloud Armor + IAP + PSC", category: "Networking", monthlyUsd: albPsc, formula: amortizeSharedVpc ? "Shared VPC amortized" : "ALB ($18.25) + Armor ($6.00) + PSC ($7.30) + IAP ($0)" },
    { service: "Cloud KMS (CMEK) + Secret Manager", category: "Privacy & Security", monthlyUsd: kmsSecrets, formula: "2 CMEK keys + 2 secrets + ops" },
    { service: "Cloud Audit Logs + Cloud Logging", category: "Observability", monthlyUsd: obs, formula: "Immutable SQL + identity audit ledger" },
  ];

  const totalMonthlyUsd = round2(lineItems.reduce((acc, item) => acc + item.monthlyUsd, 0));
  const routingSavingsUsd = round2(Math.max(0, allProLlm - (flash + pro)));
  return {
    blueprintId,
    volume,
    unitLabel: BLUEPRINT_COST_PRESETS[blueprintId].unitLabel,
    flashSharePct,
    lineItems,
    totalMonthlyUsd,
    unitCostUsd: volume > 0 ? totalMonthlyUsd / volume : 0,
    allProMonthlyUsd: round2(totalMonthlyUsd + routingSavingsUsd),
    routingSavingsUsd,
    baselineNotes: "BigQuery-only variant (without dedicated Cloud SQL replica) saves $59.50–$248.00/mo.",
  };
}

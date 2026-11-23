# Blueprint 02: Monthly GCP Cost Estimation — Contract Processing Pipeline

## 1. Pricing Baseline & Workload Assumptions

All unit prices reflect `us-central1` on-demand GCP pricing. Contract volumes are modeled across 3 enterprise legal operations tiers assuming an **average contract length of 20 pages** (~60 KB extracted text / ~16,000 input tokens per contract, generating ~2,000 structured JSON output tokens per contract).

### Per-Contract Workload Profile (20-Page MSA / DPA Average)
- **Document AI (Layout Parser)**: $10.00 / 1,000 pages = $0.01 / page ($0.20 per 20-page contract).
- **Cloud DLP (Inspect + Deterministic Tokenization)**: 60 KB text/contract = 0.00006 GB/contract at $3.00/GB combined ($1.00 inspect + $2.00 de-identify).
- **Model Armor**: 1 screening call per contract (batched clause payload) at $0.10 / 1,000 requests.
- **Vertex AI Tiered Clause Routing** (per [ADR-003](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)):
  - **75% Standard Clauses -> Gemini 3.8 Flash**: 12,000 input tokens ($0.15/1M) + 1,200 output tokens ($0.60/1M) = **$0.00252 / contract**.
  - **25% High-Risk Clauses -> Gemini Pro**: 4,000 input tokens ($1.25/1M) + 800 output tokens ($5.00/1M) = **$0.00900 / contract**.
- **Cloud Workflows + Eventarc**: 12 internal workflow steps per contract ($0.01 / 1,000 steps; first 5,000 steps free) + Eventarc ($0.40 / 1M events).
- **Cloud Run Jobs + CLM Notifier**: 2 vCPU / 2 GiB RAM for 15 s per contract (`min_instances = 0`, 100% scale-to-zero).
- **Cloud Storage (GCS) + BigQuery Audit Ledger**: 2 MB PDF/contract stored in GCS Standard ($0.020/GB-mo) + BigQuery active storage ($0.020/GB-mo) & compliance reporting queries ($5.00/TB).
- **Networking & Security**: Private Service Connect endpoint ($7.30/mo) + Cloud NAT gateway ($32.85/mo + egress) + Cloud KMS (3 CMEK keys = $3.00/mo) + Secret Manager (2 secrets = $0.12/mo).
- **Cloud Logging + Monitoring**: Structured pipeline audit logs & SLA dashboards.

---

## 2. Monthly Cost Comparison Across 3 Enterprise Contract Volume Tiers

| GCP Service / Line Item | Pilot / Legal Team (500 contracts/mo; 10k pages) | Growth / Mid-Market (5,000 contracts/mo; 100k pages) | Enterprise / Global M&A (50,000 contracts/mo; 1M pages) | Calculation Formula / Notes |
| :--- | ---: | ---: | ---: | :--- |
| **Document AI (Layout Parser)** | $100.00 | $1,000.00 | $10,000.00 | `Contracts * 20 pages * $0.01/page` |
| **Vertex AI — Gemini 3.8 Flash** (75% Clauses) | $1.26 | $12.60 | $126.00 | `Contracts * (12k*0.15 + 1.2k*0.60) / 1e6` |
| **Vertex AI — Gemini Pro** (25% High-Risk) | $4.50 | $45.00 | $450.00 | `Contracts * (4k*1.25 + 0.8k*5.00) / 1e6` |
| **Cloud DLP (Inspect + Deterministic Tokenize)** | $0.09 | $0.90 | $9.00 | `Contracts * 60 KB * $3.00/GB` |
| **Model Armor (PDF Injection Screening)** | $0.05 | $0.50 | $5.00 | `Contracts * $0.10 / 1,000` |
| **Cloud Workflows + Eventarc** | $0.06 | $0.60 | $6.00 | `Contracts * 12 steps * $0.01/1k steps` |
| **Cloud Run Jobs + CLM Notifier** (`min=0`) | $0.40 | $4.00 | $40.00 | `Contracts * 15s * (2 vCPU + 2 GiB)` |
| **Cloud Storage + BigQuery Audit Ledger** | $1.20 | $6.50 | $48.00 | Raw PDFs (CMEK) + BQ immutable audit ledger + queries |
| **Cloud NAT + Private Service Connect** | $40.15 | $40.20 | $40.60 | NAT gateway ($32.85) + PSC ($7.30) + webhook egress |
| **Cloud KMS (CMEK) + Secret Manager** | $3.12 | $3.15 | $3.50 | 3 CMEK keys ($3.00) + 2 secrets ($0.12) + crypto ops |
| **Cloud Logging + Monitoring** | $1.00 | $3.50 | $18.00 | Pipeline execution logs & legal SLA alerting |
| **Total Estimated Monthly Cost** | **$151.83** | **$1,116.95** | **$10,746.10** | **Exact sum of all line items above** |
| **Effective Cost per 20-Page Contract** | **$0.3037** | **$0.2234** | **$0.2149** | Total Monthly Cost / Monthly Contracts |

---

## 3. FinOps Insights & Optimization Levers

1. **Document AI Dominates Spend (~90% at Growth/Enterprise)**: At 50,000 contracts/month, Document AI ($10,000/mo) represents **93.1%** of total cost, whereas combined Gemini 3.8 Flash + Pro inference is only **$576.00/mo (5.4%)**.
2. **Digital-Native PDF Optimization**: For digitally generated PDFs (no scanned images), routing clean text-layer PDFs through a lightweight PDF text/layout extractor in Cloud Run Jobs and reserving Document AI Layout Parser exclusively for scanned/OCR contracts (~35% of enterprise volume) reduces Enterprise monthly spend from **$10,746.10** to **$4,246.10** (**60.5% savings**).
3. **ROI vs External Counsel**: First-pass commercial contract review by outside counsel averages $250–$600 per MSA. Processing 5,000 contracts/month for **$1,116.95** ($0.22/contract) achieves >99.9% cost reduction on first-pass risk triage.

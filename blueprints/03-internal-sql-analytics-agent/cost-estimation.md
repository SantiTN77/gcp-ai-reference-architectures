# Blueprint 03: Monthly GCP Cost Estimation — Internal SQL Analytics Agent

## 1. Pricing Baseline & Workload Assumptions

All unit prices reflect `us-central1` on-demand GCP pricing. Traffic tiers represent internal enterprise analytics usage (BI, Finance, RevOps, Executive Self-Service).

### Per-Query Workload Profile
- **Average LLM Token Budget (Schema Context + SQL Generation + Narrative Synthesis)**: 3,500 input tokens, 600 output tokens per analytical question.
- **Model Routing Split** (per [ADR-003](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)):
  - **70% Standard KPI / Aggregation Queries -> Vertex AI Gemini 3.8 Flash**: $0.15/1M input, $0.60/1M output.
  - **30% Complex Multi-CTE / Window Function Queries -> Vertex AI Gemini Pro**: $1.25/1M input, $5.00/1M output.
- **Cloud Run v2 Compute** (`sa-sql-agent` + `sa-mcp-sql-ro`): 1 vCPU / 1 GiB RAM, avg 1.5 s active CPU-time per query (`min_instances = 0` for Pilot & Growth; 1 warm MCP instance in Enterprise = **+$12.88/mo**).
- **Cloud SQL for PostgreSQL (Read Replica)**:
  - Note: Most enterprises connect to an **existing** Cloud SQL primary by adding a dedicated **read-only replica** so AI queries never contend with OLTP production. Dedicated replica sizing shown transparently:
    - Pilot: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM, 50 GB SSD, Private IP) = **$59.50/mo**.
    - Growth: `db-custom-2-7680` (2 vCPU, 7.5 GB RAM, 100 GB SSD) = **$119.00/mo**.
    - Enterprise: `db-custom-4-15360` (4 vCPU, 15 GB RAM, 250 GB SSD) = **$248.00/mo**.
- **BigQuery Analytical Queries**: Avg 250 MB scanned per query (enforced via partition pruning + 10 GB dry-run cap) at $5.00/TB ($0.00125/query) after 1 TB/mo free tier.
- **Cloud DLP (Input + Output Row Scrubbing)**: Avg 20 KB SQL result table + prompt per query at $3.00/GB combined.
- **Model Armor**: $0.10 / 1,000 queries screened.
- **Networking & Security**: Application Load Balancer ($18.25/mo) + Cloud Armor ($6.00/mo) + Private Service Connect endpoint ($7.30/mo) + Cloud KMS (2 CMEK keys = $2.00/mo) + Secret Manager (2 secrets = $0.12/mo). (IAP is free on GCP.)
- **Cloud Audit Logs + Cloud Logging**: Immutable SQL query audit trail & cost ledger.

---

## 2. Monthly Cost Comparison Across 3 Enterprise Analytics Tiers

| GCP Service / Line Item | Pilot / Finance Team (5,000 queries/mo) | Growth / Multi-Dept BI (50,000 queries/mo) | Enterprise / Global Org (250,000 queries/mo) | Calculation Formula / Notes |
| :--- | ---: | ---: | ---: | :--- |
| **Cloud Run v2** (ADK Agent + MCP Server) | $0.22 | $2.22 | $23.98 | Active compute (`min=0` Pilot/Growth) + 1 warm MCP instance in Enterprise ($12.88) |
| **Vertex AI — Gemini 3.8 Flash** (70% Queries) | $3.10 | $30.98 | $154.88 | `0.70 * N * (3500*0.15 + 600*0.60) / 1e6` |
| **Vertex AI — Gemini Pro** (30% Complex SQL) | $11.06 | $110.63 | $553.13 | `0.30 * N * (3500*1.25 + 600*5.00) / 1e6` |
| **Cloud SQL PostgreSQL (Dedicated RO Replica)** | $59.50 | $119.00 | $248.00 | Private IP read replica (`1/2/4 vCPU`) isolating OLTP primary |
| **BigQuery (On-Demand Scans w/ 10GB Cap)** | $1.25 | $57.50 | $307.50 | `(N * 250 MB - 1 TB free tier) * $5.00/TB` (min $1.25 storage) |
| **Cloud DLP (Prompt + SQL Row Scrubbing)** | $0.30 | $3.00 | $15.00 | `N * 20 KB * $3.00/GB` |
| **Model Armor (Prompt Screening)** | $0.50 | $5.00 | $25.00 | `N * $0.10 / 1,000 queries` |
| **ALB + Cloud Armor + IAP + PSC** | $31.55 | $31.59 | $31.74 | ALB ($18.25) + Armor ($6.00) + PSC ($7.30) + IAP ($0.00) |
| **Cloud KMS (CMEK) + Secret Manager** | $2.12 | $2.15 | $2.30 | 2 CMEK keys ($2.00) + 2 secrets ($0.12) + ops |
| **Cloud Audit Logs + Cloud Logging** | $1.50 | $4.50 | $16.00 | Immutable SQL execution & identity audit trail |
| **Total Estimated Monthly Cost** | **$111.10** | **$366.57** | **$1,377.53** | **Exact sum of all line items above** |
| **Effective Cost per Analytics Query** | **$0.0222** | **$0.0073** | **$0.0055** | Total Monthly Cost / Monthly Queries |

---

## 3. FinOps Insights & Optimization Levers

1. **BigQuery-Only Zero-Idle Variant**: If the organization only queries BigQuery (no Cloud SQL PostgreSQL read replica required), removing the dedicated Cloud SQL replica drops Pilot monthly cost from **$111.10** to **$51.60/mo** (or **$20.05/mo** on an existing Shared VPC ALB).
2. **Dry-Run Guardrail ROI**: A single unpartitioned `SELECT *` against a 50 TB enterprise BigQuery event table costs **$250.00**. The MCP server's mandatory 10 GB dry-run cap ($0.05 max per query) pays for the entire Cloud Run + DLP + Model Armor stack in a single prevented mistake.
3. **Semantic Caching**: Caching frequent recurring executive KPIs (e.g., daily revenue rollups) in BigQuery BI Engine or a 5-minute TTL response cache cuts Growth/Enterprise LLM + BigQuery scan costs by 25%–40%.

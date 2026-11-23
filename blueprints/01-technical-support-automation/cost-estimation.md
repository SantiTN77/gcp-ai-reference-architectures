# Blueprint 01: Monthly GCP Cost Estimation — Technical Support Automation

## 1. Pricing Baseline & Workload Assumptions

All unit prices reflect standard `us-central1` on-demand GCP list pricing (no Committed Use Discounts assumed; 1-year/3-year CUDs reduce Vertex AI and Cloud Run compute by 20%–37%).

### Per-Request Workload Profile
- **Average Inbound Ticket + Context Payload**: 4 KB raw text inspected by **Cloud DLP** (0.000004 GB/req).
- **Average Query Embedding**: 150 input tokens via **Vertex AI `text-embedding-005`** ($0.025 / 1M tokens).
- **Average Grounded RAG Prompt (8 chunks + system prompt + ticket)**: 2,400 input tokens; 450 output tokens.
- **Model Routing Split** (per [ADR-003](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md); pre-routed via lightweight complexity/intent score):
  - **85% L1 Traffic -> Vertex AI Gemini 3.8 Flash**: $0.15 / 1M input tokens, $0.60 / 1M output tokens.
  - **15% L2 Traffic -> Vertex AI Gemini Pro**: $1.25 / 1M input tokens, $5.00 / 1M output tokens.
- **Cloud Run v2 Compute**: 3 services (`sa-support-gw`, `sa-rag-reader`, `sa-support-agent`), 1 vCPU / 1 GiB RAM, avg 1.2 s combined active CPU-time per request ($0.00002400/vCPU-sec, $0.00000250/GiB-sec, $0.40/1M requests).
  - **Pilot (10k req/mo)** & **Growth (100k req/mo)**: `min_instance_count = 0` (**Zero Idle Cost**).
  - **Enterprise (1M req/mo)**: `min_instance_count = 1` on `sa-support-gw` and `sa-rag-reader` (2 warm instances total at $12.88/mo each = **+$25.76/mo** idle baseline) to guarantee P99 < 2.8 s without cold starts.
- **Cloud Firestore Vector Search**: 8 document reads per request ($0.06 / 100k reads) + 1 audit write per 5 requests ($0.18 / 100k writes) + 2 GB / 10 GB / 50 GB vector+doc storage ($0.18/GB-mo). **$0 idle index hosting fee.**
  - Pilot: `(80k*$0.06/100k) + (2k*$0.18/100k) + (2*$0.18) = $0.05 + $0.00 + $0.36 = $0.41`
  - Growth: `(800k*$0.06/100k) + (20k*$0.18/100k) + (10*$0.18) = $0.48 + $0.04 + $1.80 = $2.32`
  - Enterprise: `(8M*$0.06/100k) + (200k*$0.18/100k) + (50*$0.18) = $4.80 + $0.36 + $9.00 = $14.16`
- **Cloud DLP (Sensitive Data Protection)**: $1.00 / GB inspected + $2.00 / GB de-identified = $3.00 / GB combined.
- **Model Armor**: 2 screening calls per request (user prompt + retrieved RAG chunks) modeled at $0.10 / 1,000 requests screened ($0.20 / 1,000 tickets).
- **Networking & Security**: External ALB forwarding rule ($18.25/mo) + Cloud Armor policy & rules ($6.00/mo + $0.75/1M req) + Cloud NAT gateway ($32.85/mo + $0.045/GB) + Private Service Connect endpoint ($7.30/mo). (Dedicated single-workload networking is shown transparently; Shared VPC amortization removes the $64.40/mo fixed base.)
- **Secret Manager + Cloud KMS (CMEK)**: 3 active secrets ($0.18/mo) + 2 CMEK keys ($2.00/mo) + API access operations.
- **Cloud Logging + Monitoring + BigQuery**: Structured audit sink + weekly LLMOps eval queries.

---

## 2. Monthly Cost Comparison Across 3 Enterprise Traffic Tiers

| GCP Service / Line Item | Pilot / Startup (10,000 req/mo) | Growth / Mid-Market (100,000 req/mo) | Enterprise (1,000,000 req/mo) | Calculation Formula / Notes |
| :--- | ---: | ---: | ---: | :--- |
| **Cloud Run v2** (Triage GW + RAG + ADK) | $0.35 | $3.54 | $61.16 | Active compute (`min=0` Pilot/Growth) + 2 warm instances in Enterprise ($25.76) |
| **Vertex AI — Gemini 3.8 Flash** (85% L1) | $5.36 | $53.55 | $535.50 | `0.85 * N * (2400*0.15 + 450*0.60) / 1e6` |
| **Vertex AI — Gemini Pro** (15% L2) | $7.88 | $78.75 | $787.50 | `0.15 * N * (2400*1.25 + 450*5.00) / 1e6` |
| **Vertex AI — text-embedding-005** | $0.04 | $0.38 | $3.75 | `N * 150 tokens * $0.025 / 1e6` |
| **Cloud Firestore (Native + Vector Search)** | $0.41 | $2.32 | $14.16 | `8 reads/req` ($0.06/100k) + `0.2 writes/req` + storage (2/10/50 GB * $0.18) |
| **Cloud DLP (Inspect + De-identify)** | $0.12 | $1.20 | $12.00 | `N * 4 KB = 0.04 / 0.4 / 4.0 GB * $3.00/GB` |
| **Model Armor (Prompt + RAG Screening)** | $2.00 | $20.00 | $200.00 | `2 * N * $0.10 / 1,000 screening calls` |
| **External ALB + Cloud Armor + IAP** | $24.26 | $24.33 | $25.00 | Base LB ($18.25) + Armor policy ($6.00) + $0.75/1M req |
| **Cloud NAT + Private Service Connect** | $40.15 | $40.17 | $40.35 | NAT gateway ($32.85) + PSC endpoint ($7.30) + egress GB |
| **Secret Manager + Cloud KMS (CMEK)** | $2.18 | $2.21 | $2.50 | 2 CMEK keys ($2.00) + 3 secrets ($0.18) + access ops |
| **Cloud Logging + Monitoring + BigQuery** | $1.50 | $4.50 | $24.00 | Ingestion + BQ storage + weekly LLMOps eval queries |
| **Total Estimated Monthly Cost** | **$84.25** | **$230.95** | **$1,705.92** | **Exact sum of all line items above** |
| **Effective Cost per Support Ticket** | **$0.0084** | **$0.0023** | **$0.0017** | Total Monthly Cost / Monthly Requests |

---

## 3. Unit Economics & FinOps Sensitivity

1. **Human Support Cost Comparison**: At an enterprise average of $14.00 per L1 human-handled support ticket and a conservative 62% autonomous deflection rate, **100,000 tickets/month** yields 62,000 deflected tickets = **$868,000/mo gross labor avoidance** against **$230.95/mo** GCP runtime cost.
2. **Why Firestore Vector Search Dominates at Pilot, Growth & Enterprise**: Replacing Firestore Vector Search ($0.41/mo Pilot, $2.32/mo Growth, $14.16/mo Enterprise) with a dedicated **Vertex AI Vector Search** HA index endpoint (~$260/mo always-on baseline) would inflate Pilot infrastructure spend by **+308%** for zero latency benefit under 10M chunks.
3. **Model Routing Lever**: Without Flash/Pro routing (sending 100% of Enterprise 1M req/mo to Gemini Pro), LLM spend jumps from **$1,323.00/mo** to **$5,250.00/mo** (+$3,927/mo, a **3.97x** increase).
4. **Shared VPC Amortization**: Organizations deploying this blueprint onto an existing Enterprise Shared VPC with centralized ALB + Cloud NAT amortize the $64.40/mo networking base across workloads, dropping Pilot marginal cost to **$19.85/mo**.

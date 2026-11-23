# ADR-003: Per-Node Model Routing — Gemini 3.8 Flash vs Gemini Pro

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 01 (Support), Blueprint 02 (Contracts), Blueprint 03 (SQL Analytics)

## Context

Routing 100% of enterprise AI traffic to a frontier reasoning model (**Gemini Pro**) destroys unit economics and inflates P95 latency, whereas routing 100% of traffic to a fast distilled model (**Gemini 3.8 Flash**) degrades accuracy on legally dense contract clauses (indemnification, limitation of liability) and complex multi-CTE SQL window functions.

## Decision Drivers

1. **FinOps Efficiency**: Reduce LLM token spend by **60%–75%** without sacrificing accuracy on high-risk reasoning nodes.
2. **Latency SLOs**: Meet P95 <= 2.8 s for L1 technical support (Blueprint 01) and P95 <= 5.5 s for interactive SQL analytics (Blueprint 03).
3. **Deterministic Escalation**: Routing decisions must be auditable, observable in BigQuery, and tunable via thresholds without code redeployments.

## Considered Options

1. **Option A: Tiered Per-Node Routing (`gemini-3.8-flash` default + `gemini-pro` escalation for high-complexity nodes)**
2. **Option B: Single Frontier Model Everywhere (`gemini-pro` 100%)**
3. **Option C: Single Fast Model Everywhere (`gemini-3.8-flash` 100%)**

## Decision Outcome

**Chosen Option: Option A — Tiered Per-Node Model Routing.**

Each blueprint assigns models per node based on reasoning complexity, risk profile, and latency budget:

| Blueprint & Node | Primary Model | Escalation Model | Traffic Split | Routing Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **BP01: L1 Triage & Grounded RAG** | `gemini-3.8-flash` | `gemini-pro` | **85% Flash / 15% Pro** | Complexity classifier >= 0.70, multi-system incident, or L1 confidence < 0.80 |
| **BP02: Contract Clause Extraction** | `gemini-3.8-flash` | `gemini-pro` | **75% Flash / 25% Pro** | Clause taxonomy tag in `{INDEMNITY, LIABILITY_CAP, IP_OWNERSHIP, CHANGE_OF_CONTROL, NON_COMPETE}` |
| **BP03: Text-to-SQL & Narrative** | `gemini-3.8-flash` | `gemini-pro` | **70% Flash / 30% Pro** | Schema join count >= 3, window functions / YoY cohort math, or self-correction retry |

## Quantitative Trade-off Matrix (Pricing & Latency Baseline)

| Metric | `gemini-3.8-flash` | `gemini-pro` | Cost Ratio (Pro / Flash) |
| :--- | :--- | :--- | :--- |
| **Input Price (per 1M tokens)** | **$0.15** | $1.25 | **8.33x** |
| **Output Price (per 1M tokens)** | **$0.60** | $5.00 | **8.33x** |
| **Time-to-First-Token (TTFT P50)** | **~280 ms** | ~850 ms | 3.0x slower |
| **Throughput (tokens/sec)** | **~145 tok/s** | ~65 tok/s | 2.2x slower |

### Enterprise Monthly LLM Spend Comparison Across All 3 Blueprints

| Blueprint (Enterprise Tier) | 100% Flash | **Tiered Routing (Chosen)** | 100% Pro | Savings vs 100% Pro |
| :--- | ---: | ---: | ---: | ---: |
| **BP01: Support (1M req/mo)** | $630.00 | **$1,323.00** (85/15) | $5,250.00 | **-$3,927.00 / mo (-74.8%)** |
| **BP02: Contracts (50k docs/mo)** | $180.00 | **$576.00** (75/25) | $1,500.00 | **-$924.00 / mo (-61.6%)** |
| **BP03: SQL Agent (250k queries/mo)** | $221.25 | **$708.01** (70/30) | $1,843.75 | **-$1,135.74 / mo (-61.6%)** |
| **Combined Enterprise Portfolio** | $1,031.25 | **$2,607.01** | $8,593.75 | **-$5,986.74 / mo (-69.7%)** |

*(Note: For ultra-high-volume pure binary classification or intent tagging nodes exceeding 10M req/mo, `gemini-3.5-flash-lite` can be inserted as a Tier-0 pre-filter before `gemini-3.8-flash`.)*

## Consequences

- **Positive**: Saves **$5,986.74/month (-69.7%)** at Enterprise scale while preserving frontier accuracy on high-liability legal clauses and complex multi-join SQL queries.
- **Negative**: Requires maintaining prompt templates and golden evaluation sets across two model checkpoints; routing drift must be monitored in BigQuery (`pro_escalation_share` alert).

## Revisit Triggers

1. Re-evaluate routing ratios quarterly whenever Google Cloud releases new Gemini Flash generations whose benchmark accuracy on internal golden sets closes within 1% of Pro on legal/SQL rubrics.
2. Trigger immediate alert if `pro_escalation_share` drifts > +5% above target for 48 consecutive hours.

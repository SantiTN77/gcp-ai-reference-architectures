# Blueprint 01: Enterprise Technical Support Automation

## 1. Executive Summary

This blueprint defines a production-grade, zero-trust **Enterprise Technical Support Automation** architecture on Google Cloud Platform (GCP). It automates Level-1 (L1) ticket triage and knowledge-grounded resolution while orchestrating deterministic Level-2 (L2) escalations into Zendesk and Jira through an **Agent Development Kit (ADK)** tool-calling agent.

Key architectural properties:
- **Zero Idle Cost Compute & Vector Storage**: All stateless API, retrieval, and agent services run on **Cloud Run v2** (`min_instance_count = 0` for pilot/off-peak; optional warm instances for enterprise P99 latency SLAs), paired with **Cloud Firestore Vector Search** ($0 idle baseline; see [ADR-002](../../adrs/ADR-002-firestore-vector-search-vs-vertex-ai-vector-search.md)).
- **Privacy-by-Design LLM Pipeline**: Every inbound ticket passes through **Cloud DLP (Sensitive Data Protection)** inline de-identification and **Model Armor** prompt-injection screening *before* any token reaches **Vertex AI**.
- **Tiered Cost-Optimized Inference**: 85% of routine L1 inquiries route to **Gemini 3.8 Flash**; only the top 15% high-complexity diagnostic or multi-system escalations escalate to **Gemini Pro** (see [ADR-003](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)).
- **Strict Network Egress Governance**: Outbound calls to Zendesk and Jira traverse **Direct VPC Egress** and **Cloud NAT** with static allowlisted IP addresses; all Google API calls stay on Google's private backbone via **Private Service Connect (PSC)** inside a **VPC Service Controls (VPC-SC)** perimeter.

---

## 2. Business SLA & Technical SLO Targets

| Metric | Target SLO | Measurement Window | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **API Availability** | 99.95% | Rolling 30 days | Multi-zone Cloud Run v2 + External ALB health checks |
| **L1 Grounded Resolution Latency (P95)** | <= 2.8 s | Rolling 7 days | Gemini 3.8 Flash streaming + Firestore composite vector index |
| **L2 Escalation Latency (P95)** | <= 6.5 s | Rolling 7 days | Gemini Pro + bounded 3-step ADK tool loop (5s timeout/tool) |
| **L1 Autonomous Deflection Rate** | >= 62% | Monthly | Confidence threshold >= 0.80 + citation grounding verification |
| **PII Leakage to LLM Rate** | 0.00% | Continuous | Mandatory synchronous Cloud DLP gate (fail-closed on DLP error) |
| **Grounded Citation Fidelity** | >= 96% | Weekly eval batch | Automated Vertex AI Eval / NLI entailment check in BigQuery |
| **Idle Infrastructure Cost** | $0.00 / mo | Pilot / Non-prod | Cloud Run `min_instances = 0` + Firestore serverless vector index |

---

## 3. Network & Security Architecture

> Source: [architecture-diagram.mmd](./architecture-diagram.mmd)

```mermaid
flowchart TB
    subgraph External["External Channels & SaaS Ticketing"]
        Channels["Omnichannel Clients\n(Web Widget via Vercel BFF / Slack / Email)"]
        SaaS["Zendesk & Jira Cloud\n(Allowlisted Static Egress IP)"]
    end

    subgraph Edge["GCP Edge Security Perimeter"]
        GLB["External Application Load Balancer\n(TLS 1.3 / Managed SSL)"]
        Armor["Cloud Armor WAF\n(OWASP CRS / IP Rate Limit 600 rpm)"]
        AuthEdge["WIF OIDC / Webhook HMAC / IAP\n(External BFF OIDC + Internal Ops IAP)"]
    end

    subgraph VPC["Enterprise Shared VPC (10.20.0.0/16) — VPC Service Controls Perimeter"]
        subgraph SubAPI["Private Subnet: api-subnet (10.20.1.0/24)"]
            GW["Cloud Run v2: Support Triage API\n(SA: sa-support-gw | min=0, max=20)"]
        end

        subgraph SubAgent["Private Subnet: agent-subnet (10.20.2.0/24)"]
            RAG["Cloud Run v2: Vector RAG Retriever\n(SA: sa-rag-reader | Read-Only Firestore IAM)"]
            ADK["Cloud Run v2: ADK Triage & Escalation Agent\n(SA: sa-support-agent | Internal Ingress Only)"]
        end

        subgraph SubEgress["Egress & Private Google Access (10.20.3.0/24)"]
            NAT["Cloud Router + Cloud NAT + Secure Web Proxy\n(Static IP + Zendesk/Jira FQDN Allowlist)"]
            PSC["Private Service Connect (PSC)\n(Private Google APIs Endpoint)"]
        end
    end

    subgraph DataAI["Managed GCP AI, Privacy, Data & Security Services (via PSC)"]
        DLP["Cloud DLP (Sensitive Data Protection)\n(Inline PII Redaction & Surrogate Tokenization)"]
        ModelArmor["Model Armor\n(Prompt & Retrieved Chunk Injection Screening)"]
        Firestore["Cloud Firestore (Native + Vector Search)\n(768-dim Embeddings + Tenant Metadata Filter)"]
        VertexFlash["Vertex AI: Gemini 3.8 Flash\n(L1 Triage & Grounded RAG — 85% Traffic)"]
        VertexPro["Vertex AI: Gemini Pro\n(L2 Complex Diagnostics — 15% Traffic)"]
        VertexEmbed["Vertex AI: text-embedding-005\n(Query & KB Chunk Embeddings)"]
        SecretMgr["Secret Manager\n(Zendesk/Jira OAuth Tokens)"]
        KMS["Cloud KMS (CMEK)\n(90-Day Auto-Rotation Keys)"]
        Obs["Cloud Logging + Monitoring + BigQuery\n(Audit Logs & LLMOps Telemetry Sink)"]
    end

    Channels -->|"HTTPS TLS 1.3"| GLB
    GLB --> Armor
    Armor --> AuthEdge
    AuthEdge -->|"Verified Tenant JWT"| GW

    GW -->|"1. Private PSC (DLP & Model Armor)"| PSC
    PSC --> DLP
    PSC --> ModelArmor
    GW -->|"2. Retrieve Tenant KB Chunks"| RAG
    RAG -->|"3. Private PSC"| PSC
    PSC --> VertexEmbed
    PSC --> Firestore
    GW -->|"4. Screened Prompt + Screened Chunks"| ADK

    ADK -->|"L1 Triage (85%)"| VertexFlash
    ADK -->|"L2 Escalation (15%)"| VertexPro
    ADK -->|"Fetch API Secret"| SecretMgr
    ADK -->|"Direct VPC Egress"| NAT
    NAT -->|"mTLS / OAuth2"| SaaS

    KMS -.->|"CMEK Encrypt"| Firestore
    KMS -.->|"CMEK Encrypt"| SecretMgr
    GW -.->|"Structured Audit"| Obs
    ADK -.->|"Token & Latency Metrics"| Obs
```

### IAM Least-Privilege Matrix

| Service Account | Attached Service | Granted Roles (Scoped to Resource) | Explicitly Denied / Absent |
| :--- | :--- | :--- | :--- |
| `sa-support-gw` | Cloud Run Triage API | `roles/dlp.user`, `roles/modelarmor.user`, `roles/run.invoker` (on RAG & ADK only), `roles/logging.logWriter` | No Firestore read, no Secret Manager access, no direct internet egress |
| `sa-rag-reader` | Cloud Run Hybrid RAG | `roles/datastore.viewer` (read-only), `roles/aiplatform.user` (embedding endpoint only) | No Firestore write/delete, no Secret Manager, no external egress |
| `sa-support-agent` | Cloud Run ADK Agent | `roles/aiplatform.user`, `roles/secretmanager.secretAccessor` (scoped to `zendesk-oauth`, `jira-token` only), `roles/logging.logWriter` | No Firestore write, no IAM admin, no BigQuery read |

---

## 4. Runtime Request & Security Sequence

> Source: [sequence-diagram.mmd](./sequence-diagram.mmd)

```mermaid
sequenceDiagram
    autonumber
    actor User as Enterprise Customer
    participant Edge as Cloud Armor + WIF/IAP Edge
    participant GW as Cloud Run Triage API
    participant DLP as Cloud DLP (via PSC)
    participant MA as Model Armor (via PSC)
    participant RAG as Vector RAG + Firestore
    participant ADK as ADK Triage & Escalation Agent
    participant LLM as Vertex AI (Flash / Pro)
    participant Ticketing as Zendesk / Jira (NAT + SWP)
    participant Audit as Cloud Logging + BigQuery

    User->>Edge: Submit support ticket (HTTPS + Tenant JWT / BFF OIDC)
    Edge->>Edge: Evaluate WAF rules, IP rate limits, verify JWT/HMAC
    Edge->>GW: Forward authenticated request (X-Tenant-ID, Request-ID)

    GW->>DLP: content.deidentify(ticket_text, InfoTypes: PII/PCI)
    DLP-->>GW: Redacted text + ephemeral surrogate map

    GW->>MA: sanitizeUserPrompt(redacted_text)
    alt Prompt Injection Detected
        MA-->>GW: BLOCK (Confidence >= 0.85)
        GW->>Audit: Log security event (OWASP LLM01)
        GW-->>User: 400 Safe fallback message
    else Prompt Safe
        MA-->>GW: ALLOW
        GW->>RAG: Retrieve top-8 KB chunks (tenant_id + product_tier filter)
        RAG->>RAG: Embed query (text-embedding-005) + Firestore find_nearest()
        RAG-->>GW: Ranked grounded chunks + citations

        GW->>MA: sanitizeModelInput(retrieved_chunks)
        MA-->>GW: ALLOW (Indirect injection check passed)

        GW->>ADK: Invoke ADK Agent (OIDC IAM, redacted_text, screened_chunks)
        ADK->>LLM: Route to Gemini 3.8 Flash (L1 85%) or Gemini Pro (L2 15%)
        LLM-->>ADK: Draft response + confidence score + tool_call (if escalation)

        alt Confidence >= 0.80 (L1 Deflection)
            ADK->>Audit: Emit latency, tokens, citations, deflection=true
            ADK-->>GW: Grounded answer with KB citations
            GW-->>User: Grounded answer with KB citations
        else Confidence < 0.80 or Escalation Tool Requested
            ADK->>Ticketing: Create/update Zendesk & Jira issue via Cloud NAT + SWP
            Ticketing-->>ADK: Ticket ID (ZD-48219 / SUP-1042)
            ADK->>Audit: Emit escalation telemetry + tool audit record
            ADK-->>GW: Escalation summary + Ticket ID
            GW-->>User: Ticket created (ZD-48219) with diagnostic summary
        end
    end
```

---

## 5. Failure Modes & Resilience Patterns

| Failure Scenario | Blast Radius | Automated Mitigation | Recovery SLO |
| :--- | :--- | :--- | :--- |
| **Cloud DLP API timeout / 5xx** | Inbound triage halted | **Fail-closed** — never bypass DLP. Retry with exponential backoff (200ms, 500ms); after 2 retries, queue ticket to human Zendesk queue without LLM invocation. | < 2s fallback |
| **Vertex AI 429 Quota / Regional Degradation** | LLM synthesis degraded | Cross-region fallback (`us-central1` -> `us-east4`) with circuit breaker (open after 5 consecutive 5xx in 30s). | < 5s failover |
| **Firestore Vector Index Cold Latency** | Slight P95 spike | Pre-filter by `tenant_id` and `product_tier` composite index to restrict ANN search space to < 50k vectors per tenant. | P95 < 180ms |
| **Zendesk / Jira API Outage** | L2 escalation delayed | ADK escalation tool writes idempotent retry payload (`idempotency_key = sha256(ticket_id)`) to dead-letter Cloud Tasks queue with backoff up to 24h. | Zero ticket loss |
| **LLM Hallucination / Low Grounding** | Incorrect user guidance | Mandatory confidence threshold (`>= 0.80`) + strict citation regex check against retrieved Firestore document IDs; failing responses auto-escalate to L2. | 100% gated |

---

## 6. Observability & LLMOps KPIs

All Cloud Run services emit structured JSON logs to **Cloud Logging** with a BigQuery Log Sink (`llmops_support_events`) partitioned by `event_date` and clustered by `tenant_id`, `model_tier`:

- **Operational Metrics (Cloud Monitoring)**: Request rate, error rate (4xx/5xx), Cloud Run cold-start ratio, P50/P95/P99 latency per microservice, Cloud NAT port utilization.
- **LLMOps Metrics (BigQuery)**:
  - `deflection_rate = COUNTIF(escalated = FALSE) / COUNT(*)`
  - `cost_per_resolved_ticket = SUM(dlp_cost + embed_cost + llm_cost) / COUNTIF(escalated = FALSE)`
  - `pro_escalation_share` (target <= 15%; alerts if > 20% indicating prompt drift)
  - `model_armor_block_rate` (security anomaly alert if > 2% of tenant traffic)
- **Related Artifacts**:
  - [Monthly GCP Cost Estimation](./cost-estimation.md)
  - [STRIDE & OWASP LLM Top 10 Threat Model](./security-threat-model.md)
  - [ADR-001: Cloud Run over GKE](../../adrs/ADR-001-cloud-run-over-gke.md)
  - [ADR-002: Firestore Vector Search vs Vertex AI Vector Search](../../adrs/ADR-002-firestore-vector-search-vs-vertex-ai-vector-search.md)
  - [ADR-003: Gemini Flash vs Pro Model Routing](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)
  - [ADR-004: Cloud DLP Sensitive Data Anonymization](../../adrs/ADR-004-cloud-dlp-sensitive-data-anonymization.md)

# Blueprint 03: Internal Enterprise Agent Connected to SQL Databases

## 1. Executive Summary

This blueprint defines a zero-trust, read-only **Internal Enterprise SQL Analytics Agent** on GCP that lets finance, operations, and BI teams query **Cloud SQL for PostgreSQL** and **BigQuery** in natural language — without ever exposing raw database credentials, risking destructive DDL/DML execution, leaking cross-department rows, or triggering runaway BigQuery scan bills.

Key architectural properties:
- **Standardized MCP Read-Only Tool Server**: Database access is strictly isolated inside a dedicated **Model Context Protocol (MCP)** server running on private **Cloud Run v2** (`sa-mcp-sql-ro`; see [ADR-006](../../adrs/ADR-006-mcp-and-a2a-enterprise-agent-interoperability.md)). The ADK agent has **zero direct network or IAM path** to Cloud SQL or BigQuery.
- **Deterministic SQL AST Guardrails (Zero LLM Trust)**: Every LLM-generated query is parsed into an Abstract Syntax Tree (AST) before touching any database. Anything other than a single `SELECT` / `WITH ... SELECT` against allowlisted semantic views is hard-blocked; `LIMIT 500` and `statement_timeout = 8s` are injected deterministically.
- **Identity Propagation & Row-Level Security (RLS)**: Verified **Identity-Aware Proxy (IAP)** user claims (`email`, `department`) are propagated into PostgreSQL `SET LOCAL app.user_dept` inside a `BEGIN TRANSACTION READ ONLY` block and into BigQuery Row Access Policies — eliminating confused-deputy data leaks.
- **Query Cost Dry-Run Gate & Output PII Scrubbing**: BigQuery queries execute `dryRun = true` first and reject any scan > 10 GB; outbound SQL rows pass through **Cloud DLP** to scrub unexpected PII embedded in free-text note columns before reaching Vertex AI synthesis.

---

## 2. Business SLA & Technical SLO Targets

| Metric | Target SLO | Measurement Window | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Analytics Agent Availability** | 99.90% (Business Hours) | Rolling 30 days | Cloud Run v2 + Cloud SQL HA Read Replica + BigQuery |
| **End-to-End Query Latency (P95)** | <= 5.5 s | Rolling 7 days | Gemini 3.8 Flash (70% queries) + 8s SQL statement timeout |
| **Destructive SQL Execution Rate (DDL/DML)** | 0.00% (Hard Zero) | Continuous | Triple barrier: SQL AST parser + `READ ONLY` tx + DB read-only role |
| **Cross-Department RLS Leakage** | 0.00% (Hard Zero) | Continuous | IAP JWT propagation + DB-native RLS & BigQuery Row Access Policies |
| **Max Single-Query BigQuery Scan** | <= 10 GB ($0.05 cap) | Per query | Mandatory BigQuery `dryRun = true` gate in MCP server |
| **SQL Execution Accuracy (Valid & Correct)** | >= 93% | Bi-weekly golden set | Semantic catalog grounding + 1 automated syntax self-correction retry |

---

## 3. Network & Security Architecture

> Source: [architecture-diagram.mmd](./architecture-diagram.mmd)

```mermaid
flowchart TB
    subgraph Users["Internal Enterprise Users"]
        Analyst["BI / Finance / Ops Analysts\n(Corporate SSO / Okta / Google Workspace)"]
    end

    subgraph Edge["Zero-Trust Internal Access Perimeter"]
        GLB["Application Load Balancer\n(TLS 1.3 / Internal or IAP-Protected)"]
        Armor["Cloud Armor\n(Corporate IP Allowlist + Edge Rate Limit)"]
        IAP["Identity-Aware Proxy (IAP)\n(Google-Signed X-Goog-IAP-JWT-Assertion)"]
    end

    subgraph VPC["Enterprise Shared VPC (10.40.0.0/16) — VPC Service Controls Perimeter"]
        subgraph SubAgent["Private Subnet: agent-subnet (10.40.1.0/24)"]
            ADK["Cloud Run v2: ADK SQL Analytics Agent\n(SA: sa-sql-agent | Untrusted Planning Plane | min=0)"]
        end

        subgraph SubMCP["Private Subnet: mcp-subnet (10.40.2.0/24)"]
            MCP["Cloud Run v2: MCP Read-Only SQL Server\n(SA: sa-mcp-sql-ro | IAP JWT Verify + AST + Dry-Run + RLS)"]
        end

        subgraph SubNet["Private Data Connectivity (10.40.3.0/24)"]
            PSC["Private Service Connect (PSC)\n(Private SQL & Google APIs)"]
        end
    end

    subgraph DataAI["Private Databases, Privacy, Vertex AI & Governance Plane (via PSC)"]
        CloudSQL["Cloud SQL for PostgreSQL (Read Replica)\n(Private IP Only | IAM Auth + PostgreSQL RLS)"]
        BQ["BigQuery Analytical Warehouse\n(Row Access Policies + 10 GB Dry-Run Cap)"]
        DLP["Cloud DLP (Sensitive Data Protection)\n(SQL Result Row PII Scrubbing via PSC)"]
        VertexFlash["Vertex AI: Gemini 3.8 Flash\n(Standard KPIs & Summarization — 70% Queries)"]
        VertexPro["Vertex AI: Gemini Pro\n(Complex Multi-CTE & Window SQL — 30% Queries)"]
        ModelArmor["Model Armor\n(Prompt & SQL-Injection Intent Screening)"]
        SecretMgr["Secret Manager\n(Directory Lookup OAuth Config)"]
        KMS["Cloud KMS (CMEK)\n(Cloud SQL & BigQuery Encryption)"]
        Audit["Cloud Audit Logs + Cloud Logging\n(Immutable SQL + Identity + Cost Ledger)"]
    end

    Analyst -->|"HTTPS + SSO"| GLB
    GLB --> Armor
    Armor --> IAP
    IAP -->|"Signed IAP JWT Header"| ADK

    ADK -->|"1. Screen Prompt (PSC)"| ModelArmor
    ADK -->|"2. Generate SQL Plan (70%)"| VertexFlash
    ADK -->|"2. Complex SQL Plan (30%)"| VertexPro

    ADK -->|"3. MCP execute_readonly_sql (Forwards Signed IAP JWT Header)"| MCP
    MCP -->|"4. Private PSC"| PSC
    PSC -->|"READ ONLY Tx + set_config RLS"| CloudSQL
    PSC -->|"Dry-Run <= 10GB + Row Policy"| BQ
    MCP -->|"5. Scrub Result Rows (PSC)"| DLP
    MCP -->|"6. Resolve Email -> Dept"| SecretMgr

    KMS -.->|"CMEK Encrypt"| CloudSQL
    KMS -.->|"CMEK Encrypt"| BQ
    ADK -->|"Agent Trace"| Audit
    MCP -->|"Executed SQL + Bytes Scanned"| Audit
```

### IAM Least-Privilege Matrix

| Service Account | Attached Service | Granted Roles (Scoped to Resource) | Explicitly Denied / Absent |
| :--- | :--- | :--- | :--- |
| `sa-sql-agent` | Cloud Run ADK Agent | `roles/aiplatform.user`, `roles/modelarmor.user`, `roles/run.invoker` (on MCP server only) | **Zero** Cloud SQL IAM, **zero** BigQuery IAM, **zero** Secret Manager access |
| `sa-mcp-sql-ro` | Cloud Run MCP Server | `roles/cloudsql.client` + `roles/cloudsql.instanceUser` (DB role `analytics_ro` with `SELECT` on views only), `roles/bigquery.jobUser` + `roles/bigquery.dataViewer` (curated dataset only), `roles/dlp.user`, `roles/secretmanager.secretAccessor` (directory OAuth config only) | No `INSERT`/`UPDATE`/`DELETE`/`DROP`, no raw operational tables, no internet egress |

---

## 4. Runtime Request & Security Sequence

> Source: [sequence-diagram.mmd](./sequence-diagram.mmd)

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Finance Analyst (alice@corp.com)
    participant IAP as Cloud Armor + IAP
    participant ADK as Cloud Run ADK SQL Agent
    participant MA as Model Armor (via PSC)
    participant LLM as Vertex AI (Flash / Pro)
    participant MCP as Cloud Run MCP SQL Server
    participant DB as Cloud SQL (RO) / BigQuery
    participant DLP as Cloud DLP (via PSC)
    participant Audit as Cloud Audit Logs

    Analyst->>IAP: "Show Q3 EMEA margin by product line"
    IAP->>IAP: Verify Corporate OIDC & sign X-Goog-IAP-JWT-Assertion
    IAP->>ADK: Forward request + signed IAP JWT header

    ADK->>MA: sanitizeUserPrompt(question)
    MA-->>ADK: ALLOW

    ADK->>MCP: MCP get_authorized_schema (HTTP Header: X-Goog-IAP-JWT-Assertion)
    MCP->>MCP: Verify IAP JWT signature + aud, resolve email -> dept (EMEA_FINANCE)
    MCP-->>ADK: Allowlisted views & column semantic catalog

    ADK->>LLM: Generate parameterized SQL (Gemini 3.8 Flash or Gemini Pro)
    LLM-->>ADK: Candidate SQL query

    ADK->>MCP: MCP execute_readonly_sql(sql) + signed IAP JWT header
    MCP->>MCP: 1. Re-verify IAP JWT, enforce per-user quota (30 qpm / 50 GB/day)
    MCP->>MCP: 2. Parse SQL AST (single SELECT, block pg_sleep/DDL/DML, auto LIMIT 500)
    alt AST Violation (DROP / UPDATE / pg_sleep / Forbidden Table)
        MCP->>Audit: Log BLOCKED_SQL_VIOLATION (verified_email, raw_sql)
        MCP-->>ADK: 403 Read-only policy violation
    else AST Valid
        MCP->>DB: 3. Dry-Run cost check (BQ <= 10 GB) / EXPLAIN cost <= 50k (Cloud SQL)
        alt Cost Cap Exceeded
            MCP->>Audit: Log BLOCKED_COST_CAP (bytes_estimated)
            MCP-->>ADK: 422 Query exceeds 10 GB guardrail - narrow date filter
        else Within Guardrails
            MCP->>DB: 4. BEGIN READ ONLY + SELECT set_config('app.user_dept', $1, true)
            DB-->>MCP: Bounded result set (<= 500 rows)
            MCP->>DLP: content.deidentify(result_rows, InfoTypes: PII)
            DLP-->>MCP: Scrubbed result rows
            MCP->>Audit: Log SQL, verified_email, rows_returned, bytes_scanned, duration_ms
            MCP-->>ADK: Scrubbed table + SQL citation
            ADK->>LLM: Synthesize executive narrative + chart spec
            LLM-->>ADK: Grounded answer + exact SQL used
            ADK-->>Analyst: Verified analytics answer, table, & auditable SQL
        end
    end
```

---

## 5. Failure Modes & Resilience Patterns

| Failure Scenario | Blast Radius | Automated Mitigation | Recovery SLO |
| :--- | :--- | :--- | :--- |
| **LLM Generates Invalid SQL Syntax** | Single analyst query | MCP server returns structured PostgreSQL/BigQuery parse error; ADK agent executes max **1 bounded self-correction retry** before returning helpful clarification prompt. | < 3 s retry |
| **Expensive Full-Table BigQuery Scan** | FinOps budget | Mandatory `dryRun = true` check rejects any query > 10 GB before execution and advises analyst to add a partition date filter (`WHERE event_date >= ...`). | 0 bytes billed |
| **Cloud SQL Read Replica CPU Saturation** | Slow operational queries | Connection pool cap (`max_connections = 20` per Cloud Run instance) + `statement_timeout = 8000ms` + automatic fallback notice directing heavy historical queries to BigQuery. | Primary DB 100% isolated |
| **Unstructured Column Contains Unexpected PII** | Data governance | Synchronous **Cloud DLP** scans serialized SQL result rows before returning them to ADK or rendering to the analyst. | 100% scrubbed |

---

## 6. Observability & LLMOps KPIs

- **Governance & Audit (Cloud Audit Logs + Cloud Logging)**: Every executed SQL statement is logged alongside `user_email`, `user_dept`, `ast_verified = true`, `bytes_scanned`, `rows_returned`, and `dlp_redactions_count`.
- **Analytics Quality KPIs**:
  - `first_pass_sql_valid_rate` (target >= 93%)
  - `ast_blocked_attempts` (security alert on any DML/DDL attempt)
  - `avg_bq_mb_per_query` (FinOps efficiency metric)
- **Related Artifacts**:
  - [Monthly GCP Cost Estimation](./cost-estimation.md)
  - [STRIDE & OWASP LLM Top 10 Threat Model](./security-threat-model.md)
  - [ADR-001: Cloud Run over GKE](../../adrs/ADR-001-cloud-run-over-gke.md)
  - [ADR-005: Private IAM OIDC & VPC Isolation](../../adrs/ADR-005-private-iam-oidc-and-vpc-isolation.md)
  - [ADR-006: MCP & A2A Enterprise Agent Interoperability](../../adrs/ADR-006-mcp-and-a2a-enterprise-agent-interoperability.md)

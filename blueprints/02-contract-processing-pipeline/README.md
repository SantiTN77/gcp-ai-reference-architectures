# Blueprint 02: Enterprise Contract Processing & Risk Extraction Pipeline

## 1. Executive Summary

This blueprint defines a fully asynchronous, event-driven **Enterprise Contract Processing & Risk Extraction Pipeline** on GCP for legal, procurement, and compliance teams. It ingests multi-page counterparty PDFs (MSAs, DPAs, SOWs, NDAs), extracts structured clause hierarchies via **Document AI**, applies **Cloud DLP deterministic format-preserving tokenization** to protect PII and financial identifiers, and performs tiered legal risk analysis using **Gemini 3.8 Flash** and **Gemini Pro** inside a **VPC Service Controls (VPC-SC)** perimeter.

Key architectural properties:
- **Zero Idle Cost Event-Driven Execution**: **Cloud Storage + Eventarc + Cloud Workflows + Cloud Run Jobs** scale strictly to zero between contract batches — zero always-on VMs, zero idle GKE nodes, zero polling daemons.
- **Deterministic Tokenization Over Destructive Masking**: Using **Cloud DLP `CRYPTO_DETERMINISTIC`** wrapped with a **Cloud KMS (CMEK)** key preserves entity coreference (e.g., `[PARTY_A_9f2a]` remains consistent across 40 pages so Gemini Pro can accurately analyze obligations) without exposing real names, tax IDs, or bank accounts to the LLM (see [ADR-004](../../adrs/ADR-004-cloud-dlp-sensitive-data-anonymization.md)).
- **Tiered Legal Inference Routing**: 75% of contract clauses (dates, renewal windows, payment terms, governing law) are extracted by **Gemini 3.8 Flash**; only the 25% legally dense clauses (indemnification, limitation of liability, IP assignment, change of control) escalate to **Gemini Pro** (see [ADR-003](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)).
- **Immutable Compliance Lineage**: Every extraction writes an append-only audit record into **BigQuery** containing contract SHA-256, Document AI page bounding boxes, DLP finding counts, model version IDs, and clause-level risk rationales.

---

## 2. Business SLA & Technical SLO Targets

| Metric | Target SLO | Measurement Window | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **End-to-End Processing Latency (20-page PDF, P95)** | <= 45 s | Rolling 30 days | Parallel Document AI layout + concurrent Cloud Run Job clause batches |
| **Pipeline Delivery Durability** | 99.99% (Zero lost PDFs) | Rolling 90 days | GCS Object Versioning + Cloud Workflows durable retries + DLQ |
| **High-Risk Clause Recall (Indemnity / Liability)** | >= 98.5% | Monthly legal QA | Gemini Pro rubric extraction + mandatory negative-clause verification |
| **PII / Financial ID Exposure to LLM** | 0.00% | Continuous | Mandatory Cloud Workflows DLP gate before Cloud Run Job dispatch |
| **Adversarial PDF Injection Detection** | >= 99.0% | Continuous | Model Armor inspection on extracted Document AI text (catches hidden white text) |
| **Idle Infrastructure Cost** | $0.00 / mo (compute) | Off-hours / weekends | Cloud Run Jobs + Workflows + Eventarc pay-per-execution |

---

## 3. Network & Security Architecture

> Source: [architecture-diagram.mmd](./architecture-diagram.mmd)

```mermaid
flowchart TB
    subgraph Ingestion["Legal Ingestion & Downstream CLM"]
        LegalUpload["Legal Portal / CLM Upload\n(PDF via Signed URL)"]
        CLM["Enterprise CLM & Legal Slack\n(Risk Alert Webhook)"]
    end

    subgraph VPC["Enterprise VPC (10.30.0.0/16) — VPC Service Controls Perimeter"]
        subgraph SubOrch["Event & GCS Staging Plane (Pointers Only in Workflows)"]
            GCSRaw["Cloud Storage: contracts-raw\n(CMEK + Object Versioning + Retention)"]
            GCSParsed["Cloud Storage: contracts-parsed\n(DocAI Layout JSON — Avoids 512KB WF Limit)"]
            GCSToken["Cloud Storage: contracts-tokenized\n(Post-DLP + Post-Model-Armor Clauses Only)"]
            Eventarc["Eventarc Trigger\n(storage.object.v1.finalized)"]
            Workflows["Cloud Workflows\n(SA: sa-contract-orch | Orchestrates GCS URIs Only)"]
        end

        subgraph SubCompute["Private Serverless Compute (10.30.2.0/24)"]
            JobGate["Cloud Run Job: Chunked DLP & Model Armor Gate\n(SA: sa-contract-dlp-gate | <= 500KB Chunks)"]
            JobExtract["Cloud Run Job: Clause & Risk Extractor\n(SA: sa-contract-worker | Reads contracts-tokenized Only)"]
            JobNotify["Cloud Run Service: CLM Notifier\n(SA: sa-clm-notifier | Internal Ingress)"]
        end

        subgraph SubNet["Private Network & Egress (10.30.3.0/24)"]
            PSC["Private Service Connect (PSC)\n(Private Google APIs Access)"]
            NAT["Cloud Router + Cloud NAT\n(Static Allowlisted Egress IP)"]
        end
    end

    subgraph DataAI["Managed GCP Document, Privacy, AI & Governance Plane (via PSC)"]
        DocAI["Document AI\n(Batch Layout Parser -> GCS contracts-parsed)"]
        DLP["Cloud DLP (Sensitive Data Protection)\n(Per-Contract Tweak CRYPTO_DETERMINISTIC FPE)"]
        ModelArmor["Model Armor\n(Indirect Prompt Injection Screening on PDF Text)"]
        VertexFlash["Vertex AI: Gemini 3.8 Flash\n(Standard Clauses & Metadata — 75% Clauses)"]
        VertexPro["Vertex AI: Gemini Pro\n(Indemnification / Liability / IP — 25% Clauses)"]
        BQ["BigQuery Audit Ledger\n(Append-Only via Cloud Logging Sink)"]
        KMS["Cloud KMS (CMEK)\n(Buckets, BQ, & DLP Wrapping Keys)"]
        SecretMgr["Secret Manager\n(CLM Webhook Signing Secrets)"]
        Obs["Cloud Logging + Monitoring\n(Immutable Sink -> BQ & Pipeline SLA)"]
    end

    LegalUpload -->|"HTTPS mTLS / Signed URL"| GCSRaw
    GCSRaw -->|"Object Finalized"| Eventarc
    Eventarc -->|"GCS URI Pointer"| Workflows

    Workflows -->|"1. Batch Parse (GCS URI)"| DocAI
    DocAI -->|"Write Layout JSON"| GCSParsed
    Workflows -->|"2. Trigger DLP/MA Gate"| JobGate
    JobGate -->|"Read Parsed JSON"| GCSParsed
    JobGate -->|"Chunked DLP & MA via PSC"| PSC
    PSC --> DLP
    PSC --> ModelArmor
    JobGate -->|"Write Clean Tokenized JSON"| GCSToken

    Workflows -->|"3. Trigger Risk Extractor"| JobExtract
    JobExtract -->|"Read Tokenized Only"| GCSToken
    JobExtract -->|"PSC Private"| PSC
    PSC --> VertexFlash
    PSC --> VertexPro
    JobExtract -->|"4. Append Audit Log"| Obs
    Obs -->|"Immutable Log Sink"| BQ

    Workflows -->|"5. High-Risk Alert"| JobNotify
    JobNotify -->|"Fetch Signing Secret"| SecretMgr
    JobNotify -->|"Direct VPC Egress"| NAT
    NAT -->|"Signed Webhook"| CLM

    KMS -.->|"CMEK Encrypt"| GCSRaw
    KMS -.->|"CMEK Encrypt"| GCSParsed
    KMS -.->|"CMEK Encrypt"| GCSToken
    KMS -.->|"CMEK Encrypt"| BQ
    KMS -.->|"Wrap Token Key"| DLP
```

### IAM Least-Privilege Matrix

| Service Account | Attached Service | Granted Roles (Scoped to Resource) | Explicitly Denied / Absent |
| :--- | :--- | :--- | :--- |
| `sa-contract-orch` | Cloud Workflows | `roles/documentai.apiUser`, `roles/run.invoker` (DLP Gate, Worker & Notifier only) | Never holds document bytes in memory (URI pointers only); no Secret Manager, no BQ write |
| `sa-contract-dlp-gate` | Cloud Run Job (DLP/MA Gate) | `roles/storage.objectViewer` (`contracts-parsed`), `roles/storage.objectCreator` (`contracts-tokenized`), `roles/dlp.user`, `roles/modelarmor.user`, `roles/logging.logWriter` | Cannot call Vertex AI, cannot read `contracts-raw`, cannot update/delete BigQuery |
| `sa-contract-worker` | Cloud Run Job (Risk Extractor) | `roles/storage.objectViewer` (`contracts-tokenized` only), `roles/aiplatform.user`, `roles/logging.logWriter` (feeds immutable Cloud Logging -> BigQuery Sink) | Cannot read `contracts-raw` or `contracts-parsed`; **zero `bigquery.tables.updateData`/`delete` IAM** (truly append-only ledger!) |
| `sa-clm-notifier` | Cloud Run Notifier | `roles/secretmanager.secretAccessor` (`clm-webhook-hmac` only), `roles/logging.logWriter` | Cannot read GCS, BigQuery, or Vertex AI |

---

## 4. Runtime Request & Security Sequence

> Source: [sequence-diagram.mmd](./sequence-diagram.mmd)

```mermaid
sequenceDiagram
    autonumber
    actor Counsel as Legal Operations / CLM
    participant GCS as GCS (raw / parsed / tokenized)
    participant EA as Eventarc
    participant WF as Cloud Workflows (GCS URIs Only)
    participant DocAI as Document AI (Batch Layout)
    participant Gate as Cloud Run Job (DLP + MA Gate)
    participant DLP as Cloud DLP (Per-Doc FPE)
    participant MA as Model Armor
    participant Job as Cloud Run Job (Risk Extractor)
    participant LLM as Vertex AI (Flash / Pro)
    participant BQ as Cloud Logging Sink -> BigQuery
    participant CLM as CLM Webhook (via Cloud NAT)

    Counsel->>GCS: Upload contract PDF to contracts-raw (object CRC32C / generation)
    GCS->>EA: Emit storage.object.v1.finalized event
    EA->>WF: Trigger durable workflow (idempotency_key = object_generation)

    WF->>DocAI: BatchProcessDocuments(raw_uri -> contracts-parsed URI)
    DocAI->>GCS: Write full clause hierarchy & bounding boxes to contracts-parsed
    DocAI-->>WF: Operation SUCCEEDED (parsed_uri pointer < 1 KB)

    WF->>Gate: Launch Chunked DLP & Model Armor Gate (parsed_uri)
    Gate->>GCS: Stream contracts-parsed JSON in <= 400 KB chunks
    Gate->>DLP: content.deidentify(chunk, CRYPTO_DETERMINISTIC + per-doc tweak)
    DLP-->>Gate: Tokenized clauses (PII/EIN/IBAN replaced, no cross-doc linkability)
    Gate->>MA: sanitizeModelInput(tokenized_chunks)

    alt Adversarial PDF Injection Detected
        MA-->>Gate: FLAG_QUARANTINE (Hidden white-text override detected)
        Gate->>BQ: Emit immutable QUARANTINED audit log -> BigQuery Sink
        Gate-->>WF: Status = QUARANTINED
        WF->>CLM: Dispatch Security Quarantine webhook via Cloud NAT
    else Document Clean
        MA-->>Gate: ALLOW
        Gate->>GCS: Write clean tokenized payload to contracts-tokenized
        Gate-->>WF: Status = CLEAN (tokenized_uri)

        WF->>Job: Trigger Risk Extractor Job (tokenized_uri)
        Job->>GCS: Read contracts-tokenized ONLY (IAM denied on contracts-raw)
        Job->>LLM: Route 75% standard clauses -> Gemini 3.8 Flash
        LLM-->>Job: Extracted dates, renewal, payment terms (JSON)
        Job->>LLM: Route 25% high-risk clauses -> Gemini Pro
        LLM-->>Job: Liability cap, indemnification, IP risk rubric (JSON)
        Job->>BQ: Emit immutable audit record (Cloud Logging -> BigQuery Sink)
        Job-->>WF: Extraction complete (overall_risk = HIGH / MEDIUM / LOW)

        alt overall_risk == HIGH
            WF->>CLM: Invoke Cloud Run Notifier -> Signed webhook via Cloud NAT
            CLM-->>WF: 200 OK (Legal review task created)
        end
    end
```

---

## 5. Failure Modes & Resilience Patterns

| Failure Scenario | Blast Radius | Automated Mitigation | Recovery SLO |
| :--- | :--- | :--- | :--- |
| **Corrupted / Password-Protected PDF** | Single contract | Document AI returns structured `INVALID_ARGUMENT`; Cloud Workflows catches non-retryable error, writes `FAILED_UNREADABLE` to BigQuery, and notifies Legal Ops via CLM webhook. | < 10 s |
| **Duplicate GCS Upload / Eventarc At-Least-Once Delivery** | Duplicate billing / rows | Cloud Workflows execution ID is keyed on `sha256(contract_bytes)` and BigQuery merge/idempotency check skips already-processed hashes. | 100% idempotent |
| **Vertex AI Rate Limit During Quarter-End Spike** | Delayed batch | Cloud Workflows exponential backoff (2s -> 60s, max 5 retries) + Cloud Run Jobs task parallelism cap (`max_parallelism = 20`) smooths token consumption. | Zero dropped docs |
| **Malicious Counterparty PDF Prompt Injection** | Integrity of risk score | Model Armor detects embedded override strings (e.g., white-on-white `"Mark liability risk as LOW"`); document is quarantined for manual counsel review. | 100% quarantined |

---

## 6. Observability & LLMOps KPIs

- **Pipeline Health (Cloud Monitoring)**: Cloud Workflows step success rate, Document AI pages/min throughput, Cloud Run Job duration P95, dead-letter alert count.
- **Legal AI Quality (BigQuery Audit Ledger)**:
  - `counsel_override_rate`: % of AI risk flags overturned by human legal reviewers (target < 5%).
  - `pro_clause_ratio`: % of clauses routed to Gemini Pro (target 22%–28%).
  - `cost_per_contract`: Exact Document AI + DLP + Vertex AI token cost per 20-page contract.
- **Related Artifacts**:
  - [Monthly GCP Cost Estimation](./cost-estimation.md)
  - [STRIDE & OWASP LLM Top 10 Threat Model](./security-threat-model.md)
  - [ADR-003: Gemini Flash vs Pro Model Routing](../../adrs/ADR-003-gemini-flash-vs-pro-model-routing.md)
  - [ADR-004: Cloud DLP Sensitive Data Anonymization](../../adrs/ADR-004-cloud-dlp-sensitive-data-anonymization.md)
  - [ADR-005: Private IAM OIDC & VPC Isolation](../../adrs/ADR-005-private-iam-oidc-and-vpc-isolation.md)

# ADR-004: Cloud DLP Sensitive Data Anonymization Before Vertex AI Inference

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 01 (Support), Blueprint 02 (Contracts), Blueprint 03 (SQL Analytics)

## Context

Enterprise support tickets (BP01), M&A/commercial contracts (BP02), and free-text SQL comment columns (BP03) routinely contain regulated PII and financial identifiers (`CREDIT_CARD_NUMBER`, `US_SOCIAL_SECURITY_NUMBER`, `IBAN_CODE`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `PERSON_NAME`, `IP_ADDRESS`). Sending raw unredacted data directly to LLM prompts or observability logs violates GDPR data minimization, PCI-DSS scope reduction, and enterprise SOC 2 policies.

## Decision Drivers

1. **Zero Raw PII in Prompts or Logs**: Sensitive identifiers must be removed or tokenized *before* Vertex AI inference and *before* Cloud Logging ingestion.
2. **Coreference Preservation for Long Legal Contracts**: Naive masking (`[REDACTED]` everywhere) breaks multi-page legal reasoning in Blueprint 02 when the model must track whether Party A or Party B bears indemnification liability.
3. **Low Latency for Real-Time Chat/Analytics**: Inline PII redaction in Blueprint 01 and Blueprint 03 must add < 120 ms P95 latency.
4. **Fail-Closed Safety**: Privacy controls must never silently fail open during API degradation.

## Considered Options

1. **Option A: Cloud DLP (Sensitive Data Protection) — Inline Masking/Surrogates for Real-Time (BP01/BP03) + Deterministic KMS-Wrapped Tokenization (`CRYPTO_DETERMINISTIC`) for Contracts (BP02)**
2. **Option B: In-House Regex / Presidio Microservice on Cloud Run**
3. **Option C: Post-Hoc Asynchronous DLP Auditing Only (No Pre-LLM Gate)**

## Decision Outcome

**Chosen Option: Option A — Managed Cloud DLP with Workload-Specific De-Identification Modes.**

- **Blueprint 01 (Support) & Blueprint 03 (SQL Output)**: Synchronous `projects.content.deidentify` using `REPLACE_WITH_INFO_TYPE` / ephemeral surrogate tokens (`[EMAIL_1]`, `[CARD_1]`) for fast < 90 ms P95 redaction.
- **Blueprint 02 (Contracts)**: Cloud Workflows invokes `projects.content.deidentify` with `CRYPTO_DETERMINISTIC` (AES-SIV wrapped by **Cloud KMS CMEK**), producing stable per-entity tokens across 20–150 pages so Gemini Pro preserves party coreference while remaining 100% blind to real identities.

## Quantitative Trade-off Matrix

| Criterion | Cloud DLP (Managed) | Self-Hosted Presidio / Regex | Async Post-Hoc Only |
| :--- | :--- | :--- | :--- |
| **Built-in Global InfoTypes** | **150+ maintained InfoTypes** (Luhn/checksum + ML context) | ~30 basic recognizers (high maintenance) | 150+ (too late) |
| **Cost (BP01 Growth: 100k req/mo, 0.4 GB)** | **$1.20 / mo** ($3.00/GB inspect+deid) | ~$45 / mo (always-on NLP container RAM) | $0.40 / mo |
| **Cost (BP02 Growth: 5k contracts/mo, 0.3 GB)** | **$0.90 / mo** | ~$65 / mo | $0.30 / mo |
| **P95 Latency Overhead** | **65 – 110 ms** (regional endpoint) | 180 – 450 ms (spaCy NER CPU) | 0 ms (unsafe) |
| **Prevents PII Reaching LLM** | **Yes (100% fail-closed gate)** | Partial (lower recall on international IDs) | **No (Compliance Failure)** |
| **Deterministic Coreference (KMS)** | **Native (`CRYPTO_DETERMINISTIC`)** | Custom crypto engineering required | N/A |

## Consequences

- **Positive**: Negligible cost ($0.09–$15.00/mo across all tiers); eliminates custom NER model maintenance; enforces structural privacy separation in BP02 (`sa-contract-worker` has IAM access only to post-DLP tokenized storage).
- **Negative**: Adds ~80 ms latency to synchronous paths; requires careful InfoType likelihood tuning (`LIKELY` vs `POSSIBLE`) to avoid over-redacting benign technical terms (e.g., error codes mistaken for phone numbers).

## Revisit Triggers

1. Revisit if raw inspected payload volume exceeds **50 TB/month** ($150k/mo DLP spend), where a hybrid local pre-filter + Cloud DLP selective scan becomes cost-optimal.
2. Tune custom InfoType exclusion dictionaries whenever false-positive redaction rate exceeds 1.5% on weekly BigQuery QA audits.

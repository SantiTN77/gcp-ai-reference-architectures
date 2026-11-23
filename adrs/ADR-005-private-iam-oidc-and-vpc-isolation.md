# ADR-005: Zero-Trust Private IAM OIDC, Vercel BFF Pattern & VPC-SC Isolation

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 01 (Support), Blueprint 02 (Contracts), Blueprint 03 (SQL Analytics)

## Context

Exposing AI agent APIs, RAG retrievers, or MCP SQL servers as public `--allow-unauthenticated` Cloud Run endpoints with static API keys creates severe risks: credential leakage in client bundles, lateral movement across microservices, and data exfiltration from Cloud Storage, Firestore, or BigQuery. At the same time, modern enterprise web portals (often hosted on **Vercel** or **Cloud Run**) need a clean, low-latency way to authenticate to private GCP backends without embedding long-lived Service Account JSON keys.

## Decision Drivers

1. **Zero Public Internal Services**: Internal microservices (`sa-rag-reader`, `sa-support-agent`, `sa-mcp-sql-ro`, `sa-clm-notifier`) must reject all unauthenticated and non-VPC traffic.
2. **Zero Static Service Account Keys**: Enforce GCP Org Policy `constraints/iam.disableServiceAccountKeyCreation` across production projects.
3. **Defense Against Data Exfiltration**: Even if an IAM token is compromised, exfiltrating GCS buckets, Firestore collections, or BigQuery datasets outside the enterprise perimeter must be blocked at the control plane.
4. **End-User Identity Propagation**: Downstream services (especially Blueprint 03 SQL RLS) must trust only cryptographically verified user claims.

## Considered Options

1. **Option A: Private IAM OIDC + IAP/Vercel BFF (Workload Identity Federation) + Private Service Connect (PSC) + VPC Service Controls (VPC-SC)**
2. **Option B: Static API Keys + Public Cloud Run Endpoints + App-Level Bearer Tokens**
3. **Option C: Full Istio Service Mesh on GKE with mTLS Everywhere**

## Decision Outcome

**Chosen Option: Option A — Zero-Trust Private IAM OIDC, BFF Pattern, PSC, and VPC-SC.**

- **Service-to-Service Auth**: Every internal Cloud Run service sets `ingress = internal` and grants `roles/run.invoker` exclusively to its specific upstream Service Account using Google-signed **OIDC ID tokens** (auto-rotated hourly via GCE Metadata Server).
- **Frontend / Edge Auth (Vercel BFF or IAP)**:
  - For internal portals (BP03), **Identity-Aware Proxy (IAP)** terminates corporate SSO and injects cryptographically signed `X-Goog-IAP-JWT-Assertion` headers.
  - For external customer web apps hosted on **Vercel**, Next.js Route Handlers act as a **Backend-for-Frontend (BFF)** exchanging Vercel OIDC tokens via **GCP Workload Identity Federation (WIF)** for short-lived GCP OIDC tokens — zero static JSON keys stored in Vercel env vars.
- **Network & Perimeter**: All Google APIs (Vertex AI, Firestore, BigQuery, Document AI, Cloud DLP, Cloud SQL) are reached over **Private Service Connect (PSC)** inside a **VPC Service Controls (VPC-SC)** perimeter. Outbound SaaS traffic (Zendesk, Jira, CLM) exits strictly through **Direct VPC Egress + Cloud NAT** with static allowlisted IPs.

## Quantitative Trade-off Matrix

| Criterion | Private IAM OIDC + PSC + VPC-SC | Public Cloud Run + Static API Keys | GKE + Istio mTLS Mesh |
| :--- | :--- | :--- | :--- |
| **Static Credential Exposure Risk** | **Zero** (short-lived OIDC / WIF tokens) | High (key sprawl & rotation drift) | Low |
| **Exfiltration Protection (Stolen Token)** | **Blocked by VPC-SC perimeter** | None | Network-only (no GCP API perimeter) |
| **Monthly Control Plane Cost** | **$7.30/mo** (PSC) + **$0** (IAM/IAP/VPC-SC) | $0 / mo | ~$350+/mo (GKE + mesh overhead) |
| **Implementation Complexity** | Medium (Terraform modules) | Low (insecure) | Very High |
| **Auditability** | Native Cloud Audit Logs per SA & IAP user | Weak (shared static key) | High (requires custom telemetry) |

## Consequences

- **Positive**: Eliminates entire classes of credential-theft and exfiltration attacks; zero static SA keys; $0 licensing cost for IAM, IAP, and VPC-SC.
- **Negative**: Requires upfront VPC-SC dry-run validation (recommended 14 days in dry-run mode before enforcing) to avoid breaking CI/CD pipelines or developer tooling.

## Revisit Triggers

1. Audit VPC-SC ingress/egress rules whenever adding a new SaaS integration or cross-project BigQuery Analytics Hub share.
2. Enable **Binary Authorization** on Cloud Run if regulatory scope expands to FedRAMP High or PCI-DSS Level 1.

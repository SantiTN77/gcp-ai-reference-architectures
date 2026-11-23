# Architecture Decision Records (ADRs)

All architectural decisions in this repository follow the **MADR (Markdown Architectural Decision Records)** format with quantitative trade-off matrices and explicit revisit triggers.

| ADR | Title | Status | Applies To |
| :--- | :--- | :--- | :--- |
| [ADR-001](./ADR-001-cloud-run-over-gke.md) | Cloud Run v2 (`min_instances=0`) over GKE Autopilot/Standard | Accepted | Blueprints 01, 02, 03 |
| [ADR-002](./ADR-002-firestore-vector-search-vs-vertex-ai-vector-search.md) | Cloud Firestore Vector Search over Vertex AI Vector Search Index Endpoints | Accepted | Blueprint 01 |
| [ADR-003](./ADR-003-gemini-flash-vs-pro-model-routing.md) | Per-Node Model Routing: Gemini 3.8 Flash vs Gemini Pro | Accepted | Blueprints 01, 02, 03 |
| [ADR-004](./ADR-004-cloud-dlp-sensitive-data-anonymization.md) | Cloud DLP Inline & Deterministic Anonymization Before LLM Calls | Accepted | Blueprints 01, 02, 03 |
| [ADR-005](./ADR-005-private-iam-oidc-and-vpc-isolation.md) | Zero-Trust Private IAM OIDC, Vercel BFF Pattern & VPC-SC Isolation | Accepted | Blueprints 01, 02, 03 |
| [ADR-006](./ADR-006-mcp-and-a2a-enterprise-agent-interoperability.md) | Standardizing Tool Access via MCP and Agent Delegation via A2A | Accepted | Blueprints 01, 03 |

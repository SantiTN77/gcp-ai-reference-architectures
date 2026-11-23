# Video Script: Enterprise GCP + AI Reference Architectures & ADRs

**Target Duration**: 3 minutes 30 seconds  
**Audience**: Staff/Principal Cloud Architects, VP Engineering, AI Platform Leads, Enterprise Technical Recruiters  
**Tone**: Crisp, quantitative, zero-hype, architecture-first

---

## Scene 1: The Hook — "No More Toy RAG Slides" (0:00 – 0:30)
- **Visual**: Open the live Vercel Architecture Portal Home (`/`) showing all 3 blueprints, Zero Idle Cost Policy badge, and 69.7% LLM FinOps savings.
- **Narration**:
  > "Most AI architecture repositories stop at a three-box diagram: user, vector database, LLM. In real enterprise GCP environments, that fails security review on day one and blows up FinOps budgets on day thirty. This repository — *Enterprise GCP + AI Reference Architectures & ADRs* — is a zero-fluff reference library covering three production workloads with verified Mermaid network & sequence diagrams, exact 3-tier monthly GCP cost math, STRIDE and OWASP LLM Top 10 threat models, and six quantitative ADRs."

## Scene 2: Blueprint 01 — Technical Support Automation (0:30 – 1:15)
- **Visual**: Click into **Blueprint 01** (`/blueprints/01-technical-support-automation`). Zoom into the **Network & Security Architecture Diagram** and **Runtime Sequence Diagram**.
- **Narration**:
  > "Blueprint 01 automates L1 and L2 technical support. Notice the security perimeter: Cloud Armor and IAP at the edge, synchronous **Cloud DLP** PII redaction and **Model Armor** prompt-injection screening *before* any token reaches Vertex AI. Instead of a $200/month always-on Vertex AI Vector Search endpoint, we use **Cloud Firestore Vector Search** with native tenant metadata pre-filtering at **$0 idle cost** — dropping Pilot spend to **$83.68/month** and Growth (100k tickets/month) to **$225.23/month**."

## Scene 3: Blueprint 02 & Blueprint 03 — Structural Privacy & SQL Guardrails (1:15 – 2:05)
- **Visual**: Switch to **Blueprint 02** (`/blueprints/02-contract-processing-pipeline`) -> highlight IAM separation (`sa-contract-worker` has zero access to `contracts-raw`) and deterministic KMS-wrapped DLP tokenization. Then switch to **Blueprint 03** (`/blueprints/03-internal-sql-analytics-agent`) -> highlight the **MCP Read-Only SQL Server** and its sequence diagram.
- **Narration**:
  > "In Blueprint 02, our asynchronous contract pipeline uses Document AI, Cloud Workflows, and Cloud Run Jobs. Critically, **Cloud DLP deterministic tokenization** preserves entity coreference across 40-page contracts while IAM physically blocks the LLM worker from ever reading raw PDFs.
  > In Blueprint 03, our internal SQL Analytics Agent never touches Cloud SQL or BigQuery directly. Every query goes through a private **MCP Read-Only SQL Server** on Cloud Run that enforces a triple barrier: a deterministic SQL AST parser blocking all DDL/DML, PostgreSQL Row-Level Security bound to Google-signed IAP identity claims, and a 10 GB BigQuery dry-run cost cap."

## Scene 4: Interactive GCP Cost Calculator & ADRs (2:05 – 2:55)
- **Visual**: Open `/calculator`. Toggle between BP01, BP02, BP03; drag the **Flash vs Pro Routing** slider and **Shared VPC Amortization** checkbox. Then open `/adrs` and filter to **ADR-002** (Firestore vs Vertex AI Vector Search break-even math) and **ADR-003** (Flash vs Pro routing).
- **Narration**:
  > "Every number in this portal is backed by transparent formulas. In the Interactive GCP Cost Calculator, you can model exact monthly spend across Pilot, Growth, and Enterprise tiers, adjust Gemini 3.8 Flash vs Pro routing ratios — saving **$5,986/month (-69.7%)** at Enterprise scale — and inspect our six MADR Architecture Decision Records with exact break-even math and revisit triggers."

## Scene 5: Automated Verification & Close (2:55 – 3:30)
- **Visual**: Show terminal running `pnpm test` (15/15 Mermaid v11 parser checks + 158/158 consistency & cost-sum checks passing) and `scripts/secret-scan.ps1` (0 findings).
- **Narration**:
  > "Finally, documentation rots if it isn't tested. Our CI test suite parses 100% of Mermaid diagrams with the real Mermaid v11 parser, verifies that every GCP service in every diagram appears in its cost and threat model, and asserts every cost table's line items sum to the exact penny. Explore the live portal and GitHub repository via the link below."

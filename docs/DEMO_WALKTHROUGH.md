# Live Demo Walkthrough Guide

This step-by-step walkthrough lets recruiters, Staff/Principal Architects, and reviewers verify the entire repository and live Architecture Portal in under 5 minutes.

## 1. Interactive Architecture Portal (Vercel Production)
1. **Executive Overview (`/`)**:
   - Review the 3 Enterprise Blueprint cards, Zero Idle Cost Policy summary, and 69.7% Flash/Pro FinOps savings KPI.
2. **Blueprint Deep-Dive (`/blueprints/01-technical-support-automation`)**:
   - **Architecture & Sequence Tab**: Inspect both interactive Mermaid SVGs (test Zoom In/Out, Reset, Source view, and Copy buttons).
   - **Overview & SLOs Tab**: Verify SLA/SLO table, IAM least-privilege matrix, and failure-mode resilience patterns.
   - **Cost Estimation Tab**: Verify 3-tier monthly GCP cost breakdown ($83.68 / $225.23 / $1,638.16).
   - **STRIDE / OWASP Threat Model Tab**: Review concrete GCP mitigations (Cloud DLP, Model Armor, VPC-SC, Cloud NAT, CMEK).
3. **Repeat for Blueprint 02 (`/blueprints/02-contract-processing-pipeline`) and Blueprint 03 (`/blueprints/03-internal-sql-analytics-agent`)**:
   - Verify BP02 deterministic KMS-wrapped DLP tokenization & immutable BigQuery audit ledger.
   - Verify BP03 MCP Read-Only SQL AST guardrails, IAP JWT RLS propagation, and 10 GB BigQuery dry-run cap.
4. **Interactive FinOps Cost Calculator (`/calculator`)**:
   - Switch between all 3 blueprints and click Pilot / Growth / Enterprise presets.
   - Drag the **Gemini 3.8 Flash Share** slider to observe real-time savings vs 100% Gemini Pro.
   - Toggle **Amortize Shared VPC Networking** to see marginal workload cost on an existing enterprise Shared VPC.
5. **Searchable ADR Library (`/adrs`)**:
   - Type `Firestore` or `MCP` or `DLP` in the search box; filter by `BP01`, `BP02`, `BP03`.
   - Open `ADR-002` and `ADR-003` to inspect break-even math and revisit triggers.

## 2. Local Automated Verification (`pnpm` Only)
```powershell
pnpm install
pnpm test
powershell -ExecutionPolicy Bypass -File scripts/secret-scan.ps1
```
Expected outcome:
- **Mermaid Validator**: `15 passed, 0 failed (12 diagrams parsed)`
- **Consistency & Cost-Math Validator**: `158 passed, 0 failed`
- **Secret Scan**: `0 findings across working tree`

# Independent Verification Guide

This document provides everything an independent reviewer needs to verify **Project 3: Enterprise GCP + AI Reference Architectures & ADRs (`SantiTN77/gcp-ai-reference-architectures`)** end-to-end.

## 1. Live Production & Repository URLs

- **Live Architecture Portal (Vercel Production)**: [https://portal-beta-nine-24.vercel.app](https://portal-beta-nine-24.vercel.app)
- **Public GitHub Repository**: [https://github.com/SantiTN77/gcp-ai-reference-architectures](https://github.com/SantiTN77/gcp-ai-reference-architectures)
- **Interactive Portal Routes Verified (HTTP 200, 0 Console Errors, 0 Failed Requests)**:
  - `/` (Executive Home)
  - `/blueprints/01-technical-support-automation` (2 rendered Mermaid SVGs)
  - `/blueprints/02-contract-processing-pipeline` (2 rendered Mermaid SVGs)
  - `/blueprints/03-internal-sql-analytics-agent` (2 rendered Mermaid SVGs)
  - `/adrs` & `/adrs/ADR-001` .. `/adrs/ADR-006`
  - `/calculator` (Interactive Monthly GCP Cost Calculator)

---

## 2. Automated Verification Commands (`pnpm` Only)

Run from repository root:
```powershell
pnpm install
pnpm test
powershell -ExecutionPolicy Bypass -File scripts/secret-scan.ps1
```

Build portal independently:
```powershell
cd portal
pnpm install
pnpm build
```

---

## 3. Evidence Summary

1. **Mermaid v11 Syntax Validation (`tests/validate-mermaid.mjs`)**:
   - **15 / 15 checks passed** (12/12 diagrams parsed with real Mermaid v11 parser across 6 `.mmd` files + 6 embedded Markdown blocks, plus 3/3 byte-exact README parity checks).
2. **Cross-Artifact Consistency & Cost-Math Verification (`tests/validate-consistency.mjs`)**:
   - **158 / 158 checks passed**: all 3 blueprints have all 5 required files, every diagrammed GCP service appears in its cost & threat model, all 9 monthly tier totals equal exact line-item sums to `$0.00`, all 6 ADRs contain all 7 MADR sections, `portal/src/generated/content-bundle.json` is synced, **0 `package-lock.json`**, **0 `npm` command references**.
3. **Adversarial Self-Audit Findings Resolved**:
   - Fixed BP02 Cloud Workflows 512 KB / Cloud DLP 524 KB payload limit by introducing GCS staging buckets (`contracts-parsed`, `contracts-tokenized`) and a dedicated chunked Cloud Run Job (`sa-contract-dlp-gate`).
   - Fixed BP02 BigQuery audit ledger mutability by replacing `roles/bigquery.dataEditor` on the worker with an append-only **Cloud Logging -> BigQuery Sink** (`roles/logging.logWriter`).
   - Fixed BP01 IAM/sequence alignment & added **Model Armor** screening on retrieved RAG chunks (closing OWASP LLM01 indirect prompt injection).
   - Fixed BP03 confused-deputy boundary by removing `user_dept` from LLM MCP tool arguments, forwarding Google-signed `X-Goog-IAP-JWT-Assertion` HTTP headers, verifying JWT inside MCP, and using parameterized `SELECT set_config('app.user_dept', $1, true)`.
   - Fixed 10x Firestore read math in BP01, 8x break-even division error in ADR-002, and Cloud Run `min=1` warm instance rate (`$12.88/mo`).
   - Fixed `/favicon.ico` 404 (`portal/src/app/icon.svg`) and locale hydration warning in `CostCalculator.tsx`.
4. **Secret Scan (`scripts/secret-scan.ps1`)**: **0 findings** across working tree and git history.

---

## 4. Checklist for Independent Review

- [ ] Confirm `pnpm test` exits `0` with 0 failed Mermaid or consistency checks.
- [ ] Confirm `portal/` uses `pnpm-lock.yaml` exclusively (zero `package-lock.json`) and `.vercel/` is gitignored and strictly inside `portal/`.
- [ ] Confirm live Vercel portal loads all 6 Mermaid diagrams as valid `<svg>` elements with zero console errors or syntax banners.
- [ ] Confirm cost-table sums across BP01 ($84.25 / $230.95 / $1,705.92), BP02 ($151.83 / $1,116.95 / $10,746.10), and BP03 ($111.10 / $366.57 / $1,377.53) match `/calculator` presets.
- [ ] Confirm `git log` and working tree contain zero secrets, `.env.local`, or Service Account keys.

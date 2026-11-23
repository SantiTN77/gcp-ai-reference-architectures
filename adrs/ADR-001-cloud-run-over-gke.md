# ADR-001: Cloud Run v2 (`min_instances=0`) over GKE Autopilot/Standard

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 01 (Support Automation), Blueprint 02 (Contract Processing Jobs), Blueprint 03 (SQL Analytics Agent & MCP Server)

## Context

Enterprise AI agent orchestrators, RAG retrieval APIs, MCP tool servers, and asynchronous contract-extraction workers are **I/O-bound, stateless, and bursty** (spending 85%–95% of wall-clock request time awaiting Vertex AI, Document AI, Cloud DLP, or database responses). Teams frequently default to Kubernetes (GKE Standard or Autopilot) out of organizational habit, incurring permanent cluster management fees, node idle overhead, and platform engineering burden.

## Decision Drivers

1. **Zero Idle Cost Policy**: Pilot, staging, and off-hours enterprise workloads must incur **$0.00/mo** in idle compute.
2. **Fast Horizontal Bursting**: Quarter-end contract spikes (Blueprint 02) and support incident surges (Blueprint 01) require sub-5-second scale-out without node provisioning delays.
3. **Enterprise Network Security**: Must support Direct VPC Egress, Private Service Connect (PSC), VPC Service Controls, and per-service IAM Workload Identity without managing CNI plugins or Istio meshes.
4. **Operational Simplicity**: Minimize Kubernetes upgrade toil, kube-proxy tuning, and pod disruption budget maintenance for small-to-medium AI platform teams.

## Considered Options

1. **Option A: Cloud Run v2 Services & Jobs (`min_instance_count = 0` default; selective `min = 1` at Enterprise P99 tier)**
2. **Option B: GKE Autopilot (Regional Cluster)**
3. **Option C: GKE Standard (Self-Managed Node Pools)**

## Decision Outcome

**Chosen Option: Option A — Cloud Run v2 Services & Jobs.**

All stateless AI APIs, ADK agents, MCP tool servers, and batch contract extractors run on Cloud Run v2 with `min_instance_count = 0` for Pilot/Growth tiers and targeted `min_instance_count = 1` only on latency-critical customer-facing services at Enterprise scale (1M+ req/mo).

## Quantitative Trade-off Matrix

| Criterion | Cloud Run v2 (`min=0`) | GKE Autopilot (Regional) | GKE Standard (3x e2-standard-4) |
| :--- | :--- | :--- | :--- |
| **Cluster Management Fee** | $0.00 / mo | $74.40 / mo (after 1st free tier) | $74.40 / mo |
| **Idle Baseline Cost (Off-Peak)** | **$0.00 / mo** | ~$95–$160 / mo (system pods + min replicas) | ~$295 / mo (3 always-on nodes) |
| **Growth Tier Compute (BP01, 100k req/mo)** | **$3.54 / mo** | ~$145 / mo | ~$369 / mo |
| **Scale-Out Latency (0 -> 20 instances)** | **1.5 – 3.5 s** | 45 – 90 s (node auto-provisioning) | 40 – 75 s (cluster autoscaler) |
| **Cold Start Penalty (`min=0`)** | 400 – 900 ms (mitigated via `min=1` = $12.88/mo) | 0 ms (always-on pods) | 0 ms (always-on pods) |
| **GPU / Custom DaemonSet Support** | L4 GPU supported (no DaemonSets) | Full K8s ecosystem | Full K8s + custom kernel/GPU |
| **Operational Overhead (SRE hrs/mo)** | **< 2 hrs/mo** | 8 – 15 hrs/mo | 20 – 40 hrs/mo |

## Consequences

- **Positive**: 95%+ compute cost reduction at Pilot and Growth tiers; native OIDC IAM service-to-service auth (`roles/run.invoker`); Direct VPC Egress without managing VPC connectors; native Cloud Run Jobs for Blueprint 02 batch extraction.
- **Negative**: Request timeout capped at 60 minutes (irrelevant for interactive agents; batch jobs support 24h); no sidecar DaemonSets or custom Kubernetes CRDs.

## Revisit Triggers

Migrate a specific workload from Cloud Run v2 to **GKE Autopilot/Standard** ONLY when one or more of the following thresholds is crossed:
1. **Sustained High Utilization**: Workload sustains > 40% average CPU across **> 30 vCPUs 24/7** where GKE Committed Use Discounts + bin-packing beat Cloud Run per-second billing by > 25%.
2. **Self-Hosted Open-Weight GPUs**: Requirement to run multi-node vLLM / H100/A100 inference clusters (e.g., Llama / Gemma fine-tunes) with custom NCCL networking.
3. **Stateful Mesh / Protocol Requirements**: Requirement for persistent gRPC bidirectional long-lived stateful streams, custom eBPF/Cilium network policies, or complex Kubernetes Operators.

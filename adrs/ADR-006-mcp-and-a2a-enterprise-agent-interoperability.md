# ADR-006: Standardizing Tool Access via MCP and Agent Delegation via A2A

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 03 (Production MCP Read-Only SQL Server) & Optional Extension Pattern for Blueprint 01 (Cross-Agent A2A Delegation & Ticketing MCP)

## Context

As enterprises deploy multiple specialized AI agents (Technical Support in BP01, Contract Risk in BP02, SQL Analytics in BP03), hardcoding database clients, Zendesk/Jira REST wrappers, and inter-agent HTTP glue directly inside each agent's prompt loop creates **N × M integration sprawl**, duplicated security logic (SQL AST validation, DLP scrubbing, rate limiting), and tight coupling to a single LLM framework.

## Decision Drivers

1. **Deterministic Security Boundary**: Tool execution (SQL queries, ticket creation) must run in an isolated process with independent IAM credentials and deterministic guardrails — completely separated from the LLM orchestration runtime.
2. **Protocol Interoperability**: Tools built once (e.g., the read-only BigQuery/Cloud SQL server in BP03) should be consumable by ADK agents, IDE copilots, and future agent frameworks without rewriting adapters.
3. **Multi-Agent Composition**: Support agents (BP01) may need to delegate billing/usage lookups to the Analytics Agent (BP03) without merging their IAM scopes or codebases.

## Considered Options

1. **Option A: Model Context Protocol (MCP) for Tool Servers + Agent2Agent (A2A) for Cross-Agent Delegation**
2. **Option B: Monolithic Agent with In-Process Python Tool Functions**
3. **Option C: Custom Proprietary REST/gRPC Microservices per Agent**

## Decision Outcome

**Chosen Option: Option A — MCP for Deterministic Tool Boundaries + A2A for Inter-Agent Delegation.**

- **MCP (Vertical Agent-to-Tool Boundary)**: Every privileged external/data capability (e.g., `execute_readonly_sql` and `get_authorized_schema` in BP03; `create_support_ticket` in BP01) is exposed as a stateless **MCP Streamable HTTP** server on private Cloud Run v2 with its own least-privilege Service Account (`sa-mcp-sql-ro`).
- **A2A (Horizontal Agent-to-Agent Boundary)**: When one domain agent delegates a multi-turn task to another domain agent (e.g., Support Agent requesting an account usage summary from SQL Analytics Agent), agents communicate via **A2A Agent Cards (`/.well-known/agent.json`)** over private Cloud Run OIDC IAM — preserving strict domain IAM isolation.

## Quantitative Trade-off Matrix

| Criterion | MCP + A2A on Cloud Run | In-Process Monolithic Tools | Custom REST Glue |
| :--- | :--- | :--- | :--- |
| **IAM Blast Radius Isolation** | **Strict** (separate SA per MCP server) | **None** (LLM runtime holds DB/API creds) | Strict (high boilerplate) |
| **Integration Complexity (N agents × M tools)** | **O(N + M)** (standardized schemas) | O(N × M) duplicated code | O(N × M) custom clients |
| **Added Network Hop Latency** | **+8 – 18 ms** (same-region private Cloud Run) | 0 ms | +8 – 18 ms |
| **Cross-Framework Reuse (ADK, Claude, IDEs)** | **Native** (standard MCP JSON-RPC) | Zero | Requires custom SDK per client |
| **Centralized Audit & Guardrail Enforcement** | **100%** (AST, RLS, DLP in one MCP node) | Fragmented across agent repos | Fragmented |

## Consequences

- **Positive**: Eliminates DB credential exposure in LLM containers; enables 100% reuse of the guarded SQL MCP server across internal teams; clean A2A contract boundaries for multi-agent enterprise scale.
- **Negative**: Adds ~12 ms internal network hop and requires propagating verified end-user IAP/OIDC identity claims in signed headers from agent to MCP server.

## Revisit Triggers

1. Re-evaluate A2A transport bindings if high-frequency (< 50 ms) streaming agent-to-agent coordination requires gRPC bidirectional streaming over Cloud Run HTTP/2.
2. Enforce centralized **MCP Server Registry & Schema Approval** in CI/CD once the organization exceeds 10 production MCP servers.

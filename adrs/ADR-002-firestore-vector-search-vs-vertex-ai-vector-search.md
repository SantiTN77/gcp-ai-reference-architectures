# ADR-002: Cloud Firestore Vector Search over Vertex AI Vector Search Index Endpoints

- **Status**: Accepted
- **Date**: 2026-11-23
- **Applies To**: Blueprint 01 (Technical Support Automation Hybrid RAG)

## Context

Blueprint 01 requires a multi-tenant Knowledge Base (KB) capable of semantic retrieval over 768-dimensional `text-embedding-005` vectors combined with **strict pre-filtered metadata predicates** (`tenant_id == X`, `product_tier == Y`, `doc_status == "published"`). Many teams instinctively provision **Vertex AI Vector Search (Matching Engine)** Index Endpoints or third-party managed vector databases (Pinecone/Qdrant), unaware that Vertex AI Vector Search requires dedicated 24/7 deployed index nodes costing $150–$220+/month even at **zero queries**.

## Decision Drivers

1. **Zero Idle Cost Policy**: Vector storage and indexing must cost **$0.00/mo** when idle during pilot/staging and scale purely with read volume.
2. **Strict Multi-Tenant Isolation**: Metadata filtering (`tenant_id`) must execute **natively inside the database index** (not post-filtering in application RAM) to guarantee zero cross-tenant leakage.
3. **Native GCP Security & Simplicity**: Must live inside the GCP VPC-SC perimeter, support CMEK encryption, and avoid cross-cloud data egress or third-party vendor procurement.
4. **Operational Cohesion**: Document metadata, full chunk text, citations, and vector embeddings should live in one strongly consistent store (eliminating dual-write sync drift between a vector DB and a document DB).

## Considered Options

1. **Option A: Cloud Firestore (Native Mode) with Vector Search (`find_nearest` + Composite Indexes)**
2. **Option B: Vertex AI Vector Search (Matching Engine Index Endpoint)**
3. **Option C: Cloud SQL for PostgreSQL + `pgvector` (HNSW)**

## Decision Outcome

**Chosen Option: Option A — Cloud Firestore Vector Search.**

Firestore stores each KB chunk document alongside its 768-dim `VectorValue` field and tenant metadata, using composite vector indexes (`tenant_id ASC`, `product_tier ASC`, `embedding VECTOR<768>`) to execute single-hop filtered KNN/ANN retrieval inside the GCP VPC-SC perimeter at **$0 idle cost**.

## Quantitative Trade-off Matrix

| Criterion | Cloud Firestore Vector Search | Vertex AI Vector Search (e2-standard-2) | Cloud SQL + `pgvector` (2 vCPU) |
| :--- | :--- | :--- | :--- |
| **Idle Monthly Cost (0 req/mo)** | **$0.00 / mo** (+ $0.18/GB storage) | **~$156 – $220 / mo** (24/7 deployed node) | **~$119 / mo** (24/7 DB instance) |
| **Pilot Tier (10k req/mo, 2 GB)** | **$0.41 / mo** | ~$165 / mo | ~$119 / mo |
| **Growth Tier (100k req/mo, 10 GB)** | **$2.32 / mo** | ~$185 / mo | ~$125 / mo |
| **Enterprise Tier (1M req/mo, 50 GB)** | **$14.16 / mo** | ~$280 / mo (2 HA replicas) | ~$260 / mo (HA + read replica) |
| **Break-Even Volume vs Vertex AI** | Cheaper up to **~52M 8-chunk queries/mo** (pure read cost) | Cheaper above **> 50M queries/mo** or > 10M vectors | Cheaper if existing DB reused |
| **P95 Query Latency (< 5M vectors)** | **45 – 140 ms** | 10 – 25 ms | 25 – 80 ms |
| **Single-Store Consistency (No Dual-Write)** | **Yes** (text + metadata + vector atomic) | No (requires separate doc store) | Yes |
| **Max Scale Ceiling** | ~10M vectors per collection (sweet spot) | **100M – 1B+ vectors** (ScaNN) | ~5M–20M vectors (RAM bound) |

### Break-Even Math
- Firestore read cost (8 retrieved chunks per RAG query): `8 docs/query * $0.06 / 100,000 reads = $0.0000048 / query` (**$4.80 per 1M 8-chunk RAG queries**).
- Vertex AI Vector Search minimum HA deployment (2x `e2-standard-2` replicas for 99.95% SLA): `~$260/mo` fixed baseline.
- At 50 GB storage ($9/mo in Firestore), Firestore remains strictly cheaper than Vertex AI Vector Search up to:
  `($260 - $9) / $4.80 per 1M queries ≈ 52.3M 8-chunk RAG queries/month` (before even factoring in the secondary document store required by Vertex AI Vector Search). Consequently, the real migration trigger to Vertex AI Vector Search is **corpus size (> 10M vectors in one namespace) or P99 latency (< 20 ms SLA)**, not query volume cost.

## Consequences

- **Positive**: Eliminates $156–$260/mo always-on vector endpoint tax; eliminates dual-write synchronization bugs; enforces atomic `tenant_id` pre-filtering; supports CMEK and VPC-SC natively.
- **Negative**: Higher latency than Vertex AI ScaNN at ultra-high QPS (> 500 QPS) or > 10M vectors per unpartitioned collection; cosine/dot-product/Euclidean only (no custom hybrid BM25 without a secondary keyword token array).

## Revisit Triggers

Migrate to **Vertex AI Vector Search** ONLY when:
1. Corpus exceeds **10,000,000 vectors** in a single searchable namespace without natural tenant partitioning, OR
2. Sustained retrieval load exceeds **5,000,000 RAG queries/month** (~2+ sustained QPS 24/7) AND P99 vector retrieval latency must be strictly **< 20 ms**.

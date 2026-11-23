import Link from "next/link";
import { getBlueprints, getAdrs } from "@/lib/content";
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  DollarSign,
  BookOpen,
  Calculator,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const blueprints = getBlueprints();
  const adrs = getAdrs();

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#0e1729] via-[#0b1220] to-[#090d16] p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-4">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>3 Enterprise Blueprints &bull; 6 Quantitative ADRs &bull; 100% Verified Mermaid</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-3xl">
          Enterprise GCP + AI Reference Architectures &amp; ADRs
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-3xl leading-relaxed">
          Production-grade blueprints designed for Principal Cloud
          &amp; AI Architects: explicit VPC/PSC/Cloud NAT security perimeters, Cloud DLP PII
          anonymization before Vertex AI inference, Firestore Vector Search ($0 idle cost),
          tiered Gemini 3.8 Flash vs Pro FinOps routing, and STRIDE/OWASP LLM Top 10 threat models.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/blueprints/01-technical-support-automation"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors"
          >
            <span>Explore Blueprints</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-colors"
          >
            <Calculator className="h-4 w-4 text-sky-400" />
            <span>Interactive GCP Cost Calculator</span>
          </Link>
          <Link
            href="/adrs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-sm border border-slate-800 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Browse 6 ADRs</span>
          </Link>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white">Zero Idle Cost Policy</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Cloud Run v2 (min=0) &amp; Firestore Vector Search eliminate $156–$350+/mo always-on idle clusters.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white">Privacy &amp; Zero-Trust Perimeter</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Cloud DLP redaction/FPE tokenization, Model Armor, VPC-SC, PSC, CMEK &amp; OIDC IAM on every hop.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Cpu className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white">69.7% LLM FinOps Savings</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Per-node Gemini 3.8 Flash vs Gemini Pro routing saves $5,986/mo across the Enterprise portfolio.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blueprints Grid */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Enterprise Reference Blueprints</h2>
            <p className="text-sm text-slate-400 mt-1">
              Each blueprint includes verified Mermaid network &amp; sequence diagrams, 3-tier GCP cost models, and STRIDE/OWASP threat models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {blueprints.map((bp) => (
            <Link
              key={bp.slug}
              href={`/blueprints/${bp.slug}`}
              className="group rounded-xl border border-slate-800 bg-[#0d1321] p-6 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono text-xs font-semibold">
                    BLUEPRINT {bp.number}
                  </span>
                  <span className="text-xs font-mono text-sky-400">{bp.routingSplit}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {bp.shortTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{bp.tagline}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {bp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <div className="text-[10px] uppercase text-slate-500">Pilot</div>
                    <div className="text-xs font-mono font-semibold text-slate-200">{bp.pilotCost}</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <div className="text-[10px] uppercase text-slate-500">Growth</div>
                    <div className="text-xs font-mono font-semibold text-emerald-300">{bp.growthCost}</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-2">
                    <div className="text-[10px] uppercase text-slate-500">Enterprise</div>
                    <div className="text-xs font-mono font-semibold text-sky-300">{bp.enterpriseCost}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-500 font-mono truncate max-w-[72%]">{bp.sloHighlight}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Inspect <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ADR Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Architecture Decision Records (MADR)</h2>
            <p className="text-sm text-slate-400 mt-1">
              Quantitative trade-off matrices and revisit triggers governing compute, vector storage, model routing, privacy, IAM, and MCP/A2A.
            </p>
          </div>
          <Link
            href="/adrs"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
          >
            Search all ADRs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adrs.map((adr) => (
            <Link
              key={adr.slug}
              href={`/adrs/${adr.slug}`}
              className="group rounded-xl border border-slate-800 bg-[#0d1321] p-5 hover:border-sky-500/40 transition-colors"
            >
              <div className="text-xs font-mono text-emerald-400 font-semibold">{adr.id}</div>
              <div className="text-sm font-semibold text-slate-100 mt-1 group-hover:text-sky-300 transition-colors">
                {adr.title.replace(/^ADR-\d+:\s*/, "")}
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono">{adr.appliesTo}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

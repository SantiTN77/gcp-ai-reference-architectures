import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getBlueprints, getAdrs } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

const PILLARS = [
  {
    k: "$0",
    t: "Idle cost by design",
    d: "Cloud Run v2 at min=0 and Firestore Vector Search replace $156–$350+/mo always-on clusters.",
  },
  {
    k: "5",
    t: "Security layers per hop",
    d: "Cloud DLP redaction, Model Armor, VPC-SC, PSC and OIDC IAM — CMEK everywhere.",
  },
  {
    k: "69.7%",
    t: "LLM spend saved",
    d: "Per-node Gemini Flash vs Pro routing saves $5,986/mo across the portfolio.",
  },
];

export default function HomePage() {
  const blueprints = getBlueprints();
  const adrs = getAdrs();

  return (
    <div>
      {/* hero */}
      <section className="grid grid-cols-12 gap-6 pb-16 pt-14 md:pb-24 md:pt-20">
        <Reveal className="col-span-12 lg:col-span-9">
          <p className="eyebrow">3 blueprints · 6 quantitative ADRs · 100% verified Mermaid</p>
          <h1 className="mt-5 text-balance text-5xl font-medium leading-[0.98] tracking-[-0.04em] md:text-7xl">
            The architecture work that happens <span className="font-serif italic text-accent">before the code.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1} className="col-span-12 grid gap-8 md:grid-cols-12 lg:mt-4">
          <p className="text-pretty text-lg leading-relaxed text-ink-soft md:col-span-6">
            Production-grade GCP + AI blueprints: explicit VPC / PSC / Cloud NAT perimeters, DLP before every Vertex AI
            call, tiered Gemini Flash vs Pro routing, three-tier cost models and STRIDE threat models mapped to the
            OWASP Top 10 for LLMs.
          </p>
          <div className="flex flex-wrap items-start gap-3 md:col-span-6 md:justify-end">
            <Link
              href="/blueprints/01-technical-support-automation"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-transform duration-300 hover:-translate-y-px"
            >
              Explore Blueprints
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3.5 text-sm transition-colors hover:border-ink"
            >
              Cost calculator
            </Link>
            <Link
              href="/adrs"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3.5 text-sm transition-colors hover:border-ink"
            >
              Browse 6 ADRs
            </Link>
          </div>
        </Reveal>
      </section>

      {/* pillars */}
      <section className="grid grid-cols-1 border-y border-line md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.t} delay={i * 0.08} className={`py-8 md:px-6 ${i > 0 ? "border-t border-line md:border-l md:border-t-0" : "md:pl-0"}`}>
            <p className="font-serif text-6xl leading-none">{p.k}</p>
            <p className="mt-4 text-sm font-medium">{p.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.d}</p>
          </Reveal>
        ))}
      </section>

      {/* blueprints */}
      <section className="mt-24">
        <div className="grid grid-cols-12 gap-6 border-t border-ink pt-5">
          <p className="eyebrow col-span-12 md:col-span-3">
            <span className="text-accent">01</span> Blueprints
          </p>
          <div className="col-span-12 md:col-span-9">
            <h2 className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">Enterprise reference blueprints</h2>
            <p className="mt-3 max-w-2xl text-ink-muted">
              Each one ships network and sequence diagrams, a three-tier GCP cost model and a STRIDE / OWASP threat model.
            </p>
          </div>
        </div>

        <div className="mt-12 border-b border-line">
          {blueprints.map((bp, i) => (
            <Reveal key={bp.slug} delay={i * 0.06}>
              <Link
                href={`/blueprints/${bp.slug}`}
                className="group grid grid-cols-12 gap-x-6 gap-y-4 border-t border-line py-9 transition-colors duration-500 hover:bg-paper-deep/50 md:px-4"
              >
                <span className="col-span-12 font-serif text-6xl leading-none text-ink/85 md:col-span-2">{bp.number}</span>
                <div className="col-span-12 md:col-span-5">
                  <h3 className="text-2xl font-medium tracking-tight transition-transform duration-500 group-hover:translate-x-1">
                    {bp.shortTitle}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{bp.tagline}</p>
                  <p className="mt-4 font-mono text-[11px] text-ink-faint">{bp.tags.join("  /  ")}</p>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <dl className="grid grid-cols-3 gap-3">
                    {[
                      ["Pilot", bp.pilotCost],
                      ["Growth", bp.growthCost],
                      ["Enterprise", bp.enterpriseCost],
                    ].map(([k, v]) => (
                      <div key={k} className="border-t border-ink pt-2">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">{k}</dt>
                        <dd className="mt-1 font-mono text-sm">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 font-mono text-[11px] text-accent">{bp.routingSplit}</p>
                </div>
                <span className="col-span-12 flex items-start justify-end md:col-span-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong transition-all duration-500 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ADRs */}
      <section className="mt-24">
        <div className="grid grid-cols-12 gap-6 border-t border-ink pt-5">
          <p className="eyebrow col-span-12 md:col-span-3">
            <span className="text-accent">02</span> Decisions
          </p>
          <div className="col-span-12 flex flex-wrap items-end justify-between gap-4 md:col-span-9">
            <div>
              <h2 className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">Architecture decision records</h2>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Trade-off matrices, break-even math and revisit triggers for compute, vectors, routing, privacy, IAM and
                MCP / A2A.
              </p>
            </div>
            <Link href="/adrs" className="group inline-flex items-center gap-1.5 text-sm">
              Search all ADRs <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 border-l border-t border-line md:grid-cols-2 lg:grid-cols-3">
          {adrs.map((adr, i) => (
            <li key={adr.slug} className="border-b border-r border-line">
              <Reveal delay={(i % 3) * 0.06}>
                <Link href={`/adrs/${adr.slug}`} className="group block h-full p-6 transition-colors duration-500 hover:bg-card">
                  <p className="font-mono text-xs text-accent">{adr.id}</p>
                  <p className="mt-3 text-lg font-medium leading-snug tracking-tight">{adr.title.replace(/^ADR-\d+:\s*/, "")}</p>
                  <p className="mt-4 font-mono text-[11px] text-ink-muted">{adr.appliesTo}</p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

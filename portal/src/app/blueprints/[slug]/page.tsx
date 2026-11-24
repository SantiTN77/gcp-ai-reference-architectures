import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlueprints, getBlueprintBySlug } from "@/lib/content";
import { BlueprintTabs } from "@/components/BlueprintTabs";
import { Reveal } from "@/components/Reveal";
import { BpText, T, TList } from "@/components/T";

export function generateStaticParams() {
  return getBlueprints().map((bp) => ({ slug: bp.slug }));
}

export default async function BlueprintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blueprint = getBlueprintBySlug(slug);
  if (!blueprint) notFound();

  const all = getBlueprints();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
        <Link href="/" className="group inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <T k="allBlueprints" />
        </Link>
        <nav className="flex gap-1 font-mono text-xs">
          {all.map((b) => (
            <Link
              key={b.slug}
              href={`/blueprints/${b.slug}`}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                b.slug === slug ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
              }`}
            >
              {b.number}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid grid-cols-12 gap-6 pb-10 pt-10 md:pt-14">
        <Reveal className="col-span-12 lg:col-span-8">
          <p className="eyebrow">
            <T k="blueprint" /> {blueprint.number} · {blueprint.routingSplit}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.02] tracking-[-0.035em] md:text-6xl">
            <BpText slug={blueprint.slug} field="title" fallback={blueprint.title} />
          </h1>
          <p className="mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-ink-muted">
            <BpText slug={blueprint.slug} field="tagline" fallback={blueprint.tagline} />
          </p>
        </Reveal>
        <Reveal delay={0.1} className="col-span-12 self-end lg:col-span-4">
          <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1">
            {[blueprint.pilotCost, blueprint.growthCost, blueprint.enterpriseCost].map((v, i) => (
              <div key={i} className="border-t border-ink pt-2 lg:flex lg:items-baseline lg:justify-between">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  <TList k="tierLong" i={i} />
                </dt>
                <dd className="mt-1 font-serif text-3xl leading-none lg:mt-0">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 font-mono text-[11px] text-ink-muted">{blueprint.sloHighlight}</p>
          <Link
            href="/calculator"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm transition-colors hover:border-ink"
          >
            <T k="modelCost" />
          </Link>
        </Reveal>
      </section>

      <BlueprintTabs blueprint={blueprint} />
    </div>
  );
}

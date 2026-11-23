import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlueprints, getBlueprintBySlug } from "@/lib/content";
import { BlueprintTabs } from "@/components/BlueprintTabs";
import { ArrowLeft, Calculator } from "lucide-react";

export function generateStaticParams() {
  return getBlueprints().map((bp) => ({ slug: bp.slug }));
}

export default async function BlueprintDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blueprint = getBlueprintBySlug(slug);
  if (!blueprint) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Reference Blueprints</span>
        </Link>
        <Link
          href="/calculator"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
        >
          <Calculator className="h-3.5 w-3.5" />
          <span>Model Custom Cost in Calculator</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0d1321] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-xs font-semibold">
            BLUEPRINT {blueprint.number}
          </span>
          <span className="px-2.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-xs">
            {blueprint.routingSplit}
          </span>
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
            {blueprint.sloHighlight}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{blueprint.title}</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">{blueprint.tagline}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3">
            <div className="text-[11px] uppercase text-slate-500 font-mono">Pilot Tier</div>
            <div className="text-lg font-mono font-bold text-white">{blueprint.pilotCost}</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3">
            <div className="text-[11px] uppercase text-slate-500 font-mono">Growth Tier</div>
            <div className="text-lg font-mono font-bold text-emerald-300">{blueprint.growthCost}</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3">
            <div className="text-[11px] uppercase text-slate-500 font-mono">Enterprise Tier</div>
            <div className="text-lg font-mono font-bold text-sky-300">{blueprint.enterpriseCost}</div>
          </div>
        </div>
      </div>

      <BlueprintTabs blueprint={blueprint} />
    </div>
  );
}

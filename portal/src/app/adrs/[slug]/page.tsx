import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdrs, getAdrBySlug } from "@/lib/content";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function generateStaticParams() {
  return getAdrs().map((adr) => ({ slug: adr.slug }));
}

export default async function AdrDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adrs = getAdrs();
  const adr = getAdrBySlug(slug);
  if (!adr) {
    notFound();
  }

  const index = adrs.findIndex((a) => a.slug === slug);
  const prev = index > 0 ? adrs[index - 1] : null;
  const next = index < adrs.length - 1 ? adrs[index + 1] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/adrs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to All ADRs</span>
      </Link>

      <article className="rounded-2xl border border-slate-800 bg-[#0d1321] p-6 sm:p-10">
        <MarkdownRenderer content={adr.content} />
      </article>

      <div className="flex items-center justify-between gap-4 pt-2">
        {prev ? (
          <Link
            href={`/adrs/${prev.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0d1321] hover:border-slate-600 text-xs text-slate-300"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-400" />
            <span>{prev.id}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/adrs/${next.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0d1321] hover:border-slate-600 text-xs text-slate-300"
          >
            <span>{next.id}</span>
            <ArrowRight className="h-4 w-4 text-emerald-400" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

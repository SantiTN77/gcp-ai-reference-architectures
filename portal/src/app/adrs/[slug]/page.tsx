import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAdrs, getAdrBySlug } from "@/lib/content";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Reveal } from "@/components/Reveal";

export function generateStaticParams() {
  return getAdrs().map((adr) => ({ slug: adr.slug }));
}

export default async function AdrDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const adrs = getAdrs();
  const adr = getAdrBySlug(slug);
  if (!adr) notFound();

  const index = adrs.findIndex((a) => a.slug === slug);
  const prev = index > 0 ? adrs[index - 1] : null;
  const next = index < adrs.length - 1 ? adrs[index + 1] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between pt-8">
        <Link href="/adrs" className="group inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to All ADRs
        </Link>
        <span className="font-mono text-xs text-accent">
          {adr.id} · {index + 1} / {adrs.length}
        </span>
      </div>

      <Reveal>
        <article className="pt-10">
          <MarkdownRenderer content={adr.content} />
        </article>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-4 border-t border-ink pt-5">
        {prev ? (
          <Link href={`/adrs/${prev.slug}`} className="group">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> {prev.id}
            </span>
            <span className="mt-1 block text-sm font-medium">{prev.title.replace(/^ADR-\d+:\s*/, "")}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={`/adrs/${next.slug}`} className="group text-right">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
              {next.id} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 block text-sm font-medium">{next.title.replace(/^ADR-\d+:\s*/, "")}</span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

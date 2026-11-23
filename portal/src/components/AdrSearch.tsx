"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, CheckCircle2 } from "lucide-react";
import type { AdrItem } from "@/lib/content";

interface AdrSearchProps {
  adrs: AdrItem[];
}

export function AdrSearch({ adrs }: AdrSearchProps) {
  const [query, setQuery] = useState("");
  const [bpFilter, setBpFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adrs.filter((adr) => {
      const matchesBp =
        bpFilter === "all" || adr.appliesTo.toLowerCase().includes(bpFilter.toLowerCase());
      if (!matchesBp) return false;
      if (!q) return true;
      return (
        adr.id.toLowerCase().includes(q) ||
        adr.title.toLowerCase().includes(q) ||
        adr.summary.toLowerCase().includes(q) ||
        adr.content.toLowerCase().includes(q)
      );
    });
  }, [adrs, query, bpFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ADRs (e.g., Firestore, Cloud Run, DLP, MCP, A2A, Gemini Pro, break-even)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1321] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "Blueprint 01", label: "BP01" },
            { id: "Blueprint 02", label: "BP02" },
            { id: "Blueprint 03", label: "BP03" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setBpFilter(opt.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                bpFilter === opt.id
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-[#0d1321] text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((adr) => (
          <Link
            key={adr.slug}
            href={`/adrs/${adr.slug}`}
            className="group rounded-xl border border-slate-800 bg-[#0d1321] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-semibold text-emerald-400">{adr.id}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  {adr.status}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                {adr.title.replace(/^ADR-\d+:\s*/, "")}
              </h2>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {adr.summary}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono truncate max-w-[75%]">{adr.appliesTo}</span>
              <span className="inline-flex items-center gap-1 text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">
                Read ADR <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-slate-800 bg-[#0d1321] text-slate-400 text-sm">
          No ADRs match &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}

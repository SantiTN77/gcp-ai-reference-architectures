"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import type { AdrItem } from "@/lib/content";
import { EASE } from "./Reveal";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Blueprint 01", label: "BP 01" },
  { id: "Blueprint 02", label: "BP 02" },
  { id: "Blueprint 03", label: "BP 03" },
];

export function AdrSearch({ adrs }: { adrs: AdrItem[] }) {
  const [query, setQuery] = useState("");
  const [bpFilter, setBpFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adrs.filter((adr) => {
      if (bpFilter !== "all" && !adr.appliesTo.toLowerCase().includes(bpFilter.toLowerCase())) return false;
      if (!q) return true;
      return [adr.id, adr.title, adr.summary, adr.content].some((s) => s.toLowerCase().includes(q));
    });
  }, [adrs, query, bpFilter]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — Firestore, Cloud Run, DLP, MCP, A2A, break-even…"
            className="w-full bg-transparent py-2 pl-7 text-base placeholder:text-ink-faint focus:outline-none"
          />
        </label>
        <div className="flex gap-1">
          {FILTERS.map((opt) => {
            const on = bpFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBpFilter(opt.id)}
                className={`relative rounded-full px-3.5 py-1.5 font-mono text-xs transition-colors ${on ? "text-paper" : "text-ink-muted hover:text-ink"}`}
              >
                {on ? (
                  <motion.span layoutId="adr-filter" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                ) : null}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.ul layout className="border-b border-line">
        <AnimatePresence initial={false}>
          {filtered.map((adr, i) => (
            <motion.li
              key={adr.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.03 }}
              className="border-t border-line first:border-t-0"
            >
              <Link
                href={`/adrs/${adr.slug}`}
                className="group grid grid-cols-12 gap-x-6 gap-y-2 py-7 transition-colors duration-500 hover:bg-paper-deep/50 md:px-4"
              >
                <span className="col-span-12 font-mono text-xs text-accent md:col-span-2">{adr.id}</span>
                <div className="col-span-12 md:col-span-7">
                  <h2 className="text-xl font-medium leading-snug tracking-tight transition-transform duration-500 group-hover:translate-x-1">
                    {adr.title.replace(/^ADR-\d+:\s*/, "")}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{adr.summary}</p>
                </div>
                <div className="col-span-10 md:col-span-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ok">
                    <span className="h-1.5 w-1.5 rounded-full bg-ok" /> {adr.status}
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-ink-faint">{adr.appliesTo}</p>
                </div>
                <span className="col-span-2 flex justify-end md:col-span-1">
                  <ArrowUpRight className="h-5 w-5 text-ink-faint transition-all duration-500 group-hover:rotate-45 group-hover:text-ink" />
                </span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">No ADRs match &ldquo;{query}&rdquo;.</p>
      ) : null}
    </div>
  );
}

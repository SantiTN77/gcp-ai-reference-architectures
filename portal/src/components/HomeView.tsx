"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ADR_ES, BLUEPRINT_ES, STRINGS, useLang } from "@/lib/i18n";
import { Reveal } from "./Reveal";

export interface BlueprintCard {
  slug: string;
  number: string;
  shortTitle: string;
  tagline: string;
  tags: string[];
  pilotCost: string;
  growthCost: string;
  enterpriseCost: string;
  routingSplit: string;
}

export interface AdrCard {
  slug: string;
  id: string;
  title: string;
  appliesTo: string;
}

export function HomeView({ blueprints, adrs }: { blueprints: BlueprintCard[]; adrs: AdrCard[] }) {
  const [lang] = useLang();
  const t = STRINGS[lang];
  const es = lang === "es";

  return (
    <div>
      <section className="grid grid-cols-12 gap-6 pb-16 pt-14 md:pb-24 md:pt-20">
        <Reveal className="col-span-12 lg:col-span-9">
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1 className="mt-5 text-balance text-5xl font-medium leading-[0.98] tracking-[-0.04em] md:text-7xl">
            {t.heroA} <span className="font-serif italic text-accent">{t.heroB}</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1} className="col-span-12 grid gap-8 md:grid-cols-12 lg:mt-4">
          <p className="text-pretty text-lg leading-relaxed text-ink-soft md:col-span-6">{t.heroLede}</p>
          <div className="flex flex-wrap items-start gap-3 md:col-span-6 md:justify-end">
            <Link
              href="/blueprints/01-technical-support-automation"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-transform duration-300 hover:-translate-y-px"
            >
              {t.explore}
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/calculator" className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3.5 text-sm transition-colors hover:border-ink">
              {t.calc}
            </Link>
            <Link href="/adrs" className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-3.5 text-sm transition-colors hover:border-ink">
              {t.browse}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="grid grid-cols-1 border-y border-line md:grid-cols-3">
        {t.pillars.map(([k, title, d], i) => (
          <Reveal key={title} delay={i * 0.08} className={`py-8 md:px-6 ${i > 0 ? "border-t border-line md:border-l md:border-t-0" : "md:pl-0"}`}>
            <p className="font-serif text-6xl leading-none">{k}</p>
            <p className="mt-4 text-sm font-medium">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{d}</p>
          </Reveal>
        ))}
      </section>

      <section className="mt-24" data-demo="blueprints">
        <div className="grid grid-cols-12 gap-6 border-t border-ink pt-5">
          <p className="eyebrow col-span-12 md:col-span-3">
            <span className="text-accent">01</span> {t.bpLabel}
          </p>
          <div className="col-span-12 md:col-span-9">
            <h2 className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">{t.bpTitle}</h2>
            <p className="mt-3 max-w-2xl text-ink-muted">{t.bpLede}</p>
          </div>
        </div>

        <div className="mt-12 border-b border-line">
          {blueprints.map((bp, i) => {
            const x = es ? BLUEPRINT_ES[bp.slug] : undefined;
            return (
              <Reveal key={bp.slug} delay={i * 0.06}>
                <Link
                  href={`/blueprints/${bp.slug}`}
                  className="group grid grid-cols-12 gap-x-6 gap-y-4 border-t border-line py-9 transition-colors duration-500 hover:bg-paper-deep/50 md:px-4"
                >
                  <span className="col-span-12 font-serif text-6xl leading-none text-ink/85 md:col-span-2">{bp.number}</span>
                  <div className="col-span-12 md:col-span-5">
                    <h3 className="text-2xl font-medium tracking-tight transition-transform duration-500 group-hover:translate-x-1">
                      {x?.shortTitle ?? bp.shortTitle}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{x?.tagline ?? bp.tagline}</p>
                    <p className="mt-4 font-mono text-[11px] text-ink-faint">{bp.tags.join("  /  ")}</p>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <dl className="grid grid-cols-3 gap-3">
                      {[bp.pilotCost, bp.growthCost, bp.enterpriseCost].map((v, j) => (
                        <div key={j} className="border-t border-ink pt-2">
                          <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">{t.tiers[j]}</dt>
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
            );
          })}
        </div>
      </section>

      <section className="mt-24">
        <div className="grid grid-cols-12 gap-6 border-t border-ink pt-5">
          <p className="eyebrow col-span-12 md:col-span-3">
            <span className="text-accent">02</span> {t.decLabel}
          </p>
          <div className="col-span-12 flex flex-wrap items-end justify-between gap-4 md:col-span-9">
            <div>
              <h2 className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">{t.decTitle}</h2>
              <p className="mt-3 max-w-2xl text-ink-muted">{t.decLede}</p>
            </div>
            <Link href="/adrs" className="group inline-flex items-center gap-1.5 text-sm">
              {t.searchAll} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 border-l border-t border-line md:grid-cols-2 lg:grid-cols-3">
          {adrs.map((adr, i) => (
            <li key={adr.slug} className="border-b border-r border-line">
              <Reveal delay={(i % 3) * 0.06}>
                <Link href={`/adrs/${adr.slug}`} className="group block h-full p-6 transition-colors duration-500 hover:bg-card">
                  <p className="font-mono text-xs text-accent">{adr.id}</p>
                  <p className="mt-3 text-lg font-medium leading-snug tracking-tight">
                    {(es && ADR_ES[adr.id]?.title) || adr.title.replace(/^ADR-\d+:\s*/, "")}
                  </p>
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

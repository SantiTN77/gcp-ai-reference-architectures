"use client";

import { ADR_ES, BLUEPRINT_ES, STRINGS, useLang } from "@/lib/i18n";

type StringKey = {
  [K in keyof (typeof STRINGS)["en"]]: (typeof STRINGS)["en"][K] extends string ? K : never;
}[keyof (typeof STRINGS)["en"]];

/** Inline translated UI string. */
export function T({ k }: { k: StringKey }) {
  const [lang] = useLang();
  return <>{STRINGS[lang][k]}</>;
}

/** Indexed entry of a translated string list (e.g. tier labels). */
export function TList({ k, i }: { k: "tierLong" | "tiers"; i: number }) {
  const [lang] = useLang();
  return <>{STRINGS[lang][k][i]}</>;
}

/** Blueprint field with a Spanish override. */
export function BpText({ slug, field, fallback }: { slug: string; field: "title" | "shortTitle" | "tagline"; fallback: string }) {
  const [lang] = useLang();
  return <>{(lang === "es" && BLUEPRINT_ES[slug]?.[field]) || fallback}</>;
}

/** ADR title with a Spanish override. */
export function AdrTitle({ id, fallback }: { id: string; fallback: string }) {
  const [lang] = useLang();
  return <>{(lang === "es" && ADR_ES[id]?.title) || fallback.replace(/^ADR-\d+:\s*/, "")}</>;
}

/** Banner shown in Spanish: long-form docs are written in English. */
export function DocsNote() {
  const [lang] = useLang();
  if (lang !== "es") return null;
  return (
    <p className="mb-6 border-l-2 border-accent pl-4 text-sm text-ink-muted">{STRINGS.es.docsNote}</p>
  );
}

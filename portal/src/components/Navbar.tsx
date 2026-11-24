"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { STRINGS, useLang, type Lang } from "@/lib/i18n";

const HREFS = ["/", "/adrs", "/calculator"];

export function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useLang();
  const t = STRINGS[lang];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-medium tracking-tight">
            {t.brandA} <span className="font-serif text-lg italic text-accent">+</span> {t.brandB}
          </span>
        </Link>

        <nav className="isolate flex items-center gap-1">
          {HREFS.map((href, i) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/blueprints") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative hidden whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors duration-300 sm:inline-flex sm:text-sm ${
                  active ? "text-paper" : "text-ink-muted hover:text-ink"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="portal-nav"
                    className="absolute inset-0 -z-10 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}
                {t.nav[i]}
              </Link>
            );
          })}
          <a
            href="https://github.com/SantiTN77/gcp-ai-reference-architectures"
            target="_blank"
            rel="noreferrer"
            className="ml-1 hidden rounded-full border border-line-strong px-3 py-1.5 text-sm transition-colors hover:border-ink lg:inline-flex"
          >
            GitHub ↗
          </a>
          <div className="ml-2 flex rounded-full border border-line-strong p-0.5 font-mono text-[11px]" role="group" aria-label="Language">
            {(["en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                data-lang={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 uppercase transition-colors duration-300 ${lang === l ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

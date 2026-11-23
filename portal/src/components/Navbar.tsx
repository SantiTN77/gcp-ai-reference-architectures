"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const NAV_LINKS = [
  { href: "/", label: "Blueprints" },
  { href: "/adrs", label: "ADRs" },
  { href: "/calculator", label: "Cost calculator" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-medium tracking-tight">
            GCP <span className="font-serif text-lg italic text-accent">+</span> AI Reference Architectures
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/blueprints") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors duration-300 sm:text-sm ${
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
                {label}
              </Link>
            );
          })}
          <a
            href="https://github.com/SantiTN77/gcp-ai-reference-architectures"
            target="_blank"
            rel="noreferrer"
            className="ml-1 hidden rounded-full border border-line-strong px-3 py-1.5 text-sm transition-colors hover:border-ink md:inline-flex"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

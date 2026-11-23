"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, BookOpen, Calculator, ShieldCheck, ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Blueprints", icon: Layers },
  { href: "/adrs", label: "ADRs (6)", icon: BookOpen },
  { href: "/calculator", label: "GCP Cost Calculator", icon: Calculator },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-100 text-sm sm:text-base tracking-tight">
              GCP + AI Reference Architectures
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Zero-Fluff Enterprise Blueprints &amp; ADRs
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname.startsWith("/blueprints")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}

          <a
            href="https://github.com/SantiTN77/gcp-ai-reference-architectures"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-500 transition-colors ml-1"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>
      </div>
    </header>
  );
}

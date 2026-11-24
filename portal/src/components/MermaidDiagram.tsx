"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { EASE } from "./Reveal";
import { STRINGS, useLang } from "@/lib/i18n";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  subtitle?: string;
}

let mermaidInitialized = false;

export function MermaidDiagram({ chart, title, subtitle }: MermaidDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [showSource, setShowSource] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [lang] = useLang();
  const t = STRINGS[lang];

  useEffect(() => {
    let cancelled = false;
    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            securityLevel: "strict",
            fontFamily: "var(--font-geist), ui-sans-serif, system-ui, sans-serif",
            flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
            sequence: { useMaxWidth: true, actorMargin: 40, messageMargin: 32 },
            themeVariables: {
              background: "#fbfaf6",
              primaryColor: "#fbfaf6",
              primaryTextColor: "#151412",
              primaryBorderColor: "#151412",
              secondaryColor: "#f3f1ea",
              tertiaryColor: "#eae6db",
              lineColor: "#6e6a60",
              textColor: "#151412",
              clusterBkg: "#f3f1ea",
              clusterBorder: "#bdb6a6",
              edgeLabelBackground: "#fbfaf6",
              actorBkg: "#fbfaf6",
              actorBorder: "#151412",
              actorTextColor: "#151412",
              actorLineColor: "#bdb6a6",
              signalColor: "#3b3934",
              signalTextColor: "#151412",
              noteBkgColor: "#f6dfd5",
              noteBorderColor: "#d4471c",
              noteTextColor: "#151412",
              labelBoxBkgColor: "#eae6db",
              labelBoxBorderColor: "#bdb6a6",
              activationBkgColor: "#f6dfd5",
              activationBorderColor: "#d4471c",
            },
          });
          mermaidInitialized = true;
        }
        const { svg: renderedSvg } = await mermaid.render(`mmd-${reactId}-${Date.now()}`, chart.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render Mermaid diagram");
      }
    }
    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink";

  return (
    <figure className="card my-6 overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          {title ? <h3 className="text-base font-medium tracking-tight text-ink">{title}</h3> : null}
          {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setScale((s) => Math.max(0.6, +(s - 0.15).toFixed(2)))} className={iconBtn} title="Zoom out" aria-label={t.zoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-11 text-center font-mono text-[11px] text-ink-muted">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((s) => Math.min(2.4, +(s + 0.15).toFixed(2)))} className={iconBtn} title="Zoom in" aria-label={t.zoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setScale(1)} className={iconBtn} title="Reset zoom" aria-label={t.reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSource((v) => !v)}
            className={`ml-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              showSource ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"
            }`}
          >
            {t.sourceBtn}
          </button>
          <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-xs transition-colors hover:border-ink">
            {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </figcaption>

      {error ? (
        <div className="bg-bad-soft p-4 font-mono text-xs text-bad">Mermaid render error: {error}</div>
      ) : (
        <div className="flex min-h-[280px] items-start justify-center overflow-auto bg-[radial-gradient(circle_at_1px_1px,#d8d3c6_1px,transparent_0)] bg-[length:22px_22px] p-5 sm:p-8">
          {svg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mermaid-canvas flex w-full origin-top justify-center"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="shimmer mt-20 h-2 w-48 rounded-full bg-paper-deep" />
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showSource ? (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden bg-ink font-mono text-xs text-paper/85"
          >
            <code className="block overflow-x-auto p-5">{chart}</code>
          </motion.pre>
        ) : null}
      </AnimatePresence>
    </figure>
  );
}

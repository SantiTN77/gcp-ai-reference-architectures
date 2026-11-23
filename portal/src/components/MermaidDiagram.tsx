"use client";

import { useEffect, useId, useState } from "react";
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, Code2 } from "lucide-react";

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

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: "basis",
            },
            sequence: {
              useMaxWidth: true,
              actorMargin: 40,
              messageMargin: 32,
            },
            themeVariables: {
              darkMode: true,
              background: "#0f172a",
              primaryColor: "#1e293b",
              primaryTextColor: "#f8fafc",
              primaryBorderColor: "#38bdf8",
              lineColor: "#64748b",
              secondaryColor: "#0f172a",
              tertiaryColor: "#111827",
              clusterBkg: "#0b1220",
              clusterBorder: "#334155",
              actorBkg: "#1e293b",
              actorBorder: "#10b981",
              actorTextColor: "#f8fafc",
              signalColor: "#94a3b8",
              signalTextColor: "#e2e8f0",
            },
          });
          mermaidInitialized = true;
        }

        const renderId = `mmd-${reactId}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(renderId, chart.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render Mermaid diagram");
        }
      }
    }

    renderDiagram();
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

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1321] overflow-hidden my-5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.0, Number((s + 0.15).toFixed(2))))}
            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            title="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSource((v) => !v)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              showSource
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Source</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-950/40 text-red-300 text-xs font-mono">
          Mermaid Render Error: {error}
        </div>
      ) : (
        <div className="p-4 sm:p-6 overflow-x-auto bg-[#0b101d] min-h-[240px] flex items-center justify-center">
          {svg ? (
            <div
              className="w-full flex justify-center transition-transform origin-top"
              style={{ transform: `scale(${scale})` }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="text-xs font-mono text-slate-500 animate-pulse">
              Rendering verified Mermaid SVG...
            </div>
          )}
        </div>
      )}

      {showSource && (
        <pre className="p-4 border-t border-slate-800 bg-slate-950 text-xs font-mono text-sky-200 overflow-x-auto">
          <code>{chart}</code>
        </pre>
      )}
    </div>
  );
}

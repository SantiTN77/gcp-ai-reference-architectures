"use client";

import { useMemo, useState } from "react";
import {
  BLUEPRINT_COST_PRESETS,
  calculateBlueprintCost,
  type BlueprintId,
  type TierKey,
} from "@/lib/cost-models";
import { DollarSign, TrendingDown, Sliders, CheckCircle2 } from "lucide-react";

const BLUEPRINT_IDS: BlueprintId[] = [
  "01-technical-support-automation",
  "02-contract-processing-pipeline",
  "03-internal-sql-analytics-agent",
];

function fmtUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CostCalculator() {
  const [blueprintId, setBlueprintId] = useState<BlueprintId>("01-technical-support-automation");
  const preset = BLUEPRINT_COST_PRESETS[blueprintId];
  const [volume, setVolume] = useState<number>(preset.tiers.growth.volume);
  const [flashShare, setFlashShare] = useState<number>(preset.defaultFlashPct);
  const [amortizeSharedVpc, setAmortizeSharedVpc] = useState<boolean>(false);

  const handleSelectBlueprint = (id: BlueprintId) => {
    const next = BLUEPRINT_COST_PRESETS[id];
    setBlueprintId(id);
    setVolume(next.tiers.growth.volume);
    setFlashShare(next.defaultFlashPct);
  };

  const result = useMemo(
    () => calculateBlueprintCost(blueprintId, volume, flashShare, amortizeSharedVpc),
    [blueprintId, volume, flashShare, amortizeSharedVpc]
  );

  const tierComparison = useMemo(() => {
    const keys: TierKey[] = ["pilot", "growth", "enterprise"];
    return keys.map((k) => {
      const t = preset.tiers[k];
      return {
        key: k,
        label: t.label,
        calc: calculateBlueprintCost(blueprintId, t.volume, preset.defaultFlashPct, amortizeSharedVpc),
      };
    });
  }, [blueprintId, preset, amortizeSharedVpc]);

  return (
    <div className="space-y-8">
      {/* Blueprint Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {BLUEPRINT_IDS.map((id) => {
          const p = BLUEPRINT_COST_PRESETS[id];
          const active = id === blueprintId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectBlueprint(id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active
                  ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                  : "bg-[#0d1321] border-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              <div className="text-xs font-mono text-emerald-400 mb-1">
                Default Split: {p.defaultFlashPct}% Flash / {100 - p.defaultFlashPct}% Pro
              </div>
              <div className="font-semibold text-sm">{p.name}</div>
            </button>
          );
        })}
      </div>

      {/* Controls + KPI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0d1321] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Workload &amp; FinOps Controls
            </h2>
            <div className="flex gap-1.5">
              {(["pilot", "growth", "enterprise"] as TierKey[]).map((tierKey) => {
                const t = preset.tiers[tierKey];
                const isSelected = volume === t.volume;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => {
                      setVolume(t.volume);
                      setFlashShare(preset.defaultFlashPct);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Monthly Volume</span>
              <span className="font-mono font-semibold text-emerald-300">
                {volume.toLocaleString("en-US")} {preset.unitLabel}
              </span>
            </div>
            <input
              type="range"
              min={preset.minVolume}
              max={preset.maxVolume}
              step={preset.step}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">
                Gemini 3.8 Flash Share (vs Gemini Pro Escalation)
              </span>
              <span className="font-mono font-semibold text-sky-300">
                {flashShare}% Flash / {100 - flashShare}% Pro
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={flashShare}
              onChange={(e) => setFlashShare(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={amortizeSharedVpc}
              onChange={(e) => setAmortizeSharedVpc(e.target.checked)}
              className="mt-1 accent-emerald-500"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-100">
                Amortize Shared VPC Networking (ALB + Cloud NAT + PSC)
              </span>
              <div className="text-slate-400">
                Check this if deploying into an existing Enterprise Shared VPC with centralized egress &amp; ingress load balancers.
              </div>
            </div>
          </label>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Estimated Monthly GCP Spend
            </div>
            <div className="text-3xl font-bold font-mono text-white mt-2">
              {fmtUsd(result.totalMonthlyUsd)}
              <span className="text-sm font-normal text-slate-400"> / mo</span>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-1">
              Unit economics: ${result.unitCostUsd.toFixed(4)} per unit
            </div>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
            <div className="text-xs uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4" />
              Flash/Pro Routing Savings vs 100% Pro
            </div>
            <div className="text-2xl font-bold font-mono text-sky-200 mt-2">
              {fmtUsd(result.routingSavingsUsd)}
              <span className="text-sm font-normal text-slate-400"> / mo saved</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              100% Pro baseline would cost {fmtUsd(result.allProMonthlyUsd)}/mo.
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1321] p-4 flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{result.baselineNotes}</span>
          </div>
        </div>
      </div>

      {/* Line-Item Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1321] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Per-Service Monthly Cost Breakdown (Matches Blueprint Architecture Nodes)
          </h3>
          <span className="text-xs font-mono text-slate-400">us-central1 On-Demand</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/90 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">GCP Service</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Formula / Sizing Assumption</th>
                <th className="py-3 px-6 text-right">Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {result.lineItems.map((item) => (
                <tr key={item.service} className="hover:bg-slate-900/40">
                  <td className="py-3 px-6 font-medium text-slate-100">{item.service}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 font-mono">{item.formula}</td>
                  <td className="py-3 px-6 text-right font-mono text-slate-100">
                    {fmtUsd(item.monthlyUsd)}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-500/10 font-semibold">
                <td className="py-3.5 px-6 text-emerald-300" colSpan={3}>
                  Total Estimated Monthly Cost
                </td>
                <td className="py-3.5 px-6 text-right font-mono text-emerald-300 text-base">
                  {fmtUsd(result.totalMonthlyUsd)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Tier Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tierComparison.map(({ key, label, calc }) => (
          <div key={key} className="rounded-xl border border-slate-800 bg-[#0d1321] p-5">
            <div className="text-xs font-mono text-slate-400 uppercase">{label}</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {fmtUsd(calc.totalMonthlyUsd)}/mo
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ${calc.unitCostUsd.toFixed(4)} / unit &bull; Saves {fmtUsd(calc.routingSavingsUsd)} vs 100% Pro
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

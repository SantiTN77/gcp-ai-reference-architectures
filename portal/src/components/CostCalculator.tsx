"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { BLUEPRINT_COST_PRESETS, calculateBlueprintCost, type BlueprintId, type TierKey } from "@/lib/cost-models";
import { EASE } from "./Reveal";
import { COST_ES, STRINGS, tierLabelEs, useLang } from "@/lib/i18n";

const BLUEPRINT_IDS: BlueprintId[] = [
  "01-technical-support-automation",
  "02-contract-processing-pipeline",
  "03-internal-sql-analytics-agent",
];

function fmtUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

/** Number that glides to its new value instead of jumping. */
function Tween({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.7, ease: EASE, onUpdate: (v) => setShown(v) });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return <span className={className}>{fmtUsd(shown)}</span>;
}


export function CostCalculator() {
  const [blueprintId, setBlueprintId] = useState<BlueprintId>("01-technical-support-automation");
  const preset = BLUEPRINT_COST_PRESETS[blueprintId];
  const [volume, setVolume] = useState<number>(preset.tiers.growth.volume);
  const [flashShare, setFlashShare] = useState<number>(preset.defaultFlashPct);
  const [amortizeSharedVpc, setAmortizeSharedVpc] = useState<boolean>(false);
  const [lang] = useLang();
  const t = STRINGS[lang];
  const es = lang === "es";
  const tierLabel = (l: string) => (es ? tierLabelEs(l) : l);
  const unit = es ? (COST_ES.units[preset.unitLabel] ?? preset.unitLabel) : preset.unitLabel;

  const handleSelectBlueprint = (id: BlueprintId) => {
    const next = BLUEPRINT_COST_PRESETS[id];
    setBlueprintId(id);
    setVolume(next.tiers.growth.volume);
    setFlashShare(next.defaultFlashPct);
  };

  const result = useMemo(
    () => calculateBlueprintCost(blueprintId, volume, flashShare, amortizeSharedVpc),
    [blueprintId, volume, flashShare, amortizeSharedVpc],
  );

  const tierComparison = useMemo(() => {
    const keys: TierKey[] = ["pilot", "growth", "enterprise"];
    return keys.map((k) => ({
      key: k,
      label: preset.tiers[k].label,
      calc: calculateBlueprintCost(blueprintId, preset.tiers[k].volume, preset.defaultFlashPct, amortizeSharedVpc),
    }));
  }, [blueprintId, preset, amortizeSharedVpc]);

  const total = Math.max(result.totalMonthlyUsd, 1e-9);
  const volPct = ((volume - preset.minVolume) / (preset.maxVolume - preset.minVolume)) * 100;

  return (
    <div className="space-y-10">
      {/* blueprint picker */}
      <div className="grid grid-cols-1 border-l border-t border-line md:grid-cols-3">
        {BLUEPRINT_IDS.map((id, i) => {
          const p = BLUEPRINT_COST_PRESETS[id];
          const on = id === blueprintId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectBlueprint(id)}
              aria-pressed={on}
              className={`relative border-b border-r border-line p-5 text-left transition-colors duration-500 ${on ? "text-paper" : "hover:bg-card"}`}
            >
              {on ? (
                <motion.span layoutId="calc-bp" className="absolute inset-0 -z-10 bg-ink" transition={{ type: "spring", stiffness: 380, damping: 36 }} />
              ) : null}
              <span className={`font-mono text-[11px] ${on ? "text-accent-soft" : "text-accent"}`}>0{i + 1}</span>
              <span className="mt-2 block text-lg font-medium leading-snug">{(es && COST_ES.names[id]) || p.name}</span>
              <span className={`mt-2 block font-mono text-[11px] ${on ? "text-paper/60" : "text-ink-muted"}`}>
                {t.defaultSplit} {p.defaultFlashPct}% Flash / {100 - p.defaultFlashPct}% Pro
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* controls */}
        <div className="card space-y-8 p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-medium tracking-tight">{t.controls}</h2>
            <div className="isolate flex gap-1 rounded-full border border-line p-0.5">
              {(["pilot", "growth", "enterprise"] as TierKey[]).map((tierKey) => {
                const t = preset.tiers[tierKey];
                const on = volume === t.volume;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => {
                      setVolume(t.volume);
                      setFlashShare(preset.defaultFlashPct);
                    }}
                    className={`relative rounded-full px-3 py-1.5 text-xs transition-colors ${on ? "text-paper" : "text-ink-muted hover:text-ink"}`}
                  >
                    {on ? (
                      <motion.span layoutId="calc-tier" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    ) : null}
                    {tierLabel(t.label)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-soft">{t.volume}</span>
              <span className="font-mono text-sm">
                {volume.toLocaleString("en-US")} {unit}
              </span>
            </div>
            <input
              type="range"
              min={preset.minVolume}
              max={preset.maxVolume}
              step={preset.step}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ background: `linear-gradient(to right, #151412 ${volPct}%, #dcd7ca ${volPct}%)`, height: 3, borderRadius: 9999 }}
            />
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-soft">{t.flash}</span>
              <span className="font-mono text-sm">
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
              className="w-full cursor-pointer"
              style={{ background: `linear-gradient(to right, #d4471c ${flashShare}%, #dcd7ca ${flashShare}%)`, height: 3, borderRadius: 9999 }}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 border-t border-line pt-6">
            <input type="checkbox" checked={amortizeSharedVpc} onChange={(e) => setAmortizeSharedVpc(e.target.checked)} className="mt-1 accent-[#151412]" />
            <span className="text-sm leading-relaxed">
              <span className="font-medium">{t.amortize}</span>
              <span className="block text-ink-muted">{t.amortizeSub}</span>
            </span>
          </label>
        </div>

        {/* totals */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-[18px] bg-ink p-6 text-paper sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">{t.spend}</p>
            <p className="mt-3 font-serif text-6xl leading-none">
              <Tween value={result.totalMonthlyUsd} />
            </p>
            <p className="mt-3 font-mono text-xs text-paper/60">${result.unitCostUsd.toFixed(4)} {t.perUnit}</p>
            <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-white/10">
              {result.lineItems.map((item, i) => (
                <motion.span
                  key={item.service}
                  className="h-full border-r border-ink bg-paper last:border-r-0"
                  animate={{ width: `${(item.monthlyUsd / total) * 100}%` }}
                  transition={{ duration: 0.7, ease: EASE }}
                  style={{ opacity: 1 - (i % 4) * 0.18 }}
                />
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="eyebrow">{t.savings}</p>
            <p className="mt-3 font-serif text-4xl leading-none text-ok">
              <Tween value={result.routingSavingsUsd} />
              <span className="ml-1 font-sans text-sm text-ink-muted">{t.perMonth}</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">{t.baseline} {fmtUsd(result.allProMonthlyUsd)}{t.perMonth}.</p>
          </div>

          <p className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-muted">{(es && COST_ES.notes[result.baselineNotes]) || result.baselineNotes}</p>
        </div>
      </div>

      {/* line items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-base font-medium">{t.breakdown}</h3>
          <span className="font-mono text-[11px] text-ink-muted">us-central1 on-demand</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {t.cols.map((h, i) => (
                  <th key={h} className={`eyebrow px-6 py-3 !text-[10px] font-normal ${i >= 3 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.lineItems.map((item) => (
                <tr key={item.service} className="transition-colors hover:bg-paper/70">
                  <td className="px-6 py-3 font-medium">{item.service}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-muted">{(es && COST_ES.categories[item.category]) || item.category}</span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-ink-muted">{item.formula}</td>
                  <td className="px-6 py-3 text-right font-mono">{fmtUsd(item.monthlyUsd)}</td>
                  <td className="w-40 px-6 py-3">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-paper-deep">
                      <motion.div className="h-full bg-ink" animate={{ width: `${(item.monthlyUsd / total) * 100}%` }} transition={{ duration: 0.7, ease: EASE }} />
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-ink">
                <td className="px-6 py-4 font-medium" colSpan={3}>
                  {t.total}
                </td>
                <td className="px-6 py-4 text-right font-mono text-base font-medium">{fmtUsd(result.totalMonthlyUsd)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* tiers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {tierComparison.map(({ key, label, calc }) => (
          <div key={key} className="border-t border-ink pt-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{tierLabel(label)}</p>
            <p className="mt-2 font-serif text-4xl leading-none">{fmtUsd(calc.totalMonthlyUsd)}</p>
            <p className="mt-2 text-xs text-ink-muted">
              ${calc.unitCostUsd.toFixed(4)} / {t.perUnit} · {t.saves} {fmtUsd(calc.routingSavingsUsd)} {t.vsPro}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

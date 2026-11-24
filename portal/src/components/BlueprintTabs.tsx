"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BlueprintItem } from "@/lib/content";
import { MermaidDiagram } from "./MermaidDiagram";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EASE } from "./Reveal";
import { STRINGS, useLang } from "@/lib/i18n";
import { DocsNote } from "./T";

type TabId = "diagrams" | "overview" | "cost" | "security";

const TAB_IDS: TabId[] = ["diagrams", "overview", "cost", "security"];

export function BlueprintTabs({ blueprint }: { blueprint: BlueprintItem }) {
  const [activeTab, setActiveTab] = useState<TabId>("diagrams");
  const [lang] = useLang();
  const t = STRINGS[lang];

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-5 border-b border-line bg-paper/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex gap-1 overflow-x-auto py-3" role="tablist">
          {TAB_IDS.map((id, i) => {
            const label = t.tabs[i];
            const on = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveTab(id)}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                  on ? "text-paper" : "text-ink-muted hover:text-ink"
                }`}
              >
                {on ? (
                  <motion.span
                    layoutId="bp-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="pt-8"
        >
          {activeTab === "diagrams" ? (
            <div className="space-y-8">
              <MermaidDiagram
                chart={blueprint.architectureDiagram}
                title={t.diagA}
                subtitle={t.diagASub}
              />
              <MermaidDiagram
                chart={blueprint.sequenceDiagram}
                title={t.diagB}
                subtitle={t.diagBSub}
              />
            </div>
          ) : (
            <div className="card p-6 sm:p-10">
              <div className="mx-auto max-w-4xl">
                <DocsNote />
                <MarkdownRenderer
                  content={
                    activeTab === "overview"
                      ? blueprint.readme
                      : activeTab === "cost"
                        ? blueprint.costEstimation
                        : blueprint.securityThreatModel
                  }
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

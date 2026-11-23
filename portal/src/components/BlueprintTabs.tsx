"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BlueprintItem } from "@/lib/content";
import { MermaidDiagram } from "./MermaidDiagram";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EASE } from "./Reveal";

type TabId = "diagrams" | "overview" | "cost" | "security";

const TABS: { id: TabId; label: string }[] = [
  { id: "diagrams", label: "Architecture & Sequence" },
  { id: "overview", label: "Overview & SLOs" },
  { id: "cost", label: "Cost Estimation (3 Tiers)" },
  { id: "security", label: "STRIDE / OWASP Threat Model" },
];

export function BlueprintTabs({ blueprint }: { blueprint: BlueprintItem }) {
  const [activeTab, setActiveTab] = useState<TabId>("diagrams");

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-5 border-b border-line bg-paper/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex gap-1 overflow-x-auto py-3" role="tablist">
          {TABS.map(({ id, label }) => {
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
                title="Network & Security Architecture Diagram"
                subtitle="VPC subnets, Private Service Connect, Cloud NAT, least-privilege IAM, Cloud DLP, Model Armor, KMS / Secret Manager and Vertex AI"
              />
              <MermaidDiagram
                chart={blueprint.sequenceDiagram}
                title="Runtime Request & Security Sequence Diagram"
                subtitle="Auth verification, DLP redaction, tiered Flash / Pro routing, tool guardrails and audit logging"
              />
            </div>
          ) : (
            <div className="card p-6 sm:p-10">
              <div className="mx-auto max-w-4xl">
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

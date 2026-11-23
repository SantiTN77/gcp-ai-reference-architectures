"use client";

import { useState } from "react";
import { Network, FileText, DollarSign, ShieldAlert } from "lucide-react";
import type { BlueprintItem } from "@/lib/content";
import { MermaidDiagram } from "./MermaidDiagram";
import { MarkdownRenderer } from "./MarkdownRenderer";

type TabId = "diagrams" | "overview" | "cost" | "security";

interface BlueprintTabsProps {
  blueprint: BlueprintItem;
}

export function BlueprintTabs({ blueprint }: BlueprintTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("diagrams");

  const tabs: { id: TabId; label: string; icon: typeof Network }[] = [
    { id: "diagrams", label: "Architecture & Sequence", icon: Network },
    { id: "overview", label: "Overview & SLOs", icon: FileText },
    { id: "cost", label: "Cost Estimation (3 Tiers)", icon: DollarSign },
    { id: "security", label: "STRIDE / OWASP Threat Model", icon: ShieldAlert },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "diagrams" && (
        <div className="space-y-6">
          <MermaidDiagram
            chart={blueprint.architectureDiagram}
            title="Network & Security Architecture Diagram"
            subtitle="VPC subnets, Private Service Connect, Cloud NAT, IAM least-privilege boundaries, Cloud DLP, Model Armor, KMS/Secret Manager & Vertex AI"
          />
          <MermaidDiagram
            chart={blueprint.sequenceDiagram}
            title="Runtime Request & Security Sequence Diagram"
            subtitle="End-to-end auth verification, DLP redaction/tokenization, tiered Flash/Pro routing, tool guardrails & audit logging"
          />
        </div>
      )}

      {activeTab === "overview" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1321] p-6 sm:p-8">
          <MarkdownRenderer content={blueprint.readme} />
        </div>
      )}

      {activeTab === "cost" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1321] p-6 sm:p-8">
          <MarkdownRenderer content={blueprint.costEstimation} />
        </div>
      )}

      {activeTab === "security" && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1321] p-6 sm:p-8">
          <MarkdownRenderer content={blueprint.securityThreatModel} />
        </div>
      )}
    </div>
  );
}

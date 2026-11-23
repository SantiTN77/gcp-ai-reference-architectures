import { CostCalculator } from "@/components/CostCalculator";

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Interactive Monthly GCP FinOps Cost Calculator
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl">
          Model exact monthly GCP spend across all 3 Enterprise AI Reference Blueprints. Adjust
          monthly workload volume, Gemini 3.8 Flash vs Gemini Pro routing ratios, and Shared VPC
          networking amortization using the exact formulas documented in each blueprint&apos;s{" "}
          <code className="text-sky-300">cost-estimation.md</code>.
        </p>
      </div>
      <CostCalculator />
    </div>
  );
}

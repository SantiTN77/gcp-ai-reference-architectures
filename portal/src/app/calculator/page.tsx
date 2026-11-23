import { CostCalculator } from "@/components/CostCalculator";
import { Reveal } from "@/components/Reveal";

export default function CalculatorPage() {
  return (
    <div>
      <Reveal className="pb-10 pt-14 md:pt-20">
        <p className="eyebrow">us-central1 · on-demand · formulas from each cost-estimation.md</p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium leading-[1] tracking-[-0.04em] md:text-6xl">
          What will it cost <span className="font-serif italic text-accent">every month?</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Pick a blueprint, set the monthly volume and the Gemini Flash vs Pro routing split. Every line item maps to a node
          in the architecture diagram.
        </p>
      </Reveal>
      <CostCalculator />
    </div>
  );
}

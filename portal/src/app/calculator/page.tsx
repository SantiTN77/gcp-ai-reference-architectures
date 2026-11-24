import { CostCalculator } from "@/components/CostCalculator";
import { Reveal } from "@/components/Reveal";
import { T } from "@/components/T";

export default function CalculatorPage() {
  return (
    <div>
      <Reveal className="pb-10 pt-14 md:pt-20">
        <p className="eyebrow">
          <T k="calcEyebrow" />
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium leading-[1] tracking-[-0.04em] md:text-6xl">
          <T k="calcA" />{" "}
          <span className="font-serif italic text-accent">
            <T k="calcB" />
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          <T k="calcLede" />
        </p>
      </Reveal>
      <CostCalculator />
    </div>
  );
}

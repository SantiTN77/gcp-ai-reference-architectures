import { getAdrs } from "@/lib/content";
import { AdrSearch } from "@/components/AdrSearch";

export default function AdrsPage() {
  const adrs = getAdrs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Architecture Decision Records (ADRs)
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl">
          Every core infrastructure, privacy, model-routing, and agent-interoperability decision
          documented in MADR format with break-even math, trade-off matrices, and explicit revisit triggers.
        </p>
      </div>
      <AdrSearch adrs={adrs} />
    </div>
  );
}

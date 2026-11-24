import { getAdrs } from "@/lib/content";
import { AdrSearch } from "@/components/AdrSearch";
import { Reveal } from "@/components/Reveal";
import { T } from "@/components/T";

export default function AdrsPage() {
  const adrs = getAdrs();
  return (
    <div>
      <Reveal className="pb-10 pt-14 md:pt-20">
        <p className="eyebrow">
          <T k="adrEyebrow" />
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-5xl font-medium leading-[1] tracking-[-0.04em] md:text-6xl">
          <T k="adrA" />{" "}
          <span className="font-serif italic text-accent">
            <T k="adrB" />
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          <T k="adrLede" />
        </p>
      </Reveal>
      <AdrSearch adrs={adrs} />
    </div>
  );
}

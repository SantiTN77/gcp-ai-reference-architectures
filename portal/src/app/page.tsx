import { getBlueprints, getAdrs } from "@/lib/content";
import { HomeView } from "@/components/HomeView";

export default function HomePage() {
  const blueprints = getBlueprints().map((b) => ({
    slug: b.slug,
    number: b.number,
    shortTitle: b.shortTitle,
    tagline: b.tagline,
    tags: b.tags,
    pilotCost: b.pilotCost,
    growthCost: b.growthCost,
    enterpriseCost: b.enterpriseCost,
    routingSplit: b.routingSplit,
  }));
  const adrs = getAdrs().map((a) => ({ slug: a.slug, id: a.id, title: a.title, appliesTo: a.appliesTo }));
  return <HomeView blueprints={blueprints} adrs={adrs} />;
}

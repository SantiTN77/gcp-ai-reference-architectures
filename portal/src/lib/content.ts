import bundle from "@/generated/content-bundle.json";

export interface BlueprintItem {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  tagline: string;
  tierUnit: string;
  pilotCost: string;
  growthCost: string;
  enterpriseCost: string;
  routingSplit: string;
  sloHighlight: string;
  tags: string[];
  readme: string;
  architectureDiagram: string;
  sequenceDiagram: string;
  costEstimation: string;
  securityThreatModel: string;
}

export interface AdrItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  date: string;
  appliesTo: string;
  summary: string;
  decisionOutcome: string;
  content: string;
}

export function getBlueprints(): BlueprintItem[] {
  return bundle.blueprints as BlueprintItem[];
}

export function getBlueprintBySlug(slug: string): BlueprintItem | undefined {
  return getBlueprints().find((b) => b.slug === slug);
}

export function getAdrs(): AdrItem[] {
  return bundle.adrs as AdrItem[];
}

export function getAdrBySlug(slug: string): AdrItem | undefined {
  return getAdrs().find((a) => a.slug === slug);
}

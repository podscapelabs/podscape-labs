export type GuideStatus = "draft" | "published";

export type GuideSection = {
  id: string;
  heading: string;
  body: string;
};

export type GuideRecord = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  status: GuideStatus;
  sections: GuideSection[];
  caution: string;
  relatedSpeciesSlugs: string[];
  archivedAt?: string | null;
  updatedAt: string;
};

export const guideCategories = [
  "Getting Started",
  "Housing",
  "Substrate",
  "Moisture",
  "Ventilation",
  "Feeding",
  "Colony Management",
] as const;

export function isGuideActive(guide: GuideRecord) {
  return !guide.archivedAt;
}

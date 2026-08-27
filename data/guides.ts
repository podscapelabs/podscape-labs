export type GuideRecord = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  status: "draft";
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

export const guideDrafts: GuideRecord[] = [
  {
    slug: "article-template",
    category: "Template preview",
    title: "Field Guide article template",
    summary: "A layout preview for future studio-authored husbandry material.",
    status: "draft",
  },
];

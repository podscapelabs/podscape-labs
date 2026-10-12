import type { GuideSection } from "@/data/guides";

export type LabStatus = "draft" | "published";

export type LabRecord = {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  status: LabStatus;
  publishedAt: string;
  sections: GuideSection[];
  tags: string[];
  relatedHref: string;
  relatedLabel: string;
  archivedAt?: string | null;
  updatedAt: string;
};

export const labCategories = [
  "Studio Update",
  "Leaf Ledger",
  "PodBound",
  "Field Guide",
  "Shop",
  "Research Note",
  "Behind the Scenes",
] as const;

export function isLabRecordActive(record: LabRecord) {
  return !record.archivedAt;
}

export function labRecordDate(record: LabRecord) {
  const date = record.publishedAt || record.updatedAt;
  return new Date(date).toLocaleDateString("en-CA", { dateStyle: "medium" });
}

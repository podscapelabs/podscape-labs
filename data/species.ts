export type SpeciesStatus = "draft" | "published";
export type SpeciesIdentityStatus = "unassigned" | "provisional" | "verified";
export type SpeciesRecordKind = "photo-test" | "species";

export type SpeciesRecord = {
  id: string;
  slug: string;
  kind: SpeciesRecordKind;
  status: SpeciesStatus;
  identityStatus: SpeciesIdentityStatus;
  commonName: string;
  scientificName: string;
  genus: string;
  species: string;
  morph: string;
  catalogueNumber: string;
  image: string | null;
  imageAlt: string;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  summary: string;
  tags: string[];
  /** Up to four concise, editorially verified distinguishing traits. */
  notableTraits?: string[];
  careLevel: string;
  moisture: string;
  /** Editorially selected general captive moisture tendency; never derived from legacy labels. */
  moistureProfile?: "dry-leaning" | "dry-balanced" | "balanced" | "balanced-moist" | "moist-leaning" | "";
  moistureNote?: string;
  /** Optional concise context. No inferred husbandry instructions. */
  ventilationNote?: string;
  temperatureNote?: string;
  activityNote?: string;
  reproductionNote?: string;
  /** Observed feeding enthusiasm, separate from diet and portion guidance. */
  feedingResponse?: string;
  feedingResponseNote?: string;
  temperature: string;
  ventilation: string;
  reproduction?: string;
  activity?: string;
  substrate: string;
  feeding: string;
  about: string;
  keeperNotes: string;
  fieldGuideLinks: string[];
  archivedAt?: string | null;
  updatedAt: string;
};

export function isSpeciesRecordActive(record: SpeciesRecord) {
  return !record.archivedAt;
}

export function speciesDisplayName(record: SpeciesRecord) {
  return record.commonName.trim() || "Identity not assigned";
}

export function speciesScientificName(record: SpeciesRecord) {
  return record.scientificName.trim() || "Awaiting identification";
}

export function speciesGenus(record: SpeciesRecord) {
  return record.genus.trim() || "Unassigned";
}

export function speciesRecordLabel(record: SpeciesRecord) {
  if (record.kind === "photo-test") return "Temporary photo test";
  if (record.identityStatus === "verified") return "Verified species record";
  if (record.identityStatus === "provisional") return "Provisional identity";
  return "Draft species record";
}

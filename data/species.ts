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
  summary: string;
  tags: string[];
  careLevel: string;
  moisture: string;
  temperature: string;
  ventilation: string;
  substrate: string;
  feeding: string;
  about: string;
  keeperNotes: string;
  fieldGuideLinks: string[];
  updatedAt: string;
};

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

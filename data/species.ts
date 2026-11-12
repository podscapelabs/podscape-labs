export type SpeciesStatus = "draft" | "published";
export type SpeciesIdentityStatus = "unassigned" | "provisional" | "verified";
export type SpeciesRecordKind = "photo-test" | "species";
export type OrganismGroup = "isopod" | "springtail";
export function speciesOrganismGroup(record:Pick<SpeciesRecord,"organismGroup">):OrganismGroup{return record.organismGroup==="springtail"?"springtail":"isopod"}

export type SpeciesRecord = {
  id: string;
  slug: string;
  kind: SpeciesRecordKind;
  /** The Ledger includes distinct isopod and Collembola collections. Missing legacy data = isopod. */
  organismGroup?: OrganismGroup;
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
  /** Legacy card text fallback; new species should use About for their introduction. */
  summary: string;
  tags: string[];
  /** Up to five concise, editorially verified distinguishing traits. */
  notableTraits?: string[];
  careLevel: string;
  moisture: string;
  /** Editorially selected general captive moisture tendency; never derived from legacy labels. */
  moistureProfile?: "dry-leaning" | "dry-balanced" | "balanced" | "balanced-moist" | "moist-leaning" | "";
  /** Editorially reviewed substrate-moisture range, five ordinal categories (1 dry ... 5 very damp). */
  moistureRangeStart?: number | null;
  moistureRangeEnd?: number | null;
  /** Legacy moisture note; new entries use moistureGradientGuidance. */
  moistureNote?: string;
  /** Optional concise context. No inferred husbandry instructions. */
  ventilationNote?: string;
  temperatureNote?: string;
  /** Legacy activity note; new entries use visibilityNotes. */
  activityNote?: string;
  reproductionNote?: string;
  /** Observed feeding enthusiasm, separate from diet and portion guidance. */
  /** Legacy, subjective feeding rating. Not used in new profiles. */
  feedingResponse?: string;
  /** Legacy feeding rating explanation, retained for historical compatibility. */
  feedingResponseNote?: string;
  temperature: string;
  ventilation: string;
  reproduction?: string;
  activity?: string;
  substrate: string;
  feeding: string;
  about: string;
  /** Optional researched facts. Blank / missing values are never inferred. */
  taxonomicStatus?: string;
  taxonomicSynonyms?: string;
  nativeDistribution?: string;
  naturalMicrohabitat?: string;
  morphOrigin?: string;
  identificationNotes?: string;
  adultSizeMm?: string;
  lifespan?: string;
  humidityMin?: string;
  humidityMax?: string;
  moistZoneCoverage?: string;
  moistRefugeCondition?: string;
  moistureGradientGuidance?: string;
  substrateDepth?: string;
  enclosureGuidance?: string;
  broodAverage?: string;
  broodMin?: string;
  broodMax?: string;
  incubationPeriod?: string;
  maturityAge?: string;
  breedingSeason?: string;
  stapleDiet?: string;
  proteinGuidance?: string;
  calciumGuidance?: string;
  dietaryCautions?: string;
  defensiveBehaviour?: string;
  visibilityNotes?: string;
  bioactiveSuitability?: string;
  researchSources?: string;
  evidenceScope?: string;
  evidenceQuality?: string;
  evidenceNotes?: string;
  lastReviewed?: string;
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

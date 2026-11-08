import type { SpeciesRecord } from "@/data/species";

/** Search-only aliases from explicitly entered identity; never infer traits or care claims. */
export function generateSpeciesSearchTags(
  record: Pick<SpeciesRecord, "commonName" | "scientificName" | "genus" | "species" | "morph" | "slug">,
): string[] {
  const values = [
    record.commonName,
    record.scientificName,
    record.genus,
    record.species,
    record.morph,
    record.slug.replace(/-/g, " "),
    [record.genus, record.species].filter(Boolean).join(" "),
    [record.genus, record.species, record.morph].filter(Boolean).join(" "),
    [record.commonName, record.morph].filter(Boolean).join(" "),
  ];
  const tags = new Map<string, string>();
  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ").slice(0, 160);
    if (clean && !tags.has(clean.toLocaleLowerCase())) tags.set(clean.toLocaleLowerCase(), clean);
  }
  return [...tags.values()];
}

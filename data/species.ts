export type SpeciesRecord = {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  genus: string;
  catalogueNumber: string;
  image: string | null;
  status: "draft" | "published";
  summary: string;
  tags: string[];
  careLevel: string | null;
  moisture: string | null;
  temperature: string | null;
  ventilation: string | null;
};

// Species photography and studio-authored husbandry fields remain intentionally
// empty until the owner supplies approved records and images.
export const speciesRecords: SpeciesRecord[] = [
  {
    id: "armadillidium-vulgare",
    slug: "armadillidium-vulgare",
    commonName: "Common pillbug",
    scientificName: "Armadillidium vulgare",
    genus: "Armadillidium",
    catalogueNumber: "LL-001",
    image: null,
    status: "draft",
    summary: "Studio record in preparation.",
    tags: [],
    careLevel: null,
    moisture: null,
    temperature: null,
    ventilation: null,
  },
  {
    id: "porcellio-scaber",
    slug: "porcellio-scaber",
    commonName: "Rough woodlouse",
    scientificName: "Porcellio scaber",
    genus: "Porcellio",
    catalogueNumber: "LL-002",
    image: null,
    status: "draft",
    summary: "Studio record in preparation.",
    tags: [],
    careLevel: null,
    moisture: null,
    temperature: null,
    ventilation: null,
  },
  {
    id: "armadillidium-maculatum",
    slug: "armadillidium-maculatum",
    commonName: "Zebra isopod",
    scientificName: "Armadillidium maculatum",
    genus: "Armadillidium",
    catalogueNumber: "LL-003",
    image: null,
    status: "draft",
    summary: "Studio record in preparation.",
    tags: [],
    careLevel: null,
    moisture: null,
    temperature: null,
    ventilation: null,
  },
  {
    id: "porcellio-laevis",
    slug: "porcellio-laevis",
    commonName: "Smooth isopod",
    scientificName: "Porcellio laevis",
    genus: "Porcellio",
    catalogueNumber: "LL-004",
    image: null,
    status: "draft",
    summary: "Studio record in preparation.",
    tags: [],
    careLevel: null,
    moisture: null,
    temperature: null,
    ventilation: null,
  },
  {
    id: "porcellionides-pruinosus",
    slug: "porcellionides-pruinosus",
    commonName: "Powder isopod",
    scientificName: "Porcellionides pruinosus",
    genus: "Porcellionides",
    catalogueNumber: "LL-005",
    image: null,
    status: "draft",
    summary: "Studio record in preparation.",
    tags: [],
    careLevel: null,
    moisture: null,
    temperature: null,
    ventilation: null,
  },
];

export function getSpecies(slug: string) {
  return speciesRecords.find((record) => record.slug === slug);
}

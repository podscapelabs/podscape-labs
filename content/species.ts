export type SpeciesStatus = "draft" | "scheduled" | "published";

export type SpeciesRecord = {
  id: string;
  slug: string;
  poddexNumber: number;
  scientificName: string;
  commonName: string | null;
  genus: string;
  image: string | null;
  origin: string | null;
  summary: string;
  releaseWave: string;
  releaseDate: string;
  status: SpeciesStatus;
};

export const species: SpeciesRecord[] = [
  {
    id: "armadillidium-maculatum",
    slug: "armadillidium-maculatum",
    poddexNumber: 3,
    scientificName: "Armadillidium maculatum",
    commonName: "Zebra isopod",
    genus: "Armadillidium",
    image: null,
    origin: "Southern Europe",
    summary: "A boldly marked Armadillidium species selected as an early visual anchor for the PodDex field archive.",
    releaseWave: "Launch group",
    releaseDate: "2026-08-26",
    status: "published",
  },
  {
    id: "porcellio-scaber",
    slug: "porcellio-scaber",
    poddexNumber: 2,
    scientificName: "Porcellio scaber",
    commonName: "Rough woodlouse",
    genus: "Porcellio",
    image: null,
    origin: "Europe",
    summary: "A familiar, widely observed species with a durable place in both field records and the keeping hobby.",
    releaseWave: "Launch group",
    releaseDate: "2026-08-19",
    status: "published",
  },
  {
    id: "armadillidium-vulgare",
    slug: "armadillidium-vulgare",
    poddexNumber: 1,
    scientificName: "Armadillidium vulgare",
    commonName: "Common pillbug",
    genus: "Armadillidium",
    image: null,
    origin: "Europe",
    summary: "A foundational species record and a natural starting point for the PodDex catalogue.",
    releaseWave: "Launch group",
    releaseDate: "2026-08-12",
    status: "published",
  },
  {
    id: "porcellio-laevis",
    slug: "porcellio-laevis",
    poddexNumber: 4,
    scientificName: "Porcellio laevis",
    commonName: "Smooth isopod",
    genus: "Porcellio",
    image: null,
    origin: null,
    summary: "A substantial Porcellio species prepared as part of the first expansion beyond the launch records.",
    releaseWave: "Wave 02",
    releaseDate: "2026-09-02",
    status: "scheduled",
  },
  {
    id: "porcellionides-pruinosus",
    slug: "porcellionides-pruinosus",
    poddexNumber: 5,
    scientificName: "Porcellionides pruinosus",
    commonName: "Powder isopod",
    genus: "Porcellionides",
    image: null,
    origin: null,
    summary: "A quick-moving species group with a strong presence in the hobby and a record scheduled for Wave 02.",
    releaseWave: "Wave 02",
    releaseDate: "2026-09-09",
    status: "scheduled",
  },
  {
    id: "armadillidium-gestroi",
    slug: "armadillidium-gestroi",
    poddexNumber: 6,
    scientificName: "Armadillidium gestroi",
    commonName: "Yellow-spotted isopod",
    genus: "Armadillidium",
    image: null,
    origin: null,
    summary: "A high-contrast Armadillidium record planned for the second PodDex release wave.",
    releaseWave: "Wave 02",
    releaseDate: "2026-09-16",
    status: "scheduled",
  },
  {
    id: "cubaris-murina",
    slug: "cubaris-murina",
    poddexNumber: 7,
    scientificName: "Cubaris murina",
    commonName: null,
    genus: "Cubaris",
    image: null,
    origin: null,
    summary: "A future catalogue record currently being prepared for a later PodDex release wave.",
    releaseWave: "Future record",
    releaseDate: "2026-10-07",
    status: "draft",
  },
];

export const visibleSpecies = species.filter((record) => record.status !== "draft");
export const publishedSpecies = species.filter((record) => record.status === "published");
export const scheduledSpecies = species.filter((record) => record.status === "scheduled");

export function formatPodDexNumber(value: number) {
  return `PDX-${String(value).padStart(3, "0")}`;
}

export function formatReleaseDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getSpeciesBySlug(slug: string) {
  return species.find((record) => record.slug === slug);
}

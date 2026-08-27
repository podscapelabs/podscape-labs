export type PlatformArea = {
  key: "ledger" | "podbound" | "guide" | "creative" | "directory";
  title: string;
  description: string;
  href: string;
};

export const platformAreas: PlatformArea[] = [
  {
    key: "ledger",
    title: "Leaf Ledger",
    description: "Browse species, build your collection, and keep track of what you care for.",
    href: "/ledger",
  },
  {
    key: "podbound",
    title: "PodBound",
    description: "A tabletop game built around forecast, choice, and colony management.",
    href: "https://www.podbound.net",
  },
  {
    key: "guide",
    title: "Field Guide",
    description: "Practical care, husbandry notes, and resources for isopod keepers.",
    href: "/field-guide",
  },
  {
    key: "creative",
    title: "Creative Network",
    description: "Find independent artists and creators working with the hobby.",
    href: "/explore#creative-network",
  },
  {
    key: "directory",
    title: "Vendor Directory",
    description: "Discover reputable vendors, breeders, and hobby suppliers.",
    href: "/explore#vendor-directory",
  },
];

export const labBench = [
  { status: "Cataloguing", area: "Leaf Ledger", detail: "Species records are being prepared", tone: "ledger" },
  { status: "Testing", area: "PodBound 2.0", detail: "Playtesting in progress", tone: "podbound" },
  { status: "Building", area: "Creative Network", detail: "Platform structure in development", tone: "creative" },
  { status: "Researching", area: "Field Guide", detail: "Husbandry material in development", tone: "guide" },
] as const;

export const updates = [
  { category: "Studio", title: "Platform rebuild", description: "A new Podscape structure is taking shape.", date: "In progress", href: "/from-the-lab" },
  { category: "Leaf Ledger", title: "Catalogue foundation", description: "The first species-record system is being assembled.", date: "In progress", href: "/ledger" },
  { category: "PodBound", title: "PodBound 2.0", description: "Development and playtesting continue.", date: "In progress", href: "https://www.podbound.net" },
] as const;

export const navigation = [
  { label: "Explore", href: "/explore" },
  { label: "Leaf Ledger", href: "/ledger" },
  { label: "PodBound", href: "https://www.podbound.net" },
  { label: "Field Guide", href: "/field-guide" },
  { label: "Creative Network", href: "/explore#creative-network" },
  { label: "From the Lab", href: "/from-the-lab" },
] as const;

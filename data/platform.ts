export type PlatformArea = {
  key: "ledger" | "podbound" | "guide" | "shop" | "creative" | "directory";
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
    key: "shop",
    title: "Shop",
    description: "Original tools, field resources, and studio goods for thoughtful keepers.",
    href: "/shop",
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

export const navigation = [
  { label: "Explore", href: "/explore" },
  { label: "Leaf Ledger", href: "/ledger" },
  { label: "My Collection", href: "/ledger/my-collection" },
  { label: "PodBound", href: "https://www.podbound.net" },
  { label: "Field Guide", href: "/field-guide" },
  { label: "Creative Network", href: "/explore#creative-network" },
  { label: "From the Lab", href: "/from-the-lab" },
] as const;

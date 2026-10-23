export type ProductStatus = "draft" | "published";
export type ProductAvailability = "coming-soon" | "in-stock" | "sold-out";

export type ProductRecord = {
  id: string;
  /** Stable ID of source Leaf Ledger species, when linked. */
  ledgerSpeciesId?: string | null;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  priceCents: number;
  currency: "CAD";
  status: ProductStatus;
  availability: ProductAvailability;
  featured: boolean;
  image: string | null;
  imageAlt: string;
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  tags: string[];
  materials: string;
  shippingNote: string;
  archivedAt?: string | null;
  updatedAt: string;
};

export const productCategories = [
  "Isopods & Springtails",
  "Field Tools",
  "Books & Journals",
  "Habitat Supplies",
  "Apparel",
  "Prints & Collectibles",
  "Other",
] as const;

export function isProductActive(product: ProductRecord) {
  return !product.archivedAt;
}

export function formatProductPrice(product: ProductRecord) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: product.currency }).format(product.priceCents / 100);
}

export function productAvailabilityLabel(availability: ProductAvailability) {
  if (availability === "in-stock") return "Ready when checkout launches";
  if (availability === "sold-out") return "Sold out";
  return "Coming soon";
}

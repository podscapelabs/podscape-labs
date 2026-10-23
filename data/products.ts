export type ProductStatus = "draft" | "published";
export type ProductAvailability = "coming-soon" | "in-stock" | "sold-out";

export type ProductVariant = { id: string; label: string; priceCents: number; count?: number; sku?: string; stockQuantity?: number | null; lowStockThreshold?: number };
export type ProductOptionType = "none" | "count" | "size";

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
  /** Null means inventory is not tracked. Existing listings retain that behavior. */
  stockQuantity?: number | null;
  lowStockThreshold?: number;
  sku?: string;
  /** Optional purchase choices; legacy products have no variants. */
  optionType?: ProductOptionType;
  variants?: ProductVariant[];
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
  const prices = product.variants?.length ? product.variants.map(option => option.priceCents) : [product.priceCents];
  const startingAt = prices.length > 1 && new Set(prices).size > 1;
  const value = new Intl.NumberFormat("en-CA", { style: "currency", currency: product.currency }).format(Math.min(...prices) / 100);
  return startingAt ? `From ${value}` : value;
}

export function productAvailabilityLabel(availability: ProductAvailability) {
  if (availability === "in-stock") return "Ready when checkout launches";
  if (availability === "sold-out") return "Sold out";
  return "Coming soon";
}

/** Stock is informational until checkout and fulfillment are implemented. */
export function productStockStatus(product: ProductRecord): "untracked" | "in-stock" | "low-stock" | "out-of-stock" {
  const quantities = product.variants?.length ? product.variants.map(v => v.stockQuantity) : [product.stockQuantity];
  const tracked = quantities.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!tracked.length) return "untracked";
  if (tracked.every(value => value <= 0)) return "out-of-stock";
  const thresholds = product.variants?.length ? product.variants.map(v => v.lowStockThreshold ?? 3) : [product.lowStockThreshold ?? 3];
  return quantities.some((value, i) => typeof value === "number" && value <= thresholds[i]) ? "low-stock" : "in-stock";
}

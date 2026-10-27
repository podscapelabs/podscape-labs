export type ProductStatus = "draft" | "published";
export type ProductAvailability = "coming-soon" | "in-stock" | "sold-out";

export type ProductVariantRecord = {
  id: string;
  title: string;
  sku: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  inventoryTracked: boolean;
  inventoryQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  sortOrder: number;
};

export type ProductInventoryAdjustment = {
  id: string;
  variantId: string;
  variantTitle: string;
  quantityDelta: number;
  quantityAfter: number;
  reason: "initial" | "manual" | "sale" | "return" | "damage" | "correction";
  note: string;
  createdAt: string;
};

export type ProductRecord = {
  id: string;
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
  sku?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  compareAtPriceCents?: number | null;
  productType?: "physical" | "digital";
  weightGrams?: number | null;
  allowBackorders?: boolean;
  requiresShipping?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  speciesRecordId?: string | null;
  variants?: ProductVariantRecord[];
  archivedAt?: string | null;
  updatedAt: string;
};

export function productStockQuantity(product: ProductRecord) {
  if (product.variants?.length) return product.variants.filter((variant) => variant.isActive && variant.inventoryTracked).reduce((total, variant) => total + Math.max(0, variant.inventoryQuantity), 0);
  return Math.max(0, product.stockQuantity ?? 0);
}

export function isProductLowStock(product: ProductRecord) {
  if (product.availability !== "in-stock") return false;
  if (product.variants?.length) return product.variants.some((variant) => variant.isActive && variant.inventoryTracked && variant.inventoryQuantity <= Math.max(0, variant.lowStockThreshold));
  return productStockQuantity(product) <= Math.max(0, product.lowStockThreshold ?? 5);
}

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
  const activePrices = product.variants?.filter((variant) => variant.isActive).map((variant) => variant.priceCents) || [];
  if (activePrices.length > 1) {
    const lowest = Math.min(...activePrices);
    const highest = Math.max(...activePrices);
    if (lowest !== highest) return `From ${new Intl.NumberFormat("en-CA", { style: "currency", currency: product.currency }).format(lowest / 100)}`;
  }
  const price = activePrices.length ? activePrices[0] : product.priceCents;
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: product.currency }).format(price / 100);
}

export function productAvailabilityLabel(availability: ProductAvailability) {
  if (availability === "in-stock") return "Ready when checkout launches";
  if (availability === "sold-out") return "Sold out";
  return "Coming soon";
}

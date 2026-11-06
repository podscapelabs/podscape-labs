import type { ProductRecord } from "@/data/products";

// Stable catalog identities: SKU generation uses a fixed product ID suffix.
// Renaming a product or variant after saving will never silently change its SKU.
export function productSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");
}

const categoryCodes: Record<string, string> = {
  "Isopods & Springtails": "ISO",
  "Field Tools": "TLS",
  "Books & Journals": "BKS",
  "Habitat Supplies": "HAB",
  "Apparel": "APP",
  "Prints & Collectibles": "ART",
  "Other": "GEN",
};

export function productSku(productId: string, category: string, optionTitle: string, optionIndex = 0) {
  const categoryCode = categoryCodes[category] || "GEN";
  const seed = productId.replace(/[^a-f0-9]/gi, "").slice(-8).toUpperCase() || "NEW";
  const count = optionTitle.match(/\b(\d{1,4})\s*(?:count|ct|pack|pcs|pieces|isopods?)\b/i)
    || optionTitle.match(/\b(?:count|ct|pack)\s*(?:of\s*)?(\d{1,4})\b/i);
  const size = count ? `${count[1]}CT` : productSlug(optionTitle).toUpperCase().replace(/-/g, "").slice(0, 10) || `V${optionIndex+1}`;
  return `PS-${categoryCode}-${seed}-${size}`;
}

export function productSuggestedTags(category: string, title: string, species?: {
  commonName?: string; genus?: string; species?: string; morph?: string;
}) {
  const tags: string[] = [];
  const add = (value?: string) => { const tag = (value || "").trim().toLowerCase().replace(/\s+/g, "-"); if (tag && !tags.includes(tag)) tags.push(tag); };
  const categoryTags: Record<string, string[]> = {
    "Isopods & Springtails": ["isopods", "live-invertebrates"],
    "Field Tools": ["field-tools", "equipment"],
    "Books & Journals": ["books", "education"],
    "Habitat Supplies": ["habitat-supplies", "enrichment"],
    "Apparel": ["apparel"],
    "Prints & Collectibles": ["collectibles"],
  };
  (categoryTags[category] || []).forEach(add);
  if (species) {
    add(species.genus);
    add(species.species);
    add(species.morph);
    add(species.commonName);
  } else if (category === "Isopods & Springtails") {
    if (/springtail/i.test(title)) { add("springtails"); }
  }
  return tags.slice(0, 12);
}

export function uniqueProductSlug(requested: string, id: string, products: Pick<ProductRecord, "id" | "slug">[]) {
  const base = productSlug(requested) || "product";
  let candidate = base;
  let index = 2;
  while (products.some((item) => item.id !== id && item.slug === candidate)) {
    candidate = `${base.slice(0, 72)}-${index++}`;
  }
  return candidate;
}

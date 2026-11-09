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

const speciesCodes: Record<string, string> = {
  "dairy cow":"DC", "panda king":"PDK", "rubber ducky":"RD", "powder blue":"PB",
  "powder orange":"PO", "orange laevis":"OL", "milkback":"MB", "little sea":"LS",
  "papaya":"PAP", "penguin":"PNG", "glacier":"GLC", "red tiger":"RT",
  "hoffmannseggi":"HOF", "clown":"CLN", "magic potion":"MP", "giant canyon":"GC",
  "shiro utsuri":"SU", "pineapple spiky":"PNS", "ukrainian pied":"UP",
  "bc maple":"BCM", "cherry blossom":"CB", "lemon blue":"LB",
};
export function speciesSkuCode(name: string, category: string) {
  if (category !== "Isopods & Springtails") return categoryCodes[category] || "GEN";
  const normal = productSlug(name).replace(/-/g, " ");
  const match = Object.entries(speciesCodes).find(([word]) => normal === word || normal.startsWith(word + " ") || normal.endsWith(" " + word));
  if (match) return match[1];
  const words = normal.split(" ").filter(word => word && !["isopod","isopods","colony","live","culture","springtails"].includes(word));
  if (words.length > 1) return words.slice(0, 3).map(word => word[0]).join("").toUpperCase();
  return (words[0] || "ISO").slice(0, 3).toUpperCase();
}
export function packSkuCode(optionTitle: string, optionIndex = 0) {
  const title = optionTitle.trim();
  if (/^\d{1,4}$/.test(title)) return title;
  const count = title.match(/\b(\d{1,4})\s*[- ]?\s*(?:count|ct|pack|pcs|pieces|isopods?)\b/i)
    || title.match(/\b(?:count|ct|pack)\s*(?:of\s*)?(\d{1,4})\b/i);
  if (count) return count[1];
  if (/^default$/i.test(title)) return "STD";
  return productSlug(title).replace(/-/g, "").toUpperCase().slice(0, 10) || "V" + (optionIndex + 1);
}
export function productSku(productId: string, category: string, optionTitle: string, optionIndex = 0, speciesName = "") {
  void productId;
  return "PS-" + speciesSkuCode(speciesName, category) + "-" + packSkuCode(optionTitle, optionIndex);
}
export function isLegacyGeneratedSku(value: string) {
  return /^PS-(?:ISO|TLS|BKS|HAB|APP|ART|GEN)-[A-F0-9]{8}-[A-Z0-9]+$/i.test(value.trim());
}
export function uniqueSku(base: string, reserved: Set<string>) {
  const normalized = base.trim().toUpperCase();
  let candidate = normalized;
  let next = 2;
  while (reserved.has(candidate)) candidate = normalized + "-" + String(next++).padStart(2, "0");
  reserved.add(candidate);
  return candidate;
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

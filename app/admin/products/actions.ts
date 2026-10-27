"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productCategories, type ProductAvailability, type ProductRecord, type ProductStatus, type ProductVariantRecord } from "@/data/products";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendProductRecord, getProductRecords, replaceProductRecord, saveProductPhoto } from "@/lib/product-store";
import { getSpeciesRecords } from "@/lib/species-store";

function field(formData: FormData, name: string, limit = 4000) { return String(formData.get(name) || "").trim().slice(0, limit); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
function boundedNumber(formData: FormData, name: string, minimum: number, maximum: number, fallback: number) { const value = Number(formData.get(name)); return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback; }
function studioRedirect(record: string, key: "saved" | "created" | "error", message = "1"): never {
  redirect(`/admin/products/${encodeURIComponent(record)}?${new URLSearchParams({ [key]: message }).toString()}`);
}

export async function createProductRecord() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = `product-${randomUUID()}`;
  const record: ProductRecord = { id, slug: `draft-${id.slice(-8)}`, title: "Untitled product", category: productCategories[0], summary: "", description: "", priceCents: 0, currency: "CAD", status: "draft", availability: "coming-soon", featured: false, image: null, imageAlt: "", imagePositionX: 50, imagePositionY: 50, imageZoom: 1, tags: [], materials: "", shippingNote: "", sku: "", stockQuantity: 0, lowStockThreshold: 5, compareAtPriceCents: null, productType: "physical", weightGrams: null, allowBackorders: false, requiresShipping: true, seoTitle: "", seoDescription: "", speciesRecordId: null, archivedAt: null, updatedAt: new Date().toISOString() };
  await appendProductRecord(record);
  revalidatePath("/shop");
  studioRedirect(id, "created");
}

export async function saveProductRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getProductRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Product not found");
  const title = field(formData, "title", 180);
  const status = field(formData, "status", 20) as ProductStatus;
  const availability = field(formData, "availability", 30) as ProductAvailability;
  const category = field(formData, "category", 80);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(title) || current.slug;
  const parsedVariants = parseProductVariants(field(formData, "variants", 30000));
  const activeVariants = parsedVariants.filter((variant) => variant.isActive);
  const primaryVariant = activeVariants[0];
  const priceCents = primaryVariant?.priceCents ?? current.priceCents;
  if (!title) studioRedirect(id, "error", "A product title is required");
  if (!parsedVariants.length || !primaryVariant) studioRedirect(id, "error", "Keep at least one active product variant");
  if (!productCategories.includes(category as (typeof productCategories)[number])) studioRedirect(id, "error", "Choose a valid product category");
  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status");
  if (!["coming-soon", "in-stock", "sold-out"].includes(availability)) studioRedirect(id, "error", "Invalid availability");
  if (status === "published" && (!field(formData, "summary", 600) || priceCents <= 0)) studioRedirect(id, "error", "Published products need a summary and a price");
  let image = current.image;
  if (formData.get("removePhoto") === "yes") image = null;
  const photo = formData.get("photo");
  try { if (photo instanceof File && photo.size > 0) image = await saveProductPhoto(id, photo); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product photo"); }
  const weightValue = field(formData, "weightGrams", 20);
  const weightGrams = Number(weightValue);
  const requestedSpeciesId = field(formData, "speciesRecordId", 100) || null;
  if (requestedSpeciesId) {
    const speciesRecords = await getSpeciesRecords();
    if (!speciesRecords.some((record) => record.id === requestedSpeciesId && record.kind === "species" && !record.archivedAt)) studioRedirect(id, "error", "Choose a valid Leaf Ledger species");
  }
  const adjustmentReason = field(formData, "inventoryAdjustmentReason", 20) as "manual" | "return" | "damage" | "correction";
  if (!["manual", "return", "damage", "correction"].includes(adjustmentReason)) studioRedirect(id, "error", "Choose a valid inventory adjustment reason");
  const nextRecord: ProductRecord = { ...current, slug, title, category, summary: field(formData, "summary", 600), description: field(formData, "description", 8000), priceCents, status, availability, featured: formData.get("featured") === "yes", image, imageAlt: field(formData, "imageAlt", 240), imagePositionX: boundedNumber(formData, "imagePositionX", 0, 100, current.imagePositionX), imagePositionY: boundedNumber(formData, "imagePositionY", 0, 100, current.imagePositionY), imageZoom: boundedNumber(formData, "imageZoom", 1, 2, current.imageZoom), tags: field(formData, "tags", 1000).split(",").map((tag) => tag.trim()).filter(Boolean), materials: field(formData, "materials", 2000), shippingNote: field(formData, "shippingNote", 2000), sku: primaryVariant.sku, stockQuantity: primaryVariant.inventoryTracked ? primaryVariant.inventoryQuantity : 0, lowStockThreshold: primaryVariant.lowStockThreshold, compareAtPriceCents: primaryVariant.compareAtPriceCents, variants: parsedVariants, productType: field(formData, "productType", 20) === "digital" ? "digital" : "physical", weightGrams: weightValue && Number.isFinite(weightGrams) && weightGrams >= 0 ? weightGrams : null, allowBackorders: formData.get("allowBackorders") === "yes", requiresShipping: formData.get("productType") !== "digital" && formData.get("requiresShipping") === "yes", seoTitle: field(formData, "seoTitle", 180), seoDescription: field(formData, "seoDescription", 320), speciesRecordId: requestedSpeciesId, updatedAt: new Date().toISOString() };
  try { await replaceProductRecord(nextRecord, adjustmentReason, field(formData, "inventoryAdjustmentNote", 1000)); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product"); }
  revalidatePath("/shop"); revalidatePath(`/shop/${current.slug}`); revalidatePath(`/shop/${nextRecord.slug}`); revalidatePath("/search");
  studioRedirect(id, "saved");
}

function parseProductVariants(raw: string): ProductVariantRecord[] {
  let values: unknown;
  try { values = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(values) || values.length > 50) return [];
  const variants = values.map((value, index) => {
    if (!value || typeof value !== "object") return null;
    const variant = value as Partial<ProductVariantRecord>;
    const id = typeof variant.id === "string" && /^[0-9a-f-]{36}$/i.test(variant.id) ? variant.id : "";
    const priceCents = Number(variant.priceCents);
    const compareAtPriceCents = variant.compareAtPriceCents == null ? null : Number(variant.compareAtPriceCents);
    const inventoryQuantity = Number(variant.inventoryQuantity);
    const lowStockThreshold = Number(variant.lowStockThreshold);
    if (typeof variant.title !== "string" || !variant.title.trim() || variant.title.length > 120) return null;
    if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 2_147_483_647) return null;
    if (compareAtPriceCents !== null && (!Number.isInteger(compareAtPriceCents) || compareAtPriceCents < 0 || compareAtPriceCents > 2_147_483_647)) return null;
    if (!Number.isInteger(inventoryQuantity) || inventoryQuantity < 0 || inventoryQuantity > 999_999) return null;
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 999_999) return null;
    return { id, title: variant.title.trim(), sku: typeof variant.sku === "string" ? variant.sku.trim().slice(0, 100) : "", priceCents, compareAtPriceCents, inventoryTracked: variant.inventoryTracked !== false, inventoryQuantity, lowStockThreshold, isActive: variant.isActive !== false, sortOrder: index } satisfies ProductVariantRecord;
  });
  if (variants.some((variant) => variant === null)) return [];
  const skus = variants.map((variant) => variant!.sku.toLocaleLowerCase()).filter(Boolean);
  if (new Set(skus).size !== skus.length) return [];
  const ids = variants.map((variant) => variant!.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) return [];
  return variants as ProductVariantRecord[];
}

export async function toggleProductArchive(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getProductRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Product not found");
  const restoring = Boolean(current.archivedAt);
  try { await replaceProductRecord({ ...current, archivedAt: restoring ? null : new Date().toISOString(), updatedAt: new Date().toISOString() }); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to update archive"); }
  revalidatePath("/shop"); revalidatePath(`/shop/${current.slug}`); revalidatePath("/search");
  redirect(`/admin/products/${encodeURIComponent(id)}?saved=1`);
}

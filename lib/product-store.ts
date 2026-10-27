import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductInventoryAdjustment, ProductRecord, ProductVariantRecord } from "@/data/products";
import { getSupabaseAdmin, getWritableSupabaseAdmin } from "@/lib/supabase-admin";

const recordsPath = path.join(process.cwd(), "data", "product-records.json");
const photoDirectory = path.join(process.cwd(), "public", "assets", "photos", "products");

function isProductRecord(value: unknown): value is ProductRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProductRecord>;
  return typeof record.id === "string" && typeof record.slug === "string" && typeof record.priceCents === "number" && Array.isArray(record.tags);
}

async function getLocalProductRecords() {
  const source = await readFile(recordsPath, "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed) || !parsed.every(isProductRecord)) throw new Error("Product records are not valid.");
  return parsed;
}

async function seedCloudRecords(records: ProductRecord[]) {
  const supabase = getWritableSupabaseAdmin();
  if (!supabase || records.length === 0) return;
  const { error } = await supabase.from("product_records").upsert(
    records.map((record) => ({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Unable to seed product records: ${error.message}`);
}

async function attachNormalizedVariants(records: ProductRecord[], supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  if (!records.length) return records;
  try {
    const { data: products, error: productsError } = await supabase
      .from("shop_products")
      .select("id,legacy_product_id")
      .in("legacy_product_id", records.map((record) => record.id));
    if (productsError) throw productsError;
    if (!products?.length) return records;
    const productToLegacyId = new Map(products.map((product) => [product.id, product.legacy_product_id]));
    const { data: rows, error: variantsError } = await supabase
      .from("shop_product_variants")
      .select("id,product_id,title,sku,price_cents,compare_at_price_cents,inventory_tracked,inventory_quantity,low_stock_threshold,is_active,sort_order")
      .in("product_id", products.map((product) => product.id))
      .order("sort_order", { ascending: true });
    if (variantsError) throw variantsError;
    const variantsByLegacyId = new Map<string, ProductVariantRecord[]>();
    for (const row of rows || []) {
      const legacyId = productToLegacyId.get(row.product_id);
      if (!legacyId) continue;
      const variants = variantsByLegacyId.get(legacyId) || [];
      variants.push({ id: row.id, title: row.title, sku: row.sku || "", priceCents: row.price_cents, compareAtPriceCents: row.compare_at_price_cents, inventoryTracked: row.inventory_tracked, inventoryQuantity: row.inventory_quantity, lowStockThreshold: row.low_stock_threshold, isActive: row.is_active, sortOrder: row.sort_order });
      variantsByLegacyId.set(legacyId, variants);
    }
    return records.map((record) => {
      const variants = variantsByLegacyId.get(record.id);
      const primary = variants?.find((variant) => variant.isActive);
      return primary ? { ...record, variants, priceCents: primary.priceCents, sku: primary.sku, stockQuantity: primary.inventoryTracked ? primary.inventoryQuantity : 0, lowStockThreshold: primary.lowStockThreshold, compareAtPriceCents: primary.compareAtPriceCents } : record;
    });
  } catch (error) {
    console.warn("Shop Manager variants could not be loaded; preserving the current product catalogue fields.", error);
    return records;
  }
}

export async function getProductRecords() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalProductRecords();
  try {
    const { data, error } = await supabase.from("product_records").select("record").order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    const records = (data || []).map((row) => row.record as unknown);
    if (!records.every(isProductRecord)) throw new Error("Cloud product records are not valid.");
    if (records.length > 0) return attachNormalizedVariants(records, supabase);
    const localRecords = await getLocalProductRecords();
    await seedCloudRecords(localRecords);
    return attachNormalizedVariants(localRecords, supabase);
  } catch (error) {
    console.warn("Product cloud read failed; using the bundled catalogue.", error);
    return getLocalProductRecords();
  }
}

export async function getProductRecord(slug: string) {
  return (await getProductRecords()).find((record) => record.slug === slug && !record.archivedAt);
}

export async function replaceProductRecord(
  nextRecord: ProductRecord,
  inventoryAdjustmentReason: "manual" | "return" | "damage" | "correction" = "manual",
  inventoryAdjustmentNote = "",
) {
  const records = await getProductRecords();
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index === -1) throw new Error("Product record not found.");
  if (records.some((record, recordIndex) => recordIndex !== index && record.slug === nextRecord.slug)) throw new Error("That URL slug is already in use.");
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const variants = (nextRecord.variants || []).map((variant, index) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku || null,
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      inventoryTracked: variant.inventoryTracked,
      inventoryQuantity: variant.inventoryQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      sortOrder: index,
    }));
    const { error } = await supabase.rpc("sync_shop_manager_product", {
      p_record: nextRecord,
      p_variants: variants,
      p_adjustment_reason: inventoryAdjustmentReason,
      p_adjustment_note: inventoryAdjustmentNote,
    });
    if (error) throw new Error(`Unable to save product and inventory: ${error.message}`);
    return;
  }
  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function getProductManagementData(record: ProductRecord): Promise<{
  variants: ProductVariantRecord[];
  adjustments: ProductInventoryAdjustment[];
  normalized: boolean;
}> {
  const defaultVariant: ProductVariantRecord = {
    id: "",
    title: "Default",
    sku: record.sku || "",
    priceCents: record.priceCents,
    compareAtPriceCents: record.compareAtPriceCents ?? null,
    inventoryTracked: record.stockQuantity !== undefined,
    inventoryQuantity: record.stockQuantity ?? 0,
    lowStockThreshold: record.lowStockThreshold ?? 5,
    isActive: true,
    sortOrder: 0,
  };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { variants: record.variants?.length ? record.variants : [defaultVariant], adjustments: [], normalized: false };

  try {
    const { data: shopProduct, error: productError } = await supabase
      .from("shop_products")
      .select("id")
      .eq("legacy_product_id", record.id)
      .maybeSingle();
    if (productError) throw productError;
    if (!shopProduct) return { variants: record.variants?.length ? record.variants : [defaultVariant], adjustments: [], normalized: false };

    const { data: rows, error: variantsError } = await supabase
      .from("shop_product_variants")
      .select("id,title,sku,price_cents,compare_at_price_cents,inventory_tracked,inventory_quantity,low_stock_threshold,is_active,sort_order")
      .eq("product_id", shopProduct.id)
      .order("sort_order", { ascending: true });
    if (variantsError) throw variantsError;
    const variants: ProductVariantRecord[] = (rows || []).map((row) => ({
      id: row.id,
      title: row.title,
      sku: row.sku || "",
      priceCents: row.price_cents,
      compareAtPriceCents: row.compare_at_price_cents,
      inventoryTracked: row.inventory_tracked,
      inventoryQuantity: row.inventory_quantity,
      lowStockThreshold: row.low_stock_threshold,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
    const variantIds = variants.map((variant) => variant.id);
    if (!variantIds.length) return { variants: [defaultVariant], adjustments: [], normalized: true };

    const { data: historyRows, error: historyError } = await supabase
      .from("shop_inventory_adjustments")
      .select("id,variant_id,quantity_delta,quantity_after,reason,note,created_at")
      .in("variant_id", variantIds)
      .order("created_at", { ascending: false })
      .limit(40);
    if (historyError) throw historyError;
    const variantNames = new Map(variants.map((variant) => [variant.id, variant.title]));
    const adjustments: ProductInventoryAdjustment[] = (historyRows || []).map((row) => ({
      id: row.id,
      variantId: row.variant_id,
      variantTitle: variantNames.get(row.variant_id) || "Variant",
      quantityDelta: row.quantity_delta,
      quantityAfter: row.quantity_after,
      reason: row.reason,
      note: row.note || "",
      createdAt: row.created_at,
    }));
    return { variants: variants.length ? variants : [defaultVariant], adjustments, normalized: true };
  } catch (error) {
    console.warn("Normalized Shop Manager data is not available; showing the legacy product stock fields.", error);
    return { variants: record.variants?.length ? record.variants : [defaultVariant], adjustments: [], normalized: false };
  }
}

export async function appendProductRecord(record: ProductRecord) {
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("product_records").insert({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt });
    if (error) throw new Error(`Unable to create product record: ${error.message}`);
    return;
  }
  const records = await getLocalProductRecords();
  records.push(record);
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function saveProductPhoto(recordId: string, photo: File) {
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = extensions[photo.type];
  if (!extension) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (photo.size > 12 * 1024 * 1024) throw new Error("The photo must be smaller than 12 MB.");
  const safeId = recordId.replace(/[^a-zA-Z0-9-]/g, "");
  const filename = `${safeId}-${Date.now()}.${extension}`;
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const objectPath = `${safeId}/${filename}`;
    const { error } = await supabase.storage.from("product-photos").upload(objectPath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
    if (error) throw new Error(`Unable to upload product photo: ${error.message}`);
    return supabase.storage.from("product-photos").getPublicUrl(objectPath).data.publicUrl;
  }
  await mkdir(photoDirectory, { recursive: true });
  await writeFile(path.join(photoDirectory, filename), Buffer.from(await photo.arrayBuffer()));
  return `/assets/photos/products/${filename}`;
}

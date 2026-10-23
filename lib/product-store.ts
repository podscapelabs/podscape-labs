import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductRecord } from "@/data/products";
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

export async function getProductRecords() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalProductRecords();
  try {
    const { data, error } = await supabase.from("product_records").select("record").order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    const records = (data || []).map((row) => row.record as unknown);
    if (!records.every(isProductRecord)) throw new Error("Cloud product records are not valid.");
    if (records.length > 0) return records;
    const localRecords = await getLocalProductRecords();
    await seedCloudRecords(localRecords);
    return localRecords;
  } catch (error) {
    console.error("Product cloud read failed.", error);
    throw new Error("Product catalogue is temporarily unavailable. No product data was changed.");
  }
}

export async function getProductRecord(slug: string) {
  return (await getProductRecords()).find((record) => record.slug === slug && !record.archivedAt);
}

export async function replaceProductRecord(nextRecord: ProductRecord) {
  const records = await getProductRecords();
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index === -1) throw new Error("Product record not found.");
  if (records.some((record, recordIndex) => recordIndex !== index && record.slug === nextRecord.slug)) throw new Error("That URL slug is already in use.");
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("product_records").upsert(
      { id: nextRecord.id, slug: nextRecord.slug, record: nextRecord, updated_at: nextRecord.updatedAt },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Unable to save product record: ${error.message}`);
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Product changes require configured cloud storage in production.");
  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function appendProductRecord(record: ProductRecord) {
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("product_records").insert({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt });
    if (error) throw new Error(`Unable to create product record: ${error.message}`);
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Product creation requires configured cloud storage in production.");
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
  if (process.env.NODE_ENV === "production") throw new Error("Product photo uploads require configured cloud storage in production.");
  await mkdir(photoDirectory, { recursive: true });
  await writeFile(path.join(photoDirectory, filename), Buffer.from(await photo.arrayBuffer()));
  return `/assets/photos/products/${filename}`;
}

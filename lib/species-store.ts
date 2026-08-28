import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SpeciesRecord } from "@/data/species";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const recordsPath = path.join(process.cwd(), "data", "species-records.json");
const photoDirectory = path.join(process.cwd(), "public", "assets", "photos", "species-records");

function isSpeciesRecord(value: unknown): value is SpeciesRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<SpeciesRecord>;
  return typeof record.id === "string" && typeof record.slug === "string" && Array.isArray(record.tags);
}

async function getLocalSpeciesRecords() {
  const source = await readFile(recordsPath, "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed) || !parsed.every(isSpeciesRecord)) throw new Error("Species records are not valid.");
  return parsed;
}

async function seedCloudRecords(records: SpeciesRecord[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || records.length === 0) return;
  const { error } = await supabase.from("species_records").upsert(
    records.map((record) => ({
      id: record.id,
      slug: record.slug,
      record,
      updated_at: record.updatedAt,
    })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Unable to seed species records: ${error.message}`);
}

export async function getSpeciesRecords() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalSpeciesRecords();

  const { data, error } = await supabase.from("species_records").select("record").order("updated_at", { ascending: true });
  if (error) throw new Error(`Unable to load species records: ${error.message}`);
  const records = (data || []).map((row) => row.record as unknown);
  if (!records.every(isSpeciesRecord)) throw new Error("Cloud species records are not valid.");
  if (records.length > 0) return records;

  const localRecords = await getLocalSpeciesRecords();
  await seedCloudRecords(localRecords);
  return localRecords;
}

export async function getSpeciesRecord(slug: string) {
  const records = await getSpeciesRecords();
  return records.find((record) => record.slug === slug);
}

export async function replaceSpeciesRecord(nextRecord: SpeciesRecord) {
  const records = await getSpeciesRecords();
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index === -1) throw new Error("Species record not found.");
  if (records.some((record, recordIndex) => recordIndex !== index && record.slug === nextRecord.slug)) {
    throw new Error("That URL slug is already in use.");
  }
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("species_records").upsert(
      { id: nextRecord.id, slug: nextRecord.slug, record: nextRecord, updated_at: nextRecord.updatedAt },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Unable to save species record: ${error.message}`);
    return;
  }

  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function appendSpeciesRecord(record: SpeciesRecord) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("species_records")
      .insert({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt });
    if (error) throw new Error(`Unable to create species record: ${error.message}`);
    return;
  }

  const records = await getLocalSpeciesRecords();
  records.push(record);
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function saveSpeciesPhoto(recordId: string, photo: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[photo.type];
  if (!extension) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (photo.size > 12 * 1024 * 1024) throw new Error("The photo must be smaller than 12 MB.");
  const safeId = recordId.replace(/[^a-zA-Z0-9-]/g, "");
  const filename = `${safeId}-${Date.now()}.${extension}`;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const objectPath = `${safeId}/${filename}`;
    const { error } = await supabase.storage.from("species-photos").upload(objectPath, await photo.arrayBuffer(), {
      contentType: photo.type,
      upsert: false,
    });
    if (error) throw new Error(`Unable to upload photo: ${error.message}`);
    return supabase.storage.from("species-photos").getPublicUrl(objectPath).data.publicUrl;
  }

  await mkdir(photoDirectory, { recursive: true });
  await writeFile(path.join(photoDirectory, filename), Buffer.from(await photo.arrayBuffer()));
  return `/assets/photos/species-records/${filename}`;
}

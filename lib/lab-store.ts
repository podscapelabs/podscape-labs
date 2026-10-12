import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LabRecord } from "@/data/lab";
import { getSupabaseAdmin, getWritableSupabaseAdmin } from "@/lib/supabase-admin";

const recordsPath = path.join(process.cwd(), "data", "lab-records.json");

function isLabRecord(value: unknown): value is LabRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<LabRecord>;
  return typeof record.id === "string" && typeof record.slug === "string" && Array.isArray(record.sections) && Array.isArray(record.tags);
}

async function getLocalLabRecords() {
  const source = await readFile(recordsPath, "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed) || !parsed.every(isLabRecord)) throw new Error("Lab records are not valid.");
  return parsed;
}

async function seedCloudRecords(records: LabRecord[]) {
  const supabase = getWritableSupabaseAdmin();
  if (!supabase || records.length === 0) return;
  const { error } = await supabase.from("lab_records").upsert(
    records.map((record) => ({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Unable to seed Lab records: ${error.message}`);
}

export async function getLabRecords() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalLabRecords();
  try {
    const { data, error } = await supabase.from("lab_records").select("record").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const records = (data || []).map((row) => row.record as unknown);
    if (!records.every(isLabRecord)) throw new Error("Cloud Lab records are not valid.");
    if (records.length > 0) return records;
    const localRecords = await getLocalLabRecords();
    await seedCloudRecords(localRecords);
    return localRecords;
  } catch (error) {
    console.warn("Lab cloud read failed; using the bundled journal.", error);
    return getLocalLabRecords();
  }
}

export async function getLabRecord(slug: string) {
  return (await getLabRecords()).find((record) => record.slug === slug && !record.archivedAt);
}

export async function replaceLabRecord(nextRecord: LabRecord) {
  const records = await getLabRecords();
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index === -1) throw new Error("Lab record not found.");
  if (records.some((record, recordIndex) => recordIndex !== index && record.slug === nextRecord.slug)) throw new Error("That URL slug is already in use.");
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("lab_records").upsert(
      { id: nextRecord.id, slug: nextRecord.slug, record: nextRecord, updated_at: nextRecord.updatedAt },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Unable to save Lab record: ${error.message}`);
    return;
  }
  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function appendLabRecord(record: LabRecord) {
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("lab_records").insert({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt });
    if (error) throw new Error(`Unable to create Lab record: ${error.message}`);
    return;
  }
  const records = await getLocalLabRecords();
  records.push(record);
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

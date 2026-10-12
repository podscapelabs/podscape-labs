import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GuideRecord } from "@/data/guides";
import { getSupabaseAdmin, getWritableSupabaseAdmin } from "@/lib/supabase-admin";

const recordsPath = path.join(process.cwd(), "data", "guide-records.json");

function isGuideRecord(value: unknown): value is GuideRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<GuideRecord>;
  return typeof record.id === "string" && typeof record.slug === "string" && Array.isArray(record.sections) && Array.isArray(record.relatedSpeciesSlugs);
}

async function getLocalGuideRecords() {
  const source = await readFile(recordsPath, "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed) || !parsed.every(isGuideRecord)) throw new Error("Guide records are not valid.");
  return parsed;
}

async function seedCloudRecords(records: GuideRecord[]) {
  const supabase = getWritableSupabaseAdmin();
  if (!supabase || records.length === 0) return;
  const { error } = await supabase.from("guide_records").upsert(
    records.map((record) => ({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Unable to seed guide records: ${error.message}`);
}

export async function getGuideRecords() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalGuideRecords();

  try {
    const { data, error } = await supabase.from("guide_records").select("record").order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    const records = (data || []).map((row) => row.record as unknown);
    if (!records.every(isGuideRecord)) throw new Error("Cloud guide records are not valid.");
    if (records.length > 0) return records;

    const localRecords = await getLocalGuideRecords();
    await seedCloudRecords(localRecords);
    return localRecords;
  } catch (error) {
    console.warn("Guide cloud read failed; using the bundled catalogue.", error);
    return getLocalGuideRecords();
  }
}

export async function getGuideRecord(slug: string) {
  return (await getGuideRecords()).find((record) => record.slug === slug && !record.archivedAt);
}

export async function replaceGuideRecord(nextRecord: GuideRecord) {
  const records = await getGuideRecords();
  const index = records.findIndex((record) => record.id === nextRecord.id);
  if (index === -1) throw new Error("Guide record not found.");
  if (records.some((record, recordIndex) => recordIndex !== index && record.slug === nextRecord.slug)) throw new Error("That URL slug is already in use.");

  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("guide_records").upsert(
      { id: nextRecord.id, slug: nextRecord.slug, record: nextRecord, updated_at: nextRecord.updatedAt },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Unable to save guide record: ${error.message}`);
    return;
  }

  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function appendGuideRecord(record: GuideRecord) {
  const supabase = getWritableSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("guide_records").insert({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt });
    if (error) throw new Error(`Unable to create guide record: ${error.message}`);
    return;
  }

  const records = await getLocalGuideRecords();
  records.push(record);
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

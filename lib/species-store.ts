import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SpeciesRecord } from "@/data/species";

const recordsPath = path.join(process.cwd(), "data", "species-records.json");

function isSpeciesRecord(value: unknown): value is SpeciesRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<SpeciesRecord>;
  return typeof record.id === "string" && typeof record.slug === "string" && Array.isArray(record.tags);
}

export async function getSpeciesRecords() {
  const source = await readFile(recordsPath, "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed) || !parsed.every(isSpeciesRecord)) throw new Error("Species records are not valid.");
  return parsed;
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
  records[index] = nextRecord;
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function appendSpeciesRecord(record: SpeciesRecord) {
  const records = await getSpeciesRecords();
  records.push(record);
  await writeFile(recordsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

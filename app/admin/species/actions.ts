"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SpeciesIdentityStatus, SpeciesRecord, SpeciesRecordKind, SpeciesStatus } from "@/data/species";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendSpeciesRecord, getSpeciesRecords, replaceSpeciesRecord, saveSpeciesPhoto } from "@/lib/species-store";

function field(formData: FormData, name: string, limit = 2000) {
  return String(formData.get(name) || "").trim().slice(0, limit);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function boundedNumber(formData: FormData, name: string, minimum: number, maximum: number, fallback: number) {
  const value = Number(formData.get(name));
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

function studioRedirect(record: string, key: "saved" | "created" | "error", message = "1", view?: "active" | "archived"): never {
  const params = new URLSearchParams({ record, [key]: message });
  if (view) params.set("view", view);
  redirect(`/admin/species?${params.toString()}`);
}

export async function createSpeciesRecord() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const records = await getSpeciesRecords();
  const id = `species-${randomUUID()}`;
  const sequence = records.filter((record) => record.kind === "species").length + 1;
  const record: SpeciesRecord = {
    id,
    slug: `draft-${id.slice(-8)}`,
    kind: "species",
    status: "draft",
    identityStatus: "unassigned",
    commonName: "",
    scientificName: "",
    genus: "",
    species: "",
    morph: "",
    catalogueNumber: `LL-${String(sequence).padStart(3, "0")}`,
    image: null,
    imageAlt: "",
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 1,
    summary: "",
    tags: [],
    careLevel: "",
    moisture: "",
    temperature: "",
    ventilation: "",
    substrate: "",
    feeding: "",
    about: "",
    keeperNotes: "",
    fieldGuideLinks: [],
    updatedAt: new Date().toISOString(),
  };
  await appendSpeciesRecord(record);
  revalidatePath("/ledger");
  studioRedirect(id, "created");
}

export async function saveSpeciesRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getSpeciesRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Record not found");
  const view = current.archivedAt ? "archived" : "active";

  const commonName = field(formData, "commonName", 120);
  const scientificName = field(formData, "scientificName", 160);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(commonName || scientificName) || current.slug;
  const status = field(formData, "status", 20) as SpeciesStatus;
  const identityStatus = field(formData, "identityStatus", 20) as SpeciesIdentityStatus;
  const kind = field(formData, "kind", 20) as SpeciesRecordKind;

  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!["unassigned", "provisional", "verified"].includes(identityStatus)) studioRedirect(id, "error", "Invalid identity status", view);
  if (!["photo-test", "species"].includes(kind)) studioRedirect(id, "error", "Invalid record type", view);
  if (status === "published" && (!commonName || !scientificName || identityStatus === "unassigned")) {
    studioRedirect(id, "error", "Published records need approved common and scientific names", view);
  }

  let image = current.image;
  if (formData.get("removePhoto") === "yes") image = null;
  const photo = formData.get("photo");
  try {
    if (photo instanceof File && photo.size > 0) image = await saveSpeciesPhoto(id, photo);
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save photo", view);
  }

  const nextRecord: SpeciesRecord = {
    ...current,
    slug,
    kind,
    status,
    identityStatus,
    commonName,
    scientificName,
    genus: field(formData, "genus", 100),
    species: field(formData, "species", 100),
    morph: field(formData, "morph", 120),
    catalogueNumber: field(formData, "catalogueNumber", 40) || current.catalogueNumber,
    image,
    imageAlt: field(formData, "imageAlt", 240),
    imagePositionX: boundedNumber(formData, "imagePositionX", 0, 100, current.imagePositionX),
    imagePositionY: boundedNumber(formData, "imagePositionY", 0, 100, current.imagePositionY),
    imageZoom: boundedNumber(formData, "imageZoom", 1, 2, current.imageZoom),
    summary: field(formData, "summary", 600),
    tags: field(formData, "tags", 500).split(",").map((tag) => tag.trim()).filter(Boolean),
    careLevel: field(formData, "careLevel", 100),
    moisture: field(formData, "moisture", 160),
    temperature: field(formData, "temperature", 160),
    ventilation: field(formData, "ventilation", 160),
    substrate: field(formData, "substrate", 300),
    feeding: field(formData, "feeding", 300),
    about: field(formData, "about", 4000),
    keeperNotes: field(formData, "keeperNotes", 4000),
    fieldGuideLinks: field(formData, "fieldGuideLinks", 1000).split(/\r?\n/).map((link) => link.trim()).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };

  try {
    await replaceSpeciesRecord(nextRecord);
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save record", view);
  }
  revalidatePath("/ledger");
  revalidatePath(`/ledger/${current.slug}`);
  revalidatePath(`/ledger/${nextRecord.slug}`);
  revalidatePath("/search");
  studioRedirect(id, "saved", "1", view);
}

export async function toggleSpeciesArchive(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getSpeciesRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Record not found");

  const restoring = Boolean(current.archivedAt);
  const nextRecord: SpeciesRecord = {
    ...current,
    archivedAt: restoring ? null : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await replaceSpeciesRecord(nextRecord);
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to update archive");
  }

  revalidatePath("/ledger");
  revalidatePath(`/ledger/${current.slug}`);
  revalidatePath("/search");
  const params = new URLSearchParams({ view: restoring ? "active" : "archived", record: id, saved: "1" });
  redirect(`/admin/species?${params.toString()}`);
}

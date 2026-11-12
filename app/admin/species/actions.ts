"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SpeciesIdentityStatus, SpeciesRecord, SpeciesRecordKind, SpeciesStatus } from "@/data/species";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateSpeciesSearchTags } from "@/lib/species-search-tags";
import {flatSpeciesResearchFields,validateSpeciesResearchField} from "@/lib/species-research-fields";
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
    organismGroup: "isopod",
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
    notableTraits: [],
    careLevel: "",
    moisture: "",
    moistureProfile: "",
    moistureRangeStart: null,
    moistureRangeEnd: null,
    moistureNote: "",
    ventilationNote: "",
    temperatureNote: "",
    activityNote: "",
    reproductionNote: "",
    feedingResponse: "",
    feedingResponseNote: "",
    temperature: "",
    ventilation: "",
    reproduction: "",
    activity: "",
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
  const publication = field(formData, "status", 20);
  const identityStatus = field(formData, "identityStatus", 20) as SpeciesIdentityStatus;
  const kind = field(formData, "kind", 20) as SpeciesRecordKind;
  const organismGroup=field(formData,"organismGroup",20)||"isopod";

  if (!["draft", "published", "archived"].includes(publication)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!["unassigned", "provisional", "verified"].includes(identityStatus)) studioRedirect(id, "error", "Invalid identity status", view);
  if (!["photo-test", "species"].includes(kind)) studioRedirect(id, "error", "Invalid record type", view);
  if (!["isopod","springtail"].includes(organismGroup)) studioRedirect(id,"error","Invalid organism group",view);
  if (publication === "published" && (!commonName || !scientificName || identityStatus === "unassigned")) {
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

  const rangeStartRaw = field(formData, "moistureRangeStart", 2);
  const rangeEndRaw = field(formData, "moistureRangeEnd", 2);
  const validRangeValue = (value: string) => value === "" || ["1", "2", "3", "4", "5"].includes(value);
  if (!validRangeValue(rangeStartRaw) || !validRangeValue(rangeEndRaw)
      || Boolean(rangeStartRaw) !== Boolean(rangeEndRaw)
      || (rangeStartRaw && Number(rangeStartRaw) > Number(rangeEndRaw))) {
    studioRedirect(id, "error", "Choose a complete moisture range, starting with the drier zone and ending with the damper zone.", view);
  }

  // Validate optional reviewed facts before changing any existing record.
  const researchedValues:Record<string,string>={};
  for(const item of flatSpeciesResearchFields){
    const value=String(formData.get(item.name)||"").trim();
    if(value.length>item.limit)
      studioRedirect(id,"error",item.label+": exceeds "+item.limit+" characters. Nothing was saved; please shorten this field without cutting a sentence or source URL.",view);
    const error=validateSpeciesResearchField(item.name,value);
    if(error)studioRedirect(id,"error",item.label+": "+error,view);
    researchedValues[item.name]=value;
  }
  if(researchedValues.humidityMin&&researchedValues.humidityMax&&Number(researchedValues.humidityMin)>Number(researchedValues.humidityMax))
    studioRedirect(id,"error","Relative humidity lower bound must not exceed the upper bound",view);
  if(researchedValues.broodMin&&researchedValues.broodMax&&Number(researchedValues.broodMin)>Number(researchedValues.broodMax))
    studioRedirect(id,"error","Brood minimum must not exceed brood maximum",view);

  const status: SpeciesStatus = publication === "archived" ? current.status : (publication as SpeciesStatus);
  const archivedAt = publication === "archived" ? current.archivedAt || new Date().toISOString() : null;

  const nextRecord: SpeciesRecord = {
    ...current,
    slug,
    kind,
    organismGroup:organismGroup as "isopod"|"springtail",
    status,
    archivedAt,
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
    tags: generateSpeciesSearchTags({ commonName, scientificName, genus: field(formData, "genus", 100), species: field(formData, "species", 100), morph: field(formData, "morph", 120), slug }),
    notableTraits: Array.from(new Set(field(formData, "notableTraits", 1000)
      .split(/\r?\n/).map(trait => trait.trim().slice(0, 65)).filter(Boolean))).slice(0, 5),
    careLevel: field(formData, "careLevel", 100),
    moisture: formData.has("moisture") ? field(formData, "moisture", 160) : (current.moisture || ""),
    moistureProfile: (["", "dry-leaning", "dry-balanced", "balanced", "balanced-moist", "moist-leaning"].includes(field(formData, "moistureProfile", 40)) ? field(formData, "moistureProfile", 40) : "") as SpeciesRecord["moistureProfile"],
    moistureRangeStart: rangeStartRaw ? Number(rangeStartRaw) : null,
    moistureRangeEnd: rangeEndRaw ? Number(rangeEndRaw) : null,
    moistureNote: formData.has("moistureNote") ? field(formData, "moistureNote", 240) : (current.moistureNote || ""),
    ventilationNote: formData.has("ventilationNote") ? field(formData, "ventilationNote", 240) : (current.ventilationNote || ""),
    temperatureNote: formData.has("temperatureNote") ? field(formData, "temperatureNote", 240) : (current.temperatureNote || ""),
    activityNote: formData.has("activityNote") ? field(formData, "activityNote", 240) : (current.activityNote || ""),
    reproductionNote: formData.has("reproductionNote") ? field(formData, "reproductionNote", 240) : (current.reproductionNote || ""),
    feedingResponse: ["", "Reserved", "Moderate", "Eager", "Very eager", "Not established"].includes(field(formData,"feedingResponse",40)) ? field(formData,"feedingResponse",40) : "",
    feedingResponseNote: formData.has("feedingResponseNote") ? field(formData, "feedingResponseNote", 240) : (current.feedingResponseNote || ""),
    temperature: field(formData, "temperature", 160),
    ventilation: field(formData, "ventilation", 160),
    reproduction: field(formData, "reproduction", 100),
    activity: field(formData, "activity", 100),
    substrate: field(formData, "substrate", 300),
    feeding: field(formData, "feeding", 300),
    about: field(formData, "about", 4000),
    ...researchedValues,
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
  studioRedirect(id, "saved", "1", nextRecord.archivedAt ? "archived" : "active");
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

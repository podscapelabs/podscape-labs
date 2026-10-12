"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guideCategories, type GuideRecord, type GuideSection, type GuideStatus } from "@/data/guides";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendGuideRecord, getGuideRecords, replaceGuideRecord } from "@/lib/guide-store";

function field(formData: FormData, name: string, limit = 4000) {
  return String(formData.get(name) || "").trim().slice(0, limit);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function studioRedirect(record: string, key: "saved" | "created" | "error", message = "1", view?: "active" | "archived"): never {
  const params = new URLSearchParams({ record, [key]: message });
  if (view) params.set("view", view);
  redirect(`/admin/guides?${params.toString()}`);
}

function parseSections(formData: FormData): GuideSection[] {
  try {
    const parsed: unknown = JSON.parse(field(formData, "sections", 50000));
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 30).flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const section = value as Partial<GuideSection>;
      const heading = String(section.heading || "").trim().slice(0, 180);
      const body = String(section.body || "").trim().slice(0, 12000);
      if (!heading && !body) return [];
      return [{ id: String(section.id || `section-${randomUUID()}`).slice(0, 100), heading, body }];
    });
  } catch {
    return [];
  }
}

export async function createGuideRecord() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = `guide-${randomUUID()}`;
  const record: GuideRecord = {
    id,
    slug: `draft-${id.slice(-8)}`,
    category: guideCategories[0],
    title: "Untitled field guide",
    summary: "",
    status: "draft",
    sections: [{ id: `section-${randomUUID()}`, heading: "", body: "" }],
    caution: "",
    relatedSpeciesSlugs: [],
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  };
  await appendGuideRecord(record);
  revalidatePath("/field-guide");
  studioRedirect(id, "created");
}

export async function saveGuideRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getGuideRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Guide not found");
  const view = current.archivedAt ? "archived" : "active";
  const title = field(formData, "title", 180);
  const status = field(formData, "status", 20) as GuideStatus;
  const category = field(formData, "category", 80);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(title) || current.slug;
  const sections = parseSections(formData);

  if (!title) studioRedirect(id, "error", "A guide title is required", view);
  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!guideCategories.includes(category as (typeof guideCategories)[number])) studioRedirect(id, "error", "Choose a valid guide category", view);
  if (status === "published" && (!field(formData, "summary", 600) || !sections.some((section) => section.heading && section.body))) {
    studioRedirect(id, "error", "Published guides need a summary and at least one complete article section", view);
  }

  const nextRecord: GuideRecord = {
    ...current,
    slug,
    title,
    category,
    status,
    summary: field(formData, "summary", 600),
    sections,
    caution: field(formData, "caution", 2000),
    relatedSpeciesSlugs: field(formData, "relatedSpeciesSlugs", 2000).split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    updatedAt: new Date().toISOString(),
  };

  try {
    await replaceGuideRecord(nextRecord);
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save guide", view);
  }

  revalidatePath("/field-guide");
  revalidatePath(`/field-guide/${current.slug}`);
  revalidatePath(`/field-guide/${nextRecord.slug}`);
  revalidatePath("/search");
  studioRedirect(id, "saved", "1", view);
}

export async function toggleGuideArchive(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getGuideRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Guide not found");
  const restoring = Boolean(current.archivedAt);

  try {
    await replaceGuideRecord({ ...current, archivedAt: restoring ? null : new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to update archive");
  }

  revalidatePath("/field-guide");
  revalidatePath(`/field-guide/${current.slug}`);
  revalidatePath("/search");
  const params = new URLSearchParams({ view: restoring ? "active" : "archived", record: id, saved: "1" });
  redirect(`/admin/guides?${params.toString()}`);
}

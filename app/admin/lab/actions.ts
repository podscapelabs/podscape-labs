"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GuideSection } from "@/data/guides";
import { labCategories, type LabRecord, type LabStatus } from "@/data/lab";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendLabRecord, getLabRecords, replaceLabRecord } from "@/lib/lab-store";

function field(formData: FormData, name: string, limit = 4000) {
  return String(formData.get(name) || "").trim().slice(0, limit);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function studioRedirect(record: string, key: "saved" | "created" | "error", message = "1", view?: "active" | "archived"): never {
  const params = new URLSearchParams({ record, [key]: message });
  if (view) params.set("view", view);
  redirect(`/admin/lab?${params.toString()}`);
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

export async function createLabRecord() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = `lab-${randomUUID()}`;
  const record: LabRecord = {
    id,
    slug: `draft-${id.slice(-8)}`,
    category: labCategories[0],
    title: "Untitled studio note",
    summary: "",
    status: "draft",
    publishedAt: "",
    sections: [{ id: `section-${randomUUID()}`, heading: "", body: "" }],
    tags: [],
    relatedHref: "",
    relatedLabel: "",
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  };
  await appendLabRecord(record);
  revalidatePath("/from-the-lab");
  revalidatePath("/admin/preview");
  studioRedirect(id, "created");
}

export async function saveLabRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getLabRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Studio note not found");
  const view = current.archivedAt ? "archived" : "active";
  const title = field(formData, "title", 180);
  const status = field(formData, "status", 20) as LabStatus;
  const category = field(formData, "category", 80);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(title) || current.slug;
  const sections = parseSections(formData);
  const summary = field(formData, "summary", 600);

  if (!title) studioRedirect(id, "error", "A title is required", view);
  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!labCategories.includes(category as (typeof labCategories)[number])) studioRedirect(id, "error", "Choose a valid category", view);
  if (status === "published" && (!summary || !sections.some((section) => section.heading && section.body))) {
    studioRedirect(id, "error", "Published notes need a summary and at least one complete article section", view);
  }

  const nextRecord: LabRecord = {
    ...current,
    slug,
    title,
    category,
    status,
    summary,
    publishedAt: field(formData, "publishedAt", 20),
    sections,
    tags: field(formData, "tags", 2000).split(",").map((value) => value.trim()).filter(Boolean),
    relatedHref: field(formData, "relatedHref", 500),
    relatedLabel: field(formData, "relatedLabel", 100),
    updatedAt: new Date().toISOString(),
  };

  try {
    await replaceLabRecord(nextRecord);
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save studio note", view);
  }

  revalidatePath("/from-the-lab");
  revalidatePath(`/from-the-lab/${current.slug}`);
  revalidatePath(`/from-the-lab/${nextRecord.slug}`);
  revalidatePath("/admin/preview");
  revalidatePath("/search");
  studioRedirect(id, "saved", "1", view);
}

export async function toggleLabArchive(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getLabRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Studio note not found");
  const restoring = Boolean(current.archivedAt);
  try {
    await replaceLabRecord({ ...current, archivedAt: restoring ? null : new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (error) {
    studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to update archive");
  }
  revalidatePath("/from-the-lab");
  revalidatePath(`/from-the-lab/${current.slug}`);
  revalidatePath("/admin/preview");
  revalidatePath("/search");
  redirect(`/admin/lab?view=${restoring ? "active" : "archived"}&record=${id}&saved=1`);
}

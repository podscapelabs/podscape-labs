"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productCategories, type ProductAvailability, type ProductRecord, type ProductStatus } from "@/data/products";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendProductRecord, getProductRecords, replaceProductRecord, saveProductPhoto } from "@/lib/product-store";

function field(formData: FormData, name: string, limit = 4000) { return String(formData.get(name) || "").trim().slice(0, limit); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
function boundedNumber(formData: FormData, name: string, minimum: number, maximum: number, fallback: number) { const value = Number(formData.get(name)); return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback; }
function studioRedirect(record: string, key: "saved" | "created" | "error", message = "1", view?: "active" | "archived"): never { const params = new URLSearchParams({ record, [key]: message }); if (view) params.set("view", view); redirect(`/admin/products?${params.toString()}`); }

export async function createProductRecord() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = `product-${randomUUID()}`;
  const record: ProductRecord = { id, slug: `draft-${id.slice(-8)}`, title: "Untitled product", category: productCategories[0], summary: "", description: "", priceCents: 0, currency: "CAD", status: "draft", availability: "coming-soon", featured: false, image: null, imageAlt: "", imagePositionX: 50, imagePositionY: 50, imageZoom: 1, tags: [], materials: "", shippingNote: "", archivedAt: null, updatedAt: new Date().toISOString() };
  await appendProductRecord(record);
  revalidatePath("/shop");
  studioRedirect(id, "created");
}

export async function saveProductRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getProductRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Product not found");
  const view = current.archivedAt ? "archived" : "active";
  const title = field(formData, "title", 180);
  const status = field(formData, "status", 20) as ProductStatus;
  const availability = field(formData, "availability", 30) as ProductAvailability;
  const category = field(formData, "category", 80);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(title) || current.slug;
  const price = Number(field(formData, "price", 20));
  const priceCents = Number.isFinite(price) ? Math.max(0, Math.round(price * 100)) : current.priceCents;
  if (!title) studioRedirect(id, "error", "A product title is required", view);
  if (!productCategories.includes(category as (typeof productCategories)[number])) studioRedirect(id, "error", "Choose a valid product category", view);
  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!["coming-soon", "in-stock", "sold-out"].includes(availability)) studioRedirect(id, "error", "Invalid availability", view);
  if (status === "published" && (!field(formData, "summary", 600) || priceCents <= 0)) studioRedirect(id, "error", "Published products need a summary and a price", view);
  let image = current.image;
  if (formData.get("removePhoto") === "yes") image = null;
  const photo = formData.get("photo");
  try { if (photo instanceof File && photo.size > 0) image = await saveProductPhoto(id, photo); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product photo", view); }
  const nextRecord: ProductRecord = { ...current, slug, title, category, summary: field(formData, "summary", 600), description: field(formData, "description", 8000), priceCents, status, availability, featured: formData.get("featured") === "yes", image, imageAlt: field(formData, "imageAlt", 240), imagePositionX: boundedNumber(formData, "imagePositionX", 0, 100, current.imagePositionX), imagePositionY: boundedNumber(formData, "imagePositionY", 0, 100, current.imagePositionY), imageZoom: boundedNumber(formData, "imageZoom", 1, 2, current.imageZoom), tags: field(formData, "tags", 1000).split(",").map((tag) => tag.trim()).filter(Boolean), materials: field(formData, "materials", 2000), shippingNote: field(formData, "shippingNote", 2000), updatedAt: new Date().toISOString() };
  try { await replaceProductRecord(nextRecord); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product", view); }
  revalidatePath("/shop"); revalidatePath(`/shop/${current.slug}`); revalidatePath(`/shop/${nextRecord.slug}`); revalidatePath("/search");
  studioRedirect(id, "saved", "1", view);
}

export async function toggleProductArchive(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const records = await getProductRecords();
  const current = records.find((record) => record.id === id);
  if (!current) studioRedirect(id, "error", "Product not found");
  const restoring = Boolean(current.archivedAt);
  try { await replaceProductRecord({ ...current, archivedAt: restoring ? null : new Date().toISOString(), updatedAt: new Date().toISOString() }); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to update archive"); }
  revalidatePath("/shop"); revalidatePath(`/shop/${current.slug}`); revalidatePath("/search");
  redirect(`/admin/products?${new URLSearchParams({ view: restoring ? "active" : "archived", record: id, saved: "1" }).toString()}`);
}

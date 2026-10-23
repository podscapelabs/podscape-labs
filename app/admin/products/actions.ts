"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productCategories, type ProductAvailability, type ProductRecord, type ProductStatus, type ProductOptionType, type ProductVariant } from "@/data/products";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { appendProductRecord, getProductRecords, replaceProductRecord, saveProductPhoto } from "@/lib/product-store";
import { getSpeciesRecords } from "@/lib/species-store";

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

/** Create a draft product from a validated Ledger record; never copy its photo or publish. */
export async function createProductFromLedger(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const speciesId = field(formData, "speciesId", 100);
  const species = (await getSpeciesRecords()).find(record =>
    record.id === speciesId && record.kind === "species" && !record.archivedAt &&
    Boolean(record.commonName.trim())
  );
  if (!species) redirect("/admin/products?error=Choose+a+valid+active+Ledger+species");
  const id = `product-${randomUUID()}`;
  const tags = [...new Set([species.genus, species.species, species.morph, ...species.tags]
    .map(value => value.trim()).filter(Boolean))].slice(0, 20);
  const record: ProductRecord = {
    id, ledgerSpeciesId: species.id, slug: `draft-${id.slice(-8)}`,
    title: species.commonName.trim().slice(0, 180),
    category: "Isopods & Springtails",
    summary: species.summary.slice(0, 600),
    description: "", priceCents: 0, currency: "CAD", status: "draft",
    availability: "coming-soon", featured: false,
    image: null, imageAlt: "", imagePositionX: 50, imagePositionY: 50, imageZoom: 1,
    tags, materials: "", shippingNote: "", archivedAt: null,
    updatedAt: new Date().toISOString()
  };
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
  const requestedSpeciesId = field(formData, "ledgerSpeciesId", 100);
  const linkedSpecies = requestedSpeciesId ? (await getSpeciesRecords()).find(record => record.id === requestedSpeciesId && record.kind === "species" && !record.archivedAt) : null;
  if (requestedSpeciesId && !linkedSpecies) studioRedirect(id, "error", "Choose a valid active Ledger species", view);
  const title = field(formData, "title", 180);
  const status = field(formData, "status", 20) as ProductStatus;
  const availability = field(formData, "availability", 30) as ProductAvailability;
  const category = field(formData, "category", 80);
  const requestedSlug = slugify(field(formData, "slug", 100));
  const slug = requestedSlug || slugify(title) || current.slug;
  const price = Number(field(formData, "price", 20));
  const priceCents = Number.isFinite(price) ? Math.max(0, Math.round(price * 100)) : current.priceCents;
  const optionType=field(formData,"optionType",12) as ProductOptionType || "none";
  if (!["none","count","size"].includes(optionType)) studioRedirect(id,"error","Choose valid selling options",view);
  const stockText = field(formData,"stockQuantity",20);
  const stockQuantity = stockText === "" ? null : Number(stockText);
  const lowStockThreshold = Number(field(formData,"lowStockThreshold",20) || "3");
  if (stockQuantity !== null && (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100000000)) studioRedirect(id,"error","Enter a valid nonnegative stock quantity",view);
  if (!Number.isSafeInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 100000000) studioRedirect(id,"error","Enter a valid low-stock threshold",view);
  let variants: ProductVariant[] = [];
  if (optionType !== "none") {
    let raw: unknown;
    try { raw=JSON.parse(field(formData,"variantsJson",12000)); } catch { studioRedirect(id,"error","Invalid product option data",view); }
    if (!Array.isArray(raw) || raw.length>30) studioRedirect(id,"error","Choose up to 30 selling options",view);
    const labels=new Set<string>();const counts=new Set<number>();
    variants=raw.map((value:unknown,index:number)=>{
      if (!value||typeof value!=="object") studioRedirect(id,"error","Invalid option",view);
      const row=value as Record<string,unknown>;
      const label=String(row.label||"").trim().slice(0,60);
      const amount=Number(row.priceCents);
      const count=Number(row.count);
      if (!label||!Number.isSafeInteger(amount)||amount<0||amount>100000000) studioRedirect(id,"error",`Enter a valid label and price for option ${index+1}`,view);
      if (labels.has(label.toLowerCase())) studioRedirect(id,"error","Option labels must be unique",view);
      labels.add(label.toLowerCase());
      if(optionType==="count"){
        if(!Number.isSafeInteger(count)||count<1||count>100000) studioRedirect(id,"error","Enter a valid item count",view);
        if(counts.has(count)) studioRedirect(id,"error","Each colony count must be unique",view);
        counts.add(count);
      }
      const stock = row.stockQuantity === null || row.stockQuantity === undefined || row.stockQuantity === "" ? null : Number(row.stockQuantity);
      const threshold = Number(row.lowStockThreshold ?? 3);
      if (stock !== null && (!Number.isSafeInteger(stock) || stock < 0 || stock > 100000000)) studioRedirect(id,"error",`Invalid stock for option ${index+1}`,view);
      if (!Number.isSafeInteger(threshold) || threshold < 0 || threshold > 100000000) studioRedirect(id,"error",`Invalid low-stock threshold for option ${index+1}`,view);
      return {id:String(row.id||`option-${index}`).slice(0,100),label,priceCents:amount,sku:String(row.sku||"").trim().slice(0,64),stockQuantity:stock,lowStockThreshold:threshold,...(optionType==="count"?{count}:{})};
    });
    if(status==="published"&&variants.length===0) studioRedirect(id,"error","Add at least one selling option before publishing",view);
  }
  const effectivePrice=variants.length?Math.min(...variants.map(v=>v.priceCents)):priceCents;
  if (!title) studioRedirect(id, "error", "A product title is required", view);
  if (!productCategories.includes(category as (typeof productCategories)[number])) studioRedirect(id, "error", "Choose a valid product category", view);
  if (!["draft", "published"].includes(status)) studioRedirect(id, "error", "Invalid publication status", view);
  if (!["coming-soon", "in-stock", "sold-out"].includes(availability)) studioRedirect(id, "error", "Invalid availability", view);
  if (status === "published" && (!field(formData, "summary", 600) || effectivePrice <= 0)) studioRedirect(id, "error", "Published products need a summary and a price", view);
  let image = current.image;
  if (formData.get("removePhoto") === "yes") image = null;
  const photo = formData.get("photo");
  try { if (photo instanceof File && photo.size > 0) image = await saveProductPhoto(id, photo); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product photo", view); }
  const stockChanges: NonNullable<ProductRecord["stockHistory"]> = [];
  const trackStock = (label: string, sku: string, before: number | null | undefined, after: number | null | undefined) => {
    if ((before ?? null) !== (after ?? null)) stockChanges.push({at:new Date().toISOString(),label,sku,before:before??null,after:after??null});
  };
  if (optionType === "none") trackStock("Single item",field(formData,"sku",64),current.stockQuantity,stockQuantity);
  if (optionType !== "none") for (const variant of variants) {
    const previous = current.variants?.find(value=>value.id===variant.id);
    trackStock(variant.label,variant.sku||"",previous?.stockQuantity,variant.stockQuantity);
  }
  const nextRecord: ProductRecord = { ...current, stockHistory:[...stockChanges,...(current.stockHistory||[])].slice(0,100), ledgerSpeciesId: linkedSpecies?.id || null, slug, title, category, summary: field(formData, "summary", 600), description: field(formData, "description", 8000), priceCents, sku:field(formData,"sku",64), stockQuantity, lowStockThreshold, optionType, variants, status, availability, featured: formData.get("featured") === "yes", image, imageAlt: field(formData, "imageAlt", 240), imagePositionX: boundedNumber(formData, "imagePositionX", 0, 100, current.imagePositionX), imagePositionY: boundedNumber(formData, "imagePositionY", 0, 100, current.imagePositionY), imageZoom: boundedNumber(formData, "imageZoom", 1, 2, current.imageZoom), tags: field(formData, "tags", 1000).split(",").map((tag) => tag.trim()).filter(Boolean), materials: field(formData, "materials", 2000), shippingNote: field(formData, "shippingNote", 2000), updatedAt: new Date().toISOString() };
  try { await replaceProductRecord(nextRecord); } catch (error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to save product", view); }
  revalidatePath("/shop"); revalidatePath(`/shop/${current.slug}`); revalidatePath(`/shop/${nextRecord.slug}`); revalidatePath("/search");
  studioRedirect(id, "saved", "1", view);
}

/** Duplicate into a draft. Never duplicate committed stock or SKU identifiers. */
export async function duplicateProductRecord(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const source = (await getProductRecords()).find(record => record.id === id);
  if (!source) studioRedirect(id,"error","Product not found");
  const newId = `product-${randomUUID()}`;
  const next: ProductRecord = {
    ...source, id:newId, slug:`draft-${newId.slice(-8)}`,
    title:`${source.title} (copy)`.slice(0,180),status:"draft",featured:false,
    sku:"",stockQuantity:null,archivedAt:null,
    variants:source.variants?.map(v=>({...v,id:randomUUID(),sku:"",stockQuantity:null})),
    updatedAt:new Date().toISOString()
  };
  try { await appendProductRecord(next); } catch(error) {
    studioRedirect(id,"error",error instanceof Error?error.message:"Unable to duplicate product");
  }
  studioRedirect(newId,"created");
}

/** Explicit import: copy curated Ledger information; do not alter prices, variants, publication or custom photos. */
export async function pullProductDetailsFromLedger(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const id = field(formData, "id", 100);
  const speciesId = field(formData, "ledgerSpeciesId", 100);
  const product = (await getProductRecords()).find(record => record.id === id);
  if (!product) studioRedirect(id, "error", "Product not found");
  const view = product.archivedAt ? "archived" : "active";
  if (product.category !== "Isopods & Springtails") studioRedirect(id, "error", "Ledger imports are for isopod and springtail products", view);
  const species = (await getSpeciesRecords()).find(record => record.id === speciesId && record.kind === "species" && !record.archivedAt);
  if (!species) studioRedirect(id, "error", "Select an active Ledger species first", view);
  const tags = [...new Set([species.genus, species.species, species.morph, ...species.tags].map(tag => tag.trim()).filter(Boolean))].slice(0, 25);
  const nextRecord: ProductRecord = {
    ...product, ledgerSpeciesId: species.id,
    title: species.commonName || product.title,
    summary: species.summary || product.summary,
    description: species.about || product.description,
    tags: tags.length ? tags : product.tags,
    image: product.image || species.image,
    imageAlt: product.image ? product.imageAlt : (species.imageAlt || species.commonName),
    updatedAt: new Date().toISOString(),
  };
  try { await replaceProductRecord(nextRecord); }
  catch(error) { studioRedirect(id, "error", error instanceof Error ? error.message : "Unable to pull Ledger details", view); }
  revalidatePath("/shop"); revalidatePath(`/shop/${product.slug}`); revalidatePath("/search");
  redirect(`/admin/products?${new URLSearchParams({record:id,view,pulled:"1"}).toString()}`);
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

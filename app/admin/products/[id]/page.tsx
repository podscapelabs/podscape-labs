import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductEditor } from "@/components/ProductEditor";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProductManagementData, getProductRecords } from "@/lib/product-store";
import { getSpeciesRecords } from "@/lib/species-store";
import styles from "../products.module.css";

export const dynamic = "force-dynamic";

export default async function ProductEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; created?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const [{ id }, messageParams, products, speciesRecords] = await Promise.all([params, searchParams, getProductRecords(), getSpeciesRecords()]);
  const product = products.find((record) => record.id === decodeURIComponent(id));
  if (!product) notFound();
  const management = await getProductManagementData(product);

  return <main className={`admin-shell ${styles.shell}`}>
    <header className={styles.editorHeader}>
      <Link className={styles.back} href="/admin/products" aria-label="Return to products">←</Link>
      <div><p className="eyebrow">{product.status === "published" ? "Published product" : "Product draft"}</p><h1>{product.title}</h1><p>Last saved {new Date(product.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p></div>
      <div className={styles.editorActions}><Link href={`/shop/${product.slug}`} target="_blank">Preview</Link><button type="submit" form="product-editor-form">Save</button></div>
    </header>
    <ProductEditor product={product} speciesOptions={speciesRecords.filter((record) => record.kind === "species" && !record.archivedAt).map((record) => ({ id: record.id, commonName: record.commonName, scientificName: record.scientificName }))} variants={management.variants} adjustments={management.adjustments} normalized={management.normalized} saved={Boolean(messageParams.saved)} created={Boolean(messageParams.created)} error={messageParams.error} />
  </main>;
}

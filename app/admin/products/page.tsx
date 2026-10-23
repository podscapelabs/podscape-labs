import styles from "./ProductDesk.module.css";
import {OwnerDeskShell} from "@/components/admin/OwnerDeskShell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductLedgerQuickStart } from "@/components/admin/ProductLedgerQuickStart";
import { ProductDeskWorkspace } from "@/components/admin/ProductDeskWorkspace";
import { ShopManagerList } from "@/components/admin/ShopManagerList";
import { getSpeciesRecords } from "@/lib/species-store";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProductRecords } from "@/lib/product-store";
import { createProductRecord, duplicateProductRecord, toggleProductArchive } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProductDeskPage({ searchParams }: { searchParams: Promise<{ record?: string; view?: string; saved?: string; created?: string; pulled?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const [records, ledgerRecords] = await Promise.all([getProductRecords(), getSpeciesRecords()]);
  const ledgerChoices = ledgerRecords.filter(record => record.kind === "species" && !record.archivedAt && record.commonName.trim()).map(record => ({id:record.id,name:record.commonName,scientificName:record.scientificName,catalogueNumber:record.catalogueNumber,identityStatus:record.identityStatus})).sort((a,b)=>a.name.localeCompare(b.name));
  const archivedView = params.view === "archived";
  const activeRecords = records.filter((record) => !record.archivedAt);
  const archivedRecords = records.filter((record) => Boolean(record.archivedAt));
  const visibleRecords = archivedView ? archivedRecords : activeRecords;
  const selected = params.record ? records.find((record) => record.id === params.record) : undefined;
  return <OwnerDeskShell><main className={`admin-shell admin-ledger-desk ${styles.desk}`}><header className="admin-dashboard-head admin-ledger-head"><div><p className="eyebrow">Manager / Shop</p><h1>Shop Manager</h1><p>Products, inventory and publishing in one workspace.</p></div><div className="admin-dashboard-actions"><Link className="button button-outline" href="/owner-studio">Dashboard</Link><Link className="button button-primary" href="/shop" target="_blank">Open Shop</Link></div></header><div className={`admin-ledger-layout ${selected ? styles.editLayout : styles.overviewLayout}`}>{!selected ? <aside className="admin-record-list" id="studio-create">
<ShopManagerList products={records}/>
{!archivedView ? <><details className="owner-quick-create"><summary>Create from Leaf Ledger <span aria-hidden="true">⌄</span></summary><ProductLedgerQuickStart species={ledgerChoices}/></details><form action={createProductRecord}><button className="button button-outline" type="submit">+ New blank product</button></form></> : null}
</aside> : null}{selected ? <section key={selected.id} id="product-editor" className="admin-record-editor"><Link href="/admin/products" className={styles.backLink}>← All products</Link>
{params.saved ? <p className="admin-save-message is-success">Product saved. The Shop and search index now use this version.</p> : null}
{params.created ? <p className="admin-save-message is-success">Product draft created. Add details below.</p> : null}
{params.pulled ? <p className="admin-save-message is-success">Ledger details pulled into this product. Review the copied information before publishing.</p> : null}
{params.error ? <p className="admin-save-message is-error">{params.error}</p> : null}
<ProductDeskWorkspace product={selected} ledgerChoices={ledgerChoices}/><form action={duplicateProductRecord} className={styles.duplicateAction}><input type="hidden" name="id" value={selected.id}/><button className="button button-outline" type="submit">Duplicate as new draft</button></form>
<details className={styles.archiveFold}><summary>Archive or restore product</summary><form className="admin-archive-form" action={toggleProductArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this product" : "Archive this product"}</strong><p>{selected.archivedAt ? "Restoring returns it to the Shop Manager." : "Archiving hides the listing from Shop without deleting its details."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore product" : "Archive product"}</button></form></details>
</section> : null}</div></main></OwnerDeskShell>;
}

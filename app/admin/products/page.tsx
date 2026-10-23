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
import { createProductRecord, toggleProductArchive } from "./actions";

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
  const selected = visibleRecords.find((record) => record.id === params.record) || visibleRecords[0];
  return <OwnerDeskShell><main className={`admin-shell admin-ledger-desk ${styles.desk}`}><header className="admin-dashboard-head admin-ledger-head"><div><p className="eyebrow">Manager / Shop</p><h1>Product Desk</h1><p>Create and manage shop listings quickly.</p></div><div className="admin-dashboard-actions"><Link className="button button-outline" href="/owner-studio">Owner studio</Link><Link className="button button-primary" href="/shop" target="_blank">Open Shop</Link></div></header><div className="admin-ledger-layout"><aside className="admin-record-list" id="studio-create">
<ShopManagerList products={records} selectedId={selected?.id}/>
{!archivedView ? <><details className="owner-quick-create"><summary>Create from Leaf Ledger <span aria-hidden="true">⌄</span></summary><ProductLedgerQuickStart species={ledgerChoices}/></details><form action={createProductRecord}><button className="button button-outline" type="submit">+ New blank product</button></form></> : null}
</aside>{selected ? <section key={selected.id} className="admin-record-editor">
{params.saved ? <p className="admin-save-message is-success">Product saved. The Shop and search index now use this version.</p> : null}
{params.created ? <p className="admin-save-message is-success">Blank product created. Open a card to add details.</p> : null}
{params.pulled ? <p className="admin-save-message is-success">Ledger details pulled into this product. Review the copied information before publishing.</p> : null}
{params.error ? <p className="admin-save-message is-error">{params.error}</p> : null}
<ProductDeskWorkspace product={selected} ledgerChoices={ledgerChoices}/>
<details className={styles.archiveFold}><summary>Archive or restore product</summary><form className="admin-archive-form" action={toggleProductArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this product" : "Archive this product"}</strong><p>{selected.archivedAt ? "Restoring returns it to the active Product Desk." : "Archiving hides the listing from Shop without deleting its details."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore product" : "Archive product"}</button></form></details>
</section> : <section className="admin-record-editor admin-empty-desk"><div><p className="admin-kicker">Product catalogue</p><h2>No products yet.</h2><p>Create the first blank product from the left-hand desk. Nothing will be purchasable until Shopify is connected.</p></div></section>}</div></main></OwnerDeskShell>;
}

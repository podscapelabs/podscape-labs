import {OwnerDeskShell} from "@/components/admin/OwnerDeskShell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GuideSectionsEditor } from "@/components/GuideSectionsEditor";
import { OwnerSpeciesLinkPicker } from "@/components/admin/OwnerQuickFields";
import { getSpeciesRecords } from "@/lib/species-store";
import { guideCategories } from "@/data/guides";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getGuideRecords } from "@/lib/guide-store";
import { createGuideRecord, saveGuideRecord, toggleGuideArchive } from "./actions";

export const dynamic = "force-dynamic";

export default async function GuideDeskPage({ searchParams }: { searchParams: Promise<{ record?: string; view?: string; saved?: string; created?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const [records, ledgerRecords] = await Promise.all([getGuideRecords(), getSpeciesRecords()]);
  const speciesChoices = ledgerRecords.filter(record => record.kind==="species" && !record.archivedAt && record.commonName.trim()).map(record => ({slug:record.slug,label:record.commonName,scientificName:record.scientificName})).sort((a,b)=>a.label.localeCompare(b.label));
  const archivedView = params.view === "archived";
  const activeRecords = records.filter((record) => !record.archivedAt);
  const archivedRecords = records.filter((record) => Boolean(record.archivedAt));
  const visibleRecords = archivedView ? archivedRecords : activeRecords;
  const selected = visibleRecords.find((record) => record.id === params.record) || visibleRecords[0];

  return <OwnerDeskShell><main className="admin-shell admin-ledger-desk">
    <header className="admin-dashboard-head admin-ledger-head"><div><p className="eyebrow">Field Guide · Owner studio</p><h1>Editorial desk</h1><p>Write, review, and connect practical resources without publishing incomplete husbandry guidance.</p></div><div className="admin-dashboard-actions"><Link className="button button-outline" href="/owner-studio">Owner studio</Link><Link className="button button-primary" href="/field-guide" target="_blank">Open Field Guide</Link></div></header>
    <div className="admin-ledger-layout">
      <aside className="admin-record-list" id="studio-create"><div><span>{archivedView ? "Archived guides" : "Active guides"}</span><strong>{visibleRecords.length}</strong></div><div className="admin-record-views"><Link className={!archivedView ? "is-active" : ""} href="/admin/guides">Active · {activeRecords.length}</Link><Link className={archivedView ? "is-active" : ""} href="/admin/guides?view=archived">Archived · {archivedRecords.length}</Link></div><nav aria-label="Field Guide records">{visibleRecords.map((guide) => <Link className={guide.id === selected?.id ? "is-active" : ""} href={`/admin/guides?view=${archivedView ? "archived" : "active"}&record=${guide.id}`} key={guide.id}><small>{guide.category}</small><b>{guide.title}</b><em>{guide.summary || "Summary pending"}</em><span>{guide.archivedAt ? "Archived" : guide.status}</span></Link>)}</nav>{!archivedView ? <form action={createGuideRecord}><button className="button button-outline" type="submit">+ New blank guide</button></form> : null}</aside>
      {selected ? <section className="admin-record-editor"><header className="admin-record-editor-head admin-guide-editor-head"><div><p className="admin-kicker">Permanent ID · {selected.id}</p><h2>{selected.title}</h2><p>{selected.category} · {selected.status} · Last saved {new Date(selected.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="admin-guide-monogram" aria-hidden="true">FG</div></header>{params.saved ? <p className="admin-save-message is-success">Guide saved. The Field Guide and search index now use this version.</p> : null}{params.created ? <p className="admin-save-message is-success">Blank guide created. Its permanent ID will not change.</p> : null}{params.error ? <p className="admin-save-message is-error">{params.error}</p> : null}
        <form className="admin-species-form" action={saveGuideRecord}><input type="hidden" name="id" value={selected.id} /><fieldset><legend>Editorial control</legend><div className="admin-form-grid three"><label><span>Category</span><select name="category" defaultValue={selected.category}>{guideCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label><span>Publication</span><select name="status" defaultValue={selected.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label><span>URL slug</span><input name="slug" defaultValue={selected.slug} /></label></div><label><span>Guide title</span><input name="title" defaultValue={selected.title} /></label><label><span>Guide summary</span><textarea name="summary" defaultValue={selected.summary} rows={3} /></label></fieldset><fieldset><legend>Article sections</legend><GuideSectionsEditor initialSections={selected.sections} /></fieldset><fieldset><legend>Context and connections</legend><label><span>Important caution or context</span><textarea name="caution" defaultValue={selected.caution} rows={5} placeholder="Optional. Use this for material readers should see before applying the guide." /></label><OwnerSpeciesLinkPicker initial={selected.relatedSpeciesSlugs} species={speciesChoices}/></fieldset><div className="admin-form-footer"><p>Published guides require a summary and at least one section with both a heading and body. Drafts remain clearly labelled in the private platform.</p><button className="button button-primary" type="submit">Save guide</button></div></form>
        <form className="admin-archive-form" action={toggleGuideArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this guide" : "Archive this guide"}</strong><p>{selected.archivedAt ? "Restoring returns it to the editorial desk and Field Guide preview." : "Archiving hides it from the Field Guide and search without deleting its writing."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore guide" : "Archive guide"}</button></form>
      </section> : <section className="admin-record-editor"><p>No guide records exist in this view.</p></section>}
    </div>
  </main></OwnerDeskShell>;
}

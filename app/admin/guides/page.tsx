import Link from "next/link";
import {OwnerDeskHeader,OwnerDeskNotice} from "@/components/OwnerDeskFoundation";
import { redirect } from "next/navigation";
import { GuideSectionsEditor } from "@/components/GuideSectionsEditor";
import { GuideDeskNavigator } from "./GuideDeskNavigator";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import styles from "./guide-desk.module.css";
import { guideCategories } from "@/data/guides";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getGuideRecords } from "@/lib/guide-store";
import { createGuideRecord, saveGuideRecord, toggleGuideArchive } from "./actions";

export const dynamic = "force-dynamic";

export default async function GuideDeskPage({ searchParams }: { searchParams: Promise<{ record?: string; view?: string; saved?: string; created?: string; error?: string; q?: string; category?: string; status?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const records = await getGuideRecords();
  const archivedView = params.view === "archived";
  const activeRecords = records.filter((record) => !record.archivedAt);
  const archivedRecords = records.filter((record) => Boolean(record.archivedAt));
  const visibleRecords = archivedView ? archivedRecords : activeRecords;
  const selected = visibleRecords.find((record) => record.id === params.record) || visibleRecords[0];

  const publishedCount = activeRecords.filter(record => record.status === "published").length;
  const draftCount = activeRecords.length - publishedCount;
  return <main className={styles.page}>
    <div className={styles.workspace}>
      <OwnerDeskHeader area="Field Guide" title="Guide Desk" description="Write, organize and publish keeper resources in one workspace." icon="book" actions={[{href:"/field-guide",label:"View Field Guide",icon:"book",external:true}]}/>
      <div className={styles.metrics} aria-label="Guide overview">
        <a href="#guide-records"><strong>{activeRecords.length}</strong><span>Active guides</span></a>
        <a href="#guide-records"><strong>{publishedCount}</strong><span>Published</span></a>
        <a href="#guide-records"><strong>{draftCount}</strong><span>Drafts</span></a>
        <a href="#guide-records"><strong>{archivedRecords.length}</strong><span>Archived</span></a>
      </div>
      <nav className={styles.shortcuts} aria-label="Guide Desk shortcuts">
        <a href="#guide-records"><PodscapeLineIcon name="search"/> Find a guide</a>
        <a href="#guide-editor"><PodscapeLineIcon name="edit"/> Edit details</a>
        <a href="#guide-article"><PodscapeLineIcon name="book"/> Article sections</a>
        <a href="#guide-connections"><PodscapeLineIcon name="leaf"/> Connections</a>
      </nav>
      <div className={styles.layout}>
        <aside className={styles.sidebar} id="guide-records">
          <div className={styles.sidebarHead}><div><p className={styles.eyebrow}>YOUR LIBRARY</p><h2>Guide records</h2></div><span className={styles.count}>{visibleRecords.length}</span></div>
          <div className={styles.views}><Link className={!archivedView ? styles.selectedView : ""} href="/admin/guides">Active · {activeRecords.length}</Link><Link className={archivedView ? styles.selectedView : ""} href="/admin/guides?view=archived">Archived · {archivedRecords.length}</Link></div>
          <GuideDeskNavigator records={visibleRecords.map(item => ({id:item.id,title:item.title,summary:item.summary,category:item.category,status:item.status,archived:Boolean(item.archivedAt)}))} selectedId={selected?.id} archivedView={archivedView} initialQuery={(params.q||"").slice(0,100)} initialCategory={params.category||"all"} initialStatus={params.status||"all"}/>
          {!archivedView ? <form action={createGuideRecord} className={styles.createForm}><button type="submit"><PodscapeLineIcon name="edit"/> New blank guide</button></form> : null}
        </aside>
      {selected ? <section className={styles.editor} id="guide-editor"><header className={styles.editorHead}><div><p className="admin-kicker">Permanent ID · {selected.id}</p><h2>{selected.title}</h2><p>{selected.category} · {selected.status} · Last saved {new Date(selected.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className={styles.editorIcon} aria-hidden="true"><PodscapeLineIcon name="book"/></div></header>{params.saved ? <OwnerDeskNotice kind="success">Guide saved. The Field Guide and search index now use this version.</OwnerDeskNotice> : null}{params.created ? <OwnerDeskNotice kind="success">Blank guide created. Its permanent ID will not change.</OwnerDeskNotice> : null}{params.error ? <OwnerDeskNotice kind="error">{params.error}</OwnerDeskNotice> : null}
        <form className={`admin-species-form ${styles.editorForm}`} action={saveGuideRecord}><input type="hidden" name="id" value={selected.id} /><fieldset><legend><span className={styles.sectionIcon}><PodscapeLineIcon name="edit"/></span> Editorial details</legend><div className="admin-form-grid three"><label><span>Category</span><select name="category" defaultValue={selected.category}>{guideCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label><span>Publication</span><select name="status" defaultValue={selected.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label><span>URL slug</span><input name="slug" defaultValue={selected.slug} /></label></div><label><span>Guide title</span><input name="title" defaultValue={selected.title} /></label><label><span>Guide summary</span><textarea name="summary" defaultValue={selected.summary} rows={3} /></label></fieldset><fieldset id="guide-article"><legend><span className={styles.sectionIcon}><PodscapeLineIcon name="book"/></span> Article sections</legend><GuideSectionsEditor initialSections={selected.sections} /></fieldset><fieldset id="guide-connections"><legend><span className={styles.sectionIcon}><PodscapeLineIcon name="leaf"/></span> Context and connections</legend><label><span>Important caution or context</span><textarea name="caution" defaultValue={selected.caution} rows={5} placeholder="Optional. Use this for material readers should see before applying the guide." /></label><label><span>Related Leaf Ledger slugs · one per line</span><textarea name="relatedSpeciesSlugs" defaultValue={selected.relatedSpeciesSlugs.join("\n")} rows={5} placeholder="dairy-cow" /></label></fieldset><div className={`admin-form-footer ${styles.saveFooter}`}><p>Published guides require a summary and at least one section with both a heading and body. Drafts remain clearly labelled in the private platform.</p><button className="button button-primary" type="submit">Save guide</button></div></form>
        <form className={`admin-archive-form ${styles.archiveForm}`} action={toggleGuideArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this guide" : "Archive this guide"}</strong><p>{selected.archivedAt ? "Restoring returns it to the editorial desk and Field Guide preview." : "Archiving hides it from the Field Guide and search without deleting its writing."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore guide" : "Archive guide"}</button></form>
      </section> : <section className={styles.emptyEditor}><PodscapeLineIcon name="book"/><h2>No guides in this view</h2><p>Create a blank guide or switch between active and archived records.</p></section>}
      </div>
    </div>
  </main>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPhotoEditor } from "@/components/AdminPhotoEditor";
import { LedgerUnsavedGuard } from "@/components/LedgerUnsavedGuard";
import { LedgerDeskWorkflow } from "@/components/LedgerDeskWorkflow";
import { NotableTraitPicker } from "@/components/NotableTraitPicker";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { speciesDisplayName, speciesRecordLabel, speciesScientificName } from "@/data/species";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesReadiness } from "@/lib/species-readiness";
import { createSpeciesRecord, saveSpeciesRecord, toggleSpeciesArchive } from "./actions";
import styles from "./ledger-desk.module.css";

export const dynamic = "force-dynamic";

type SpeciesDeskProps = {
  searchParams: Promise<{ record?: string; view?: string; saved?: string; created?: string; error?: string }>;
};

export default async function SpeciesDeskPage({ searchParams }: SpeciesDeskProps) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const records = await getSpeciesRecords();
  const archivedView = params.view === "archived";
  const activeRecords = records.filter((record) => !record.archivedAt);
  const archivedRecords = records.filter((record) => Boolean(record.archivedAt));
  const visibleRecords = archivedView ? archivedRecords : activeRecords;
  const selected = params.record ? visibleRecords.find((record) => record.id === params.record) : visibleRecords[0];
  const readiness = selected ? speciesReadiness(selected) : null;

  return <main className="admin-shell admin-ledger-desk">
    <header className="admin-dashboard-head admin-ledger-head">
      <div><p className="eyebrow">Leaf Ledger · Owner studio</p><h1>Ledger desk</h1><p>Prepare species records without publishing unverified identities or husbandry details.</p></div>
      <div className="admin-dashboard-actions"><Link className="button button-outline" href="/admin">Owner studio</Link><Link className="button button-primary" href="/ledger" target="_blank">Open Leaf Ledger</Link></div>
    </header>

    <div className="admin-ledger-layout">
      <aside className="admin-record-list">
        <div><span>{archivedView ? "Archived records" : "Active records"}</span><strong>{visibleRecords.length}</strong></div>
        <div className="admin-record-views"><Link className={!archivedView ? "is-active" : ""} href="/admin/species">Active · {activeRecords.length}</Link><Link className={archivedView ? "is-active" : ""} href="/admin/species?view=archived">Archived · {archivedRecords.length}</Link></div>
        <form method="get" className={styles.mobilePicker}>
          <input type="hidden" name="view" value={archivedView ? "archived" : "active"} />
          <label htmlFor="ledger-record-picker">Choose a species record</label>
          <select id="ledger-record-picker" name="record" defaultValue={selected?.id || ""}>{visibleRecords.map((record) => <option key={record.id} value={record.id}>{speciesDisplayName(record)} · {record.catalogueNumber}</option>)}</select>
          <button className="button button-primary" type="submit">Open record</button>
        </form>
        <nav className={styles.recordLinks} aria-label="Species records">{visibleRecords.map((record) => <Link className={record.id === selected?.id ? "is-active" : ""} href={`/admin/species?view=${archivedView ? "archived" : "active"}&record=${record.id}`} prefetch={false} key={record.id}><small>{record.catalogueNumber}</small><b>{speciesDisplayName(record)}</b><em>{speciesScientificName(record)}</em><span>{record.archivedAt ? "Archived" : `${speciesRecordLabel(record)} · ${record.status}`}</span></Link>)}</nav>
        {!archivedView ? <form action={createSpeciesRecord}><button className="button button-outline" type="submit">+ New blank record</button></form> : null}
      </aside>

      {selected ? <section className={`admin-record-editor ${styles.editor}`} key={selected.id}>
        <header className="admin-record-editor-head"><div><p className="admin-kicker">Permanent ID · {selected.id}</p><h2>{speciesDisplayName(selected)}</h2><p>{speciesRecordLabel(selected)} · Last saved {new Date(selected.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p></div><SpecimenLeaf image={selected.image} alt={selected.imageAlt} number={selected.catalogueNumber} size="card" positionX={selected.imagePositionX} positionY={selected.imagePositionY} zoom={selected.imageZoom} /></header>
        {params.saved ? <p className="admin-save-message is-success">Record saved. The Ledger and search index now use this version.</p> : null}
        {params.created ? <p className="admin-save-message is-success">Blank record created. Its permanent ID will not change.</p> : null}
        {params.error ? <p className="admin-save-message is-error">{params.error}</p> : null}
        <form id="ledger-species-editor" className={`admin-species-form ${styles.speciesForm}`} action={saveSpeciesRecord} key={selected.id}>
          <LedgerUnsavedGuard />
          <input type="hidden" name="id" value={selected.id} />
          <p className={styles.editingNotice}>Editing <strong>{speciesDisplayName(selected)}</strong> · {selected.catalogueNumber}</p>
          <div className={styles.deskQuickBar}>
            <div className={styles.deskCompletion} role="status"><strong>{readiness?.ready ? "Ready for review" : "Entry in progress"}</strong><span>{readiness?.ready ? "Core snapshot filled — verify accuracy before publishing." : `Still useful to add: ${readiness?.missing.slice(0,3).join(", ")}${(readiness?.missing.length||0)>3?"…":""}`}</span></div>
            <div className={styles.deskQuickActions}>
              <Link className={styles.previewLink} href={`/ledger/${selected.slug}?ownerPreview=1`} target="_blank" rel="noopener noreferrer">Preview species ↗</Link>
              <button className="button button-primary" type="submit">Save changes</button>
            </div>
          </div>
          <LedgerDeskWorkflow recordId={selected.id}>
          <div data-ledger-stage="identity" id="ledger-stage-identity">
          <fieldset id="ledger-identity"><legend>Identity</legend><div className="admin-form-grid two"><label><span>Common name</span><input name="commonName" defaultValue={selected.commonName} placeholder="Leave blank until assigned" /></label><label><span>Scientific name</span><input name="scientificName" defaultValue={selected.scientificName} placeholder="Leave blank until assigned" /></label><label><span>Genus</span><input name="genus" list="ledger-genus-options" defaultValue={selected.genus} placeholder="Select or type confirmed genus" /><datalist id="ledger-genus-options">{[...new Set(records.map(r=>r.genus).filter(Boolean))].sort().map(genus=><option key={genus} value={genus}/>)}</datalist><small>Suggestions from your existing records. Verify scientific identification before selecting.</small></label><label><span>Species</span><input name="species" defaultValue={selected.species} /></label><label><span>Morph or variety</span><input name="morph" defaultValue={selected.morph} /></label></div></fieldset>
          </div>
          <div data-ledger-stage="profile" id="ledger-stage-profile">
          <div id="ledger-profile" className={styles.workflowSection}>
            <div className={styles.workflowSectionHeading}>Species profile <small>About and short catalogue summary</small></div>
            <fieldset aria-label="Species profile description">
              <label><span>About · public species introduction</span><textarea name="about" defaultValue={selected.about} rows={4} placeholder="Brief description of what makes this species recognizable and interesting." /></label>
              <label><span>Catalogue summary · optional fallback</span><textarea name="summary" defaultValue={selected.summary} rows={2} placeholder="Short card description; used if About is blank." /></label>
            </fieldset>
          </div>
          </div>
          <div data-ledger-stage="status" id="ledger-stage-status">
          <fieldset id="ledger-status"><legend>Record control</legend><div className="admin-form-grid three"><label><span>Record type</span><select name="kind" defaultValue={selected.kind}><option value="species">Species record</option><option value="photo-test">Temporary photo test</option></select></label><label><span>Identity status</span><select name="identityStatus" defaultValue={selected.identityStatus}><option value="unassigned">Unassigned</option><option value="provisional">Provisional</option><option value="verified">Verified</option></select></label><label><span>Publication</span><select name="status" defaultValue={selected.archivedAt ? "archived" : selected.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><div className="admin-form-grid two"><label><span>Catalogue number</span><input name="catalogueNumber" defaultValue={selected.catalogueNumber} /></label><label><span>URL slug</span><input name="slug" defaultValue={selected.slug} /></label></div></fieldset>
          </div>
          <div data-ledger-stage="photo" id="ledger-stage-photo">
          <div id="ledger-photo" className={styles.workflowSection}><div className={styles.workflowSectionHeading}>Photography <small>Upload, crop, and describe the specimen</small></div><fieldset aria-label="Photography and summary"><AdminPhotoEditor key={selected.id} image={selected.image} imagePositionX={selected.imagePositionX} imagePositionY={selected.imagePositionY} imageZoom={selected.imageZoom} /><label><span>Accessible image description</span><input name="imageAlt" defaultValue={selected.imageAlt} placeholder="Describe the visible specimen without guessing its identity" /></label></fieldset></div>
          </div>
          <div data-ledger-stage="traits" id="ledger-stage-traits">
          <div id="ledger-traits" className={styles.workflowSection}>
            <div className={styles.workflowSectionHeading}>Notable traits <small>Select up to five traits from the reusable library</small></div>
            <fieldset aria-label="Notable traits">
              <NotableTraitPicker key={selected.id} initialTraits={selected.notableTraits || []} />
            </fieldset>
          </div>
          </div>
          <div data-ledger-stage="care" id="ledger-stage-care">
          <div id="ledger-care" className={styles.workflowSection}>
            <div className={styles.workflowSectionHeading}>At a glance <small>General species tendencies · quick reference, not care instructions</small></div>
            <fieldset aria-label="General species snapshot">
              <p className={styles.editingNotice}>Choose the broad tendencies supported by your research. Keep the details in guides, not in every Ledger entry.</p>
              <div className="admin-form-grid two">
                <label><span>Care level</span><select name="careLevel" defaultValue={selected.careLevel}>{["","Beginner","Intermediate","Advanced","Expert"].map(value=><option key={value} value={value}>{value||"Unspecified"}</option>)}{selected.careLevel&&!["","Beginner","Intermediate","Advanced","Expert"].includes(selected.careLevel)?<option value={selected.careLevel}>{selected.careLevel} (existing)</option>:null}</select></label>
                <label><span>Moisture preference</span><select name="moistureProfile" defaultValue={selected.moistureProfile||""}>
                  <option value="">Unspecified</option><option value="dry-leaning">Drier side</option><option value="dry-balanced">Dry to balanced</option><option value="balanced">Balanced</option><option value="balanced-moist">Balanced to moist</option><option value="moist-leaning">Moister side</option>
                </select><small>Relative preference along a moisture gradient, not a humidity percentage.</small></label>
                <label><span>Temperature · approximate</span><input name="temperature" defaultValue={selected.temperature} placeholder="e.g. 20–26°C" /></label>
                <label><span>Ventilation</span><select name="ventilation" defaultValue={selected.ventilation}>{["","Low","Moderate","High"].map(value=><option key={value} value={value}>{value||"Unspecified"}</option>)}{selected.ventilation&&!["","Low","Moderate","High"].includes(selected.ventilation)?<option value={selected.ventilation}>{selected.ventilation} (existing)</option>:null}</select></label>
                <label><span>Activity</span><select name="activity" defaultValue={selected.activity||""}>{["","Shy","Moderate","Active","Very Active"].map(value=><option key={value} value={value}>{value||"Unspecified"}</option>)}{selected.activity&&!["","Shy","Moderate","Active","Very Active"].includes(selected.activity)?<option value={selected.activity}>{selected.activity} (existing)</option>:null}</select></label>
                <label><span>Reproduction</span><select name="reproduction" defaultValue={selected.reproduction||""}>{["","Slow","Moderate","Fast","Prolific"].map(value=><option key={value} value={value}>{value||"Unspecified"}</option>)}{selected.reproduction&&!["","Slow","Moderate","Fast","Prolific"].includes(selected.reproduction)?<option value={selected.reproduction}>{selected.reproduction} (existing)</option>:null}</select></label>
                <label><span>Feeding response</span><select name="feedingResponse" defaultValue={selected.feedingResponse||""}>{["","Reserved","Moderate","Eager","Very eager","Not established"].map(value=><option key={value} value={value}>{value||"Unspecified"}</option>)}</select></label>
              </div>
              <details className={styles.optionalSection}><summary>Optional feeding and substrate <small>Only when a concise general note adds value</small></summary>
                <div className="admin-form-grid two">
                  <label><span>Feeding overview</span><textarea name="feeding" defaultValue={selected.feeding} rows={3} /></label>
                  <label><span>Substrate overview</span><textarea name="substrate" defaultValue={selected.substrate} rows={3} /></label>
                </div>
              </details>
            </fieldset>
          </div>
          </div>
          <div data-ledger-stage="notes" id="ledger-stage-notes">
          <div id="ledger-notes" className={styles.workflowSection}><div className={styles.workflowSectionHeading}>Editorial notes <small>Internal keeper notes and reference links</small></div><fieldset aria-label="Editorial notes"><label><span>Keeper notes</span><textarea name="keeperNotes" defaultValue={selected.keeperNotes} rows={7} /></label><label><span>Field Guide links · one path per line</span><textarea name="fieldGuideLinks" defaultValue={selected.fieldGuideLinks.join("\n")} rows={4} /></label></fieldset></div>
          </div>
          </LedgerDeskWorkflow>

        </form>
        <form className="admin-archive-form" action={toggleSpeciesArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this record" : "Archive this record"}</strong><p>{selected.archivedAt ? "Restoring returns it to the active Ledger desk and private preview." : "Archiving hides it from the Ledger and search without deleting its data or photograph."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore record" : "Archive record"}</button></form>
      </section> : <section className="admin-record-editor"><p>{params.record ? "The selected record was not found in this view. Choose another species from the list." : "No species records exist yet."}</p></section>}
    </div>
  </main>;
}

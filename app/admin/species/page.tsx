import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPhotoEditor } from "@/components/AdminPhotoEditor";
import { OwnerPresetInput } from "@/components/admin/OwnerQuickFields";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { speciesDisplayName, speciesRecordLabel, speciesScientificName } from "@/data/species";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSpeciesRecords } from "@/lib/species-store";
import { createSpeciesRecord, saveSpeciesRecord, toggleSpeciesArchive } from "./actions";

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
  const selected = visibleRecords.find((record) => record.id === params.record) || visibleRecords[0];

  return <main className="admin-shell admin-ledger-desk">
    <header className="admin-dashboard-head admin-ledger-head">
      <div><p className="eyebrow">Leaf Ledger · Owner studio</p><h1>Ledger desk</h1><p>Prepare species records without publishing unverified identities or husbandry details.</p></div>
      <div className="admin-dashboard-actions"><Link className="button button-outline" href="/admin">Owner studio</Link><Link className="button button-primary" href="/ledger" target="_blank">Open Leaf Ledger</Link></div>
    </header>

    <div className="admin-ledger-layout">
      <aside className="admin-record-list" id="studio-create">
        <div><span>{archivedView ? "Archived records" : "Active records"}</span><strong>{visibleRecords.length}</strong></div>
        <div className="admin-record-views"><Link className={!archivedView ? "is-active" : ""} href="/admin/species">Active · {activeRecords.length}</Link><Link className={archivedView ? "is-active" : ""} href="/admin/species?view=archived">Archived · {archivedRecords.length}</Link></div>
        <nav aria-label="Species records">{visibleRecords.map((record) => <Link className={record.id === selected?.id ? "is-active" : ""} href={`/admin/species?view=${archivedView ? "archived" : "active"}&record=${record.id}`} key={record.id}><small>{record.catalogueNumber}</small><b>{speciesDisplayName(record)}</b><em>{speciesScientificName(record)}</em><span>{record.archivedAt ? "Archived" : `${speciesRecordLabel(record)} · ${record.status}`}</span></Link>)}</nav>
        {!archivedView ? <form action={createSpeciesRecord}><button className="button button-outline" type="submit">+ New blank record</button></form> : null}
      </aside>

      {selected ? <section className="admin-record-editor">
        <header className="admin-record-editor-head"><div><p className="admin-kicker">Permanent ID · {selected.id}</p><h2>{speciesDisplayName(selected)}</h2><p>{speciesRecordLabel(selected)} · Last saved {new Date(selected.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p></div><SpecimenLeaf image={selected.image} alt={selected.imageAlt} number={selected.catalogueNumber} size="card" positionX={selected.imagePositionX} positionY={selected.imagePositionY} zoom={selected.imageZoom} /></header>
        {params.saved ? <p className="admin-save-message is-success">Record saved. The Ledger and search index now use this version.</p> : null}
        {params.created ? <p className="admin-save-message is-success">Blank record created. Its permanent ID will not change.</p> : null}
        {params.error ? <p className="admin-save-message is-error">{params.error}</p> : null}
        <form className="admin-species-form" action={saveSpeciesRecord}>
          <input type="hidden" name="id" value={selected.id} />
          <fieldset><legend>Record control</legend><div className="admin-form-grid three"><label><span>Record type</span><select name="kind" defaultValue={selected.kind}><option value="species">Species record</option><option value="photo-test">Temporary photo test</option></select></label><label><span>Identity status</span><select name="identityStatus" defaultValue={selected.identityStatus}><option value="unassigned">Unassigned</option><option value="provisional">Provisional</option><option value="verified">Verified</option></select></label><label><span>Publication</span><select name="status" defaultValue={selected.archivedAt ? "archived" : selected.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><div className="admin-form-grid two"><label><span>Catalogue number</span><input name="catalogueNumber" defaultValue={selected.catalogueNumber} /></label><label><span>URL slug</span><input name="slug" defaultValue={selected.slug} /></label></div></fieldset>
          <fieldset><legend>Identity</legend><div className="admin-form-grid two"><label><span>Common name</span><input name="commonName" defaultValue={selected.commonName} placeholder="Leave blank until assigned" /></label><label><span>Scientific name</span><input name="scientificName" defaultValue={selected.scientificName} placeholder="Leave blank until assigned" /></label><OwnerPresetInput name="genus" label="Genus" initial={selected.genus} options={["Cubaris","Porcellio","Porcellionides","Armadillidium","Armadillo","Trichorhina","Oniscus","Cylisticus","Asellus"]}/><label><span>Species</span><input name="species" defaultValue={selected.species} /></label><label><span>Morph or variety</span><input name="morph" defaultValue={selected.morph} /></label><label><span>Tags · comma separated</span><input name="tags" defaultValue={selected.tags.join(", ")} /></label></div></fieldset>
          <fieldset><legend>Photography and summary</legend><AdminPhotoEditor key={selected.id} image={selected.image} imagePositionX={selected.imagePositionX} imagePositionY={selected.imagePositionY} imageZoom={selected.imageZoom} /><label><span>Accessible image description</span><input name="imageAlt" defaultValue={selected.imageAlt} placeholder="Describe the visible specimen without guessing its identity" /></label><label><span>Catalogue summary</span><textarea name="summary" defaultValue={selected.summary} rows={3} /></label></fieldset>
          <fieldset><legend>Husbandry snapshot</legend><div className="admin-form-grid two"><OwnerPresetInput name="careLevel" label="Care level" initial={selected.careLevel} options={["Beginner","Intermediate","Advanced"]}/><OwnerPresetInput name="moisture" label="Moisture" initial={selected.moisture} options={["Moderate moisture gradient","Humid, with a moisture gradient","Drier setup with a moist refuge"]}/><label><span>Temperature</span><input name="temperature" defaultValue={selected.temperature} /></label><OwnerPresetInput name="ventilation" label="Ventilation" initial={selected.ventilation} options={["Moderate cross-ventilation","High cross-ventilation","Gentle cross-ventilation"]}/><label><span>Substrate</span><textarea name="substrate" defaultValue={selected.substrate} rows={3} /></label><label><span>Feeding</span><textarea name="feeding" defaultValue={selected.feeding} rows={3} /></label></div></fieldset>
          <fieldset><legend>Editorial notes</legend><label><span>About</span><textarea name="about" defaultValue={selected.about} rows={7} /></label><label><span>Keeper notes</span><textarea name="keeperNotes" defaultValue={selected.keeperNotes} rows={7} /></label><label><span>Field Guide links · one path per line</span><textarea name="fieldGuideLinks" defaultValue={selected.fieldGuideLinks.join("\n")} rows={4} /></label></fieldset>
          <div className="admin-form-footer"><p>Drafts are visible only inside the current private platform preview. Publishing requires an assigned identity.</p><button className="button button-primary" type="submit">Save record</button></div>
        </form>
        <form className="admin-archive-form" action={toggleSpeciesArchive}><input type="hidden" name="id" value={selected.id} /><div><strong>{selected.archivedAt ? "Restore this record" : "Archive this record"}</strong><p>{selected.archivedAt ? "Restoring returns it to the active Ledger desk and private preview." : "Archiving hides it from the Ledger and search without deleting its data or photograph."}</p></div><button className="button button-outline" type="submit">{selected.archivedAt ? "Restore record" : "Archive record"}</button></form>
      </section> : <section className="admin-record-editor"><p>No species records exist yet.</p></section>}
    </div>
  </main>;
}

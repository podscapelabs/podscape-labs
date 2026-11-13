import Link from "next/link";
import {OwnerDeskHeader,OwnerDeskNotice} from "@/components/OwnerDeskFoundation";
import Image from "next/image";
import {notFound,redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSpeciesRecords} from "@/lib/species-store";
import {cardCategories,getPodBoundArtworkUrl,getPodBoundCard} from "@/lib/podbound-cards";
import {archivePodBoundCard} from "../actions";
import {CardEditorForm} from "../CardEditorForm";
import styles from "../desk.module.css";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
export const dynamic="force-dynamic";

export default async function CardEditor({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;created?:string;error?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const [{id},query,species]=await Promise.all([params,searchParams,getSpeciesRecords()]);
 const card=await getPodBoundCard(id);
 if(!card)notFound();
 const [core,alternate]=await Promise.all([getPodBoundArtworkUrl(card.core_art_path),getPodBoundArtworkUrl(card.alternate_art_path)]);
 return <main className={styles.shell}>
  <OwnerDeskHeader area="PodBound / Editor" title={card.title} description={"Last edited "+new Date(card.updated_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"})} icon="podbound" backHref="/admin/podbound" backLabel="Card Desk" actions={[{href:"/podbound/cards",label:"View Card Catalogue",icon:"podbound",external:true}]} aside={<button form="card-editor" className={styles.primary} type="submit">Save card</button>}/>
  {query.saved&&<OwnerDeskNotice kind="success">Card saved successfully.</OwnerDeskNotice>}
  {query.created&&<OwnerDeskNotice kind="success">Draft created. Make it your own!</OwnerDeskNotice>}
  {query.error&&<OwnerDeskNotice kind="error">{query.error}</OwnerDeskNotice>}
  <CardEditorForm cardId={card.id} className={styles.editor}>
   <input type="hidden" name="id" value={card.id}/>
   <section className={styles.editPanel}><p className={styles.eyebrow}>01 / IDENTITY</p><h2>Card identity</h2><div className={styles.fieldGrid}>
    <label className={styles.wide}>Card name<input name="title" maxLength={180} defaultValue={card.title} required/></label>
    <label>Card number<input name="card_number" maxLength={40} placeholder="e.g. PB-001" defaultValue={card.card_number}/></label>
    <label>Set / edition<input name="set_name" maxLength={100} defaultValue={card.set_name}/></label>
    <label>Category<select name="category" defaultValue={card.category}>{cardCategories.map(c=><option value={c} key={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select></label>
    <label>Rules version<input name="rules_version" maxLength={80} placeholder="Internal version, if approved" defaultValue={card.rules_version}/></label>
    <label className={styles.wide}>Linked Leaf Ledger species<select name="species_record_id" defaultValue={card.species_record_id||""}><option value="">No species linked</option>{species.filter(s=>s.kind==="species"&&!s.archivedAt).map(s=><option key={s.id} value={s.id}>{s.commonName||s.scientificName} · {s.scientificName}</option>)}</select></label>
    <label className={styles.wide}>Short introduction<textarea name="summary" rows={3} maxLength={1500} defaultValue={card.summary} placeholder="A friendly description for the gallery."/></label>
   </div></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>02 / ARTWORK</p><h2>Card artwork</h2><p className={styles.helper}>Upload finished artwork only. Separate core and alternate artwork can share one game card without duplicating its mechanics.</p><div className={styles.artGrid}>
    <div className={styles.artBox}><div className={styles.artPreview}>{core?<Image src={core} alt={card.core_art_alt||"Core artwork"} fill unoptimized sizes="(max-width:700px) 85vw,350px" style={{objectFit:"contain"}}/>:<span><PodscapeLineIcon name="podbound" /><small>Core artwork awaits</small></span>}</div><label>Core artwork<input type="file" data-card-art="core" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label className={styles.check}><input type="checkbox" name="remove_core" value="yes"/> Remove current core art</label><label>Artwork alt text<input name="core_art_alt" defaultValue={card.core_art_alt}/></label></div>
    <div className={styles.artBox}><div className={styles.artPreview}>{alternate?<Image src={alternate} alt={card.alternate_art_alt||"Alternate artwork"} fill unoptimized sizes="(max-width:700px) 85vw,350px" style={{objectFit:"contain"}}/>:<span><PodscapeLineIcon name="podbound" /><small>Alternate artwork awaits</small></span>}</div><label>Alternate artwork<input type="file" data-card-art="alternate" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label className={styles.check}><input type="checkbox" name="remove_alternate" value="yes"/> Remove current alternate art</label><label>Artwork alt text<input name="alternate_art_alt" defaultValue={card.alternate_art_alt}/></label></div>
   </div><label>Artist credit<input name="artist_name" maxLength={120} defaultValue={card.artist_name}/></label><p className={styles.helper}>JPG, PNG, WebP or AVIF. Maximum 10 MB per image. Artwork uploads directly to private storage when you save.</p></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>03 / GAME DESIGN</p><h2>Mechanics and biology</h2><p className={styles.helper}>Keep working 2.0 abilities private while artwork and biological context take shape.</p><div className={styles.fieldGrid}>
    <label className={styles.wide}>Approved card text<textarea name="ability_text" rows={5} maxLength={6000} defaultValue={card.ability_text} placeholder="Only publish confirmed card effects."/></label>
    <label className={styles.wide}>Internal gameplay notes<textarea name="gameplay_notes" rows={4} maxLength={6000} defaultValue={card.gameplay_notes} placeholder="Testing observations, balance ideas, revisions…"/></label>
    <label className={styles.wide}>Biological inspiration<textarea name="biology_notes" rows={4} maxLength={6000} defaultValue={card.biology_notes} placeholder="The real biology behind this card's design."/></label>
   </div></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>04 / VISIBILITY</p><h2>Publication controls</h2><div className={styles.fieldGrid}><label>Status<select name="status" defaultValue={card.status}><option value="draft">Draft · private</option><option value="published">Published · gallery-ready</option><option value="archived">Archived · hidden</option></select></label><label className={styles.check}><input type="checkbox" name="featured" value="yes" defaultChecked={card.featured}/> Feature this card in the future gallery</label></div><p className={styles.helper}>Published cards appear in the public Card Catalogue. Drafts and archived cards stay private.</p></section>
   <div className={styles.saveRow}><button className={styles.primary}>Save changes</button><Link href="/admin/podbound">Return to card archive</Link></div>
  </CardEditorForm>
  <form action={archivePodBoundCard} className={styles.archive}><input type="hidden" name="id" value={card.id}/><p>{card.status==="archived"?"Bring this card back as a private draft.":"Remove this card from the active desk without deleting its artwork or history."}</p><button type="submit">{card.status==="archived"?"Restore as draft":"Archive card"}</button></form>
 </main>;
}

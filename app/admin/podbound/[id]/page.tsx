import Link from "next/link";
import Image from "next/image";
import {notFound,redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSpeciesRecords} from "@/lib/species-store";
import {cardCategories,getPodBoundArtworkUrl,getPodBoundCard} from "@/lib/podbound-cards";
import {archivePodBoundCard,savePodBoundCard} from "../actions";
import styles from "../desk.module.css";
export const dynamic="force-dynamic";

export default async function CardEditor({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;created?:string;error?:string}>}){
 if(!await isAdminAuthenticated())redirect("/admin");
 const [{id},query,species]=await Promise.all([params,searchParams,getSpeciesRecords()]);
 const card=await getPodBoundCard(id);
 if(!card)notFound();
 const [core,alternate]=await Promise.all([getPodBoundArtworkUrl(card.core_art_path),getPodBoundArtworkUrl(card.alternate_art_path)]);
 return <main className={styles.shell}>
  <header className={styles.top}><Link href="/admin/podbound" className={styles.back} aria-label="Back to Card Desk">←</Link><div><p className={styles.eyebrow}>PODBOUND / CARD EDITOR</p><h1>{card.title}</h1><p>Last edited {new Date(card.updated_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"})}</p></div><button form="card-editor" className={styles.primary}>Save card</button></header>
  {query.saved&&<p className={styles.success} role="status">Card saved successfully.</p>}
  {query.created&&<p className={styles.success} role="status">Draft created. Make it your own!</p>}
  {query.error&&<p className={styles.failure} role="alert">{query.error}</p>}
  <form id="card-editor" action={savePodBoundCard} className={styles.editor}>
   <input type="hidden" name="id" value={card.id}/>
   <section className={styles.editPanel}><p className={styles.eyebrow}>01 / IDENTITY</p><h2>Meet the card</h2><div className={styles.fieldGrid}>
    <label className={styles.wide}>Card name<input name="title" maxLength={180} defaultValue={card.title} required/></label>
    <label>Card number<input name="card_number" maxLength={40} placeholder="e.g. PB-001" defaultValue={card.card_number}/></label>
    <label>Set / edition<input name="set_name" maxLength={100} defaultValue={card.set_name}/></label>
    <label>Category<select name="category" defaultValue={card.category}>{cardCategories.map(c=><option value={c} key={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select></label>
    <label>Rules version<input name="rules_version" maxLength={80} placeholder="Internal version, if approved" defaultValue={card.rules_version}/></label>
    <label className={styles.wide}>Linked Leaf Ledger species<select name="species_record_id" defaultValue={card.species_record_id||""}><option value="">No species linked</option>{species.filter(s=>s.kind==="species"&&!s.archivedAt).map(s=><option key={s.id} value={s.id}>{s.commonName||s.scientificName} · {s.scientificName}</option>)}</select></label>
    <label className={styles.wide}>Short introduction<textarea name="summary" rows={3} maxLength={1500} defaultValue={card.summary} placeholder="A friendly description for the gallery."/></label>
   </div></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>02 / ARTWORK</p><h2>Ola&apos;s art archive</h2><p className={styles.helper}>Upload finished artwork only. Separate core and alternate artwork can share one game card without duplicating its mechanics.</p><div className={styles.artGrid}>
    <div className={styles.artBox}><div className={styles.artPreview}>{core?<Image src={core} alt={card.core_art_alt||"Core artwork"} fill unoptimized sizes="(max-width:700px) 85vw,350px" style={{objectFit:"contain"}}/>:<span>✧<small>Core artwork awaits</small></span>}</div><label>Core artwork<input type="file" name="core_art" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label className={styles.check}><input type="checkbox" name="remove_core" value="yes"/> Remove current core art</label><label>Artwork alt text<input name="core_art_alt" defaultValue={card.core_art_alt}/></label></div>
    <div className={styles.artBox}><div className={styles.artPreview}>{alternate?<Image src={alternate} alt={card.alternate_art_alt||"Alternate artwork"} fill unoptimized sizes="(max-width:700px) 85vw,350px" style={{objectFit:"contain"}}/>:<span>✧<small>Alternate artwork awaits</small></span>}</div><label>Alternate artwork<input type="file" name="alternate_art" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label className={styles.check}><input type="checkbox" name="remove_alternate" value="yes"/> Remove current alternate art</label><label>Artwork alt text<input name="alternate_art_alt" defaultValue={card.alternate_art_alt}/></label></div>
   </div><label>Artist credit<input name="artist_name" maxLength={120} defaultValue={card.artist_name}/></label><p className={styles.helper}>JPG, PNG, WebP or AVIF. Maximum 10 MB per image. Private storage until the gallery is ready.</p></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>03 / GAME DESIGN</p><h2>Mechanics & biology</h2><p className={styles.helper}>Keep working 2.0 abilities private while artwork and biological context take shape.</p><div className={styles.fieldGrid}>
    <label className={styles.wide}>Approved card text<textarea name="ability_text" rows={5} maxLength={6000} defaultValue={card.ability_text} placeholder="Only publish confirmed card effects."/></label>
    <label className={styles.wide}>Internal gameplay notes<textarea name="gameplay_notes" rows={4} maxLength={6000} defaultValue={card.gameplay_notes} placeholder="Testing observations, balance ideas, revisions…"/></label>
    <label className={styles.wide}>Biological inspiration<textarea name="biology_notes" rows={4} maxLength={6000} defaultValue={card.biology_notes} placeholder="The real biology behind this card's design."/></label>
   </div></section>
   <section className={styles.editPanel}><p className={styles.eyebrow}>04 / VISIBILITY</p><h2>Publication controls</h2><div className={styles.fieldGrid}><label>Status<select name="status" defaultValue={card.status}><option value="draft">Draft · private</option><option value="published">Published · gallery-ready</option><option value="archived">Archived · hidden</option></select></label><label className={styles.check}><input type="checkbox" name="featured" value="yes" defaultChecked={card.featured}/> Feature this card in the future gallery</label></div><p className={styles.helper}>Published status does not expose this card yet. We&apos;ll enable public visibility when the gallery is built.</p></section>
   <div className={styles.saveRow}><button className={styles.primary}>Save changes</button><Link href="/admin/podbound">Return to card archive</Link></div>
  </form>
  <form action={archivePodBoundCard} className={styles.archive}><input type="hidden" name="id" value={card.id}/><p>{card.status==="archived"?"Bring this card back as a private draft.":"Remove this card from the active desk without deleting its artwork or history."}</p><button type="submit">{card.status==="archived"?"Restore as draft":"Archive card"}</button></form>
 </main>;
}

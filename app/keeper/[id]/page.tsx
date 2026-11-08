import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { KeeperControls } from "@/components/KeeperWorkspace";
import { KeeperBinTools } from "@/components/KeeperBinTools";
import { KeeperScanner } from "@/components/KeeperScanner";
import { PinToHome } from "@/components/PinToHome";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getEnclosure, listEnclosures, listQuickCareDates } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import styles from "../page.module.css";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Colony Workspace | PodScape Labs",robots:{index:false,follow:false}};

export default async function EnclosurePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);if(!data)notFound();
 const {enclosure,events}=data;
 const [species,enclosures]=await Promise.all([getSpeciesRecords(),listEnclosures()]);
 const record=species.find(x=>x.id===enclosure.speciesId);
 const bins=enclosures.filter(e=>!e.isArchived).map(e=>{
  const speciesRecord=species.find(s=>s.id===e.speciesId);
  return {id:e.id,name:e.name,label:e.label,quantity:e.quantity,speciesId:e.speciesId,species:speciesRecord?.commonName||"Unlinked species",image:speciesRecord?.image||null};
 });
 let careDates:Record<string,Record<string,string>>={};
 try{careDates=await listQuickCareDates(bins.map(b=>b.id));}catch{/* Care logging remains available if activity history is unavailable. */}
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 return <PlatformShell><main className={styles.page}><div className={`v2-container ${styles.colonyWorkspacePage}`}>
  <Breadcrumbs items={[{label:"Manager",href:"/keeper"},{label:enclosure.name}]}/>
  <header className={styles.colonyCompactHero}>
   {record?.image?<div className={styles.colonyCompactArt}><Image src={record.image} alt={record.imageAlt||""} fill sizes="100px"/></div>:null}
   <div className={styles.colonyCompactHeading}><p className={styles.kicker}>KEEPER / ENCLOSURE</p><h1>{enclosure.name}</h1><p>{record?speciesDisplayName(record):"Unlinked species"}{enclosure.label?" · "+enclosure.label:""}</p><span>{enclosure.status.replaceAll("-"," ")} · {enclosure.breeding.replaceAll("-"," ")} breeding</span></div>
  </header>
  {record?<p className={styles.colonyReference}><em>{speciesScientificName(record)}</em> · <Link href={`/ledger/${record.slug}`}>Species reference ↗</Link></p>:null}
  <section aria-label="Quick Care and enclosure selection" className={styles.colonyQuickCare}>
   {enclosure.isArchived?<div className={styles.colonyArchivedNotice}>This enclosure is archived. Restore it under Colony profile to log new care.</div>:<KeeperScanner bins={bins} initialBinId={id} careDates={careDates}/>}
  </section>
  <div className={styles.colonyMoreHeading}><h2>Colony details</h2><p>Open only what you need. Quick Care stays above.</p></div>
  <div className={styles.colonyDetailSections}>
   <details className={styles.colonyDisclosure}><summary><span>Colony profile & population<small>Edit population, breeding, condition and notes</small></span><b aria-hidden="true">⌄</b></summary><div className={styles.colonyDisclosureBody}><KeeperControls entry={enclosure}/></div></details>
   <details className={styles.colonyDisclosure}><summary><span>QR label & misting schedule<small>Print your label and manage device reminders</small></span><b aria-hidden="true">⌄</b></summary><div className={styles.colonyDisclosureBody}><KeeperBinTools binId={enclosure.id} binName={enclosure.name} species={record?speciesDisplayName(record):"Your colony"}/></div></details>
   <details className={styles.colonyDisclosure}><summary><span>Recent activity<small>{events.length?events.length+" recent records":"No activity recorded yet"}</small></span><b aria-hidden="true">⌄</b></summary><div className={styles.colonyDisclosureBody}>
    {events.length?<div className={styles.colonyActivityList}>{events.map(event=><div className={styles.colonyActivityEntry} key={event.id}><span><strong>{event.note||event.kind.replaceAll("-"," ")}</strong><small>{event.kind.replaceAll("-"," ")}</small></span><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time></div>)}</div>:<p className={styles.colonyEmptyActivity}>No care entries yet. Your first saved action will appear here.</p>}
    <Link className={styles.colonyHistoryLink} href={`/keeper/${id}/history`}>View complete history →</Link>
   </div></details>
  </div>
  <div className={styles.colonyBottomLinks}><Link href="/keeper">← Manager</Link><Link href="/keeper/schedule">Care schedule</Link><PinToHome pin={{kind:"colony",id:enclosure.id}} userId={user?.id||null}/></div>
 </div></main><KeeperMobileNav active="keeper"/></PlatformShell>;
}

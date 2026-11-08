import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {PlatformShell,Breadcrumbs} from "@/components/PlatformShell";
import {KeeperControls} from "@/components/KeeperWorkspace";
import {KeeperBinTools} from "@/components/KeeperBinTools";
import {KeeperMobileNav} from "@/components/KeeperMobileNav";
import {getEnclosure,listQuickCareDates} from "@/lib/keeper";
import {getSpeciesRecords} from "@/lib/species-store";
import {speciesDisplayName} from "@/data/species";
import styles from "./page.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Colony Settings | PodScape Keeper",robots:{index:false,follow:false}};
export default async function ColonyDetails({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);if(!data)notFound();
 const {enclosure}=data;
 let mistingDate="";
 try{const dates=await listQuickCareDates([id]);mistingDate=dates[id]?.Misted||"";}catch{/* Settings remain usable if care history is unavailable. */}
 const record=(await getSpeciesRecords()).find(x=>x.id===enclosure.speciesId);
 const species=record?speciesDisplayName(record):"Unlinked species";
 return <PlatformShell><main className={styles.page}><div className="v2-container">
  <Breadcrumbs items={[{label:"Manager",href:"/keeper"},{label:enclosure.name,href:"/keeper/"+id},{label:"Settings"}]}/>
  <div className={styles.header}><div><p className={styles.kicker}>PODSCAPE / COLONY SETTINGS</p><h1>{enclosure.name}</h1><p>{species}{enclosure.label?" · "+enclosure.label:""}</p></div><Link className={styles.back} href={"/keeper/scan?bin="+id}>← Back to bin workspace</Link></div>
  <p className={styles.intro}>The bin workspace is for daily care. Use these settings when you need to edit colony information, print a QR label, or adjust a reminder.</p>
  <details className={styles.section}><summary><strong>Colony profile & population</strong><span>Edit counts, status and setup</span></summary><div className={styles.sectionBody}><KeeperControls entry={enclosure} showLogForm={false}/></div></details>
  <details className={styles.section}><summary><strong>QR label & misting schedule</strong><span>Print labels and manage reminders on this device</span></summary><div className={styles.sectionBody}><KeeperBinTools binId={id} binName={enclosure.name} species={species} lastRecordedMisting={mistingDate}/></div></details>
  <div className={styles.links}><Link href={"/keeper/"+id+"/history"}>Complete care history →</Link><Link href="/keeper/schedule">All care schedules →</Link></div>
 </div></main><KeeperMobileNav active="keeper"/></PlatformShell>;
}

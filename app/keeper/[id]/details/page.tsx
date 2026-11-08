import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {PlatformShell,Breadcrumbs} from "@/components/PlatformShell";
import {WorkspaceHeader,WorkspaceLinks} from "@/components/PodscapeWorkspaceUI";
import {KeeperControls} from "@/components/KeeperWorkspace";
import {KeeperBinTools} from "@/components/KeeperBinTools";
import {KeeperMobileNav} from "@/components/KeeperMobileNav";
import {PinToHome} from "@/components/PinToHome";
import {customerSupabase} from "@/lib/customer-auth/server";
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
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const record=(await getSpeciesRecords()).find(x=>x.id===enclosure.speciesId);
 const species=record?speciesDisplayName(record):"Unlinked species";
 return <PlatformShell><main className={styles.page}><div className="v2-container">
  <Breadcrumbs items={[{label:"Manager",href:"/keeper"},{label:enclosure.name,href:enclosure.isArchived?"/keeper":"/keeper/"+id},{label:"Settings"}]}/>
  <WorkspaceHeader section="MANAGER / COLONY SETTINGS" title={species} description={enclosure.name+(enclosure.label?" · "+enclosure.label:"")} backHref={enclosure.isArchived?"/keeper":"/keeper/scan?bin="+id} backLabel={enclosure.isArchived?"Manager":"Back to care"}/>
  <div className={styles.extras}><PinToHome pin={{kind:"colony",id}} userId={user?.id||null}/>{record?<Link href={"/ledger/"+record.slug}>Species reference ↗</Link>:null}</div>
  
  <details className={styles.section}><summary><span className={styles.sectionIcon} aria-hidden="true">✧</span><span className={styles.sectionLabel}><strong>Colony profile</strong><small>Population, condition & setup</small></span><span className={styles.chevron} aria-hidden="true">⌄</span></summary><div className={styles.sectionBody}><KeeperControls entry={enclosure} showLogForm={false}/></div></details>
  <details className={styles.section}><summary><span className={styles.sectionIcon} aria-hidden="true">▣</span><span className={styles.sectionLabel}><strong>QR & care reminders</strong><small>Labels and misting schedule</small></span><span className={styles.chevron} aria-hidden="true">⌄</span></summary><div className={styles.sectionBody}><KeeperBinTools binId={id} binName={enclosure.name} species={species} lastRecordedMisting={mistingDate}/></div></details>
  <WorkspaceLinks items={[{href:"/keeper/"+id+"/history",label:"Care history"},{href:"/keeper/schedule",label:"Schedules"}]}/>
 </div></main><KeeperMobileNav active="keeper"/></PlatformShell>;
}

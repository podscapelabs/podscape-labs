import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { CreateEnclosure } from "@/components/KeeperWorkspace";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName } from "@/data/species";
import styles from "./page.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My Enclosures | PodScape Labs",robots:{index:false,follow:false}};
export default async function KeeperIndex({searchParams}:{searchParams:Promise<{species?:string}>}){
 const member=await getMemberCollectionState();
 const species=member.signedIn?await getSpeciesRecords():[];
 let enclosures:Awaited<ReturnType<typeof listEnclosures>>=[];let unavailable=false;
 if(member.signedIn)try{enclosures=await listEnclosures();}catch{unavailable=true;}
 const selected=(await searchParams).species;
 const record=species.find(s=>s.id===selected&&s.kind==="species");
 const active=enclosures.filter(e=>!e.isArchived);const archived=enclosures.filter(e=>e.isArchived);
 return <PlatformShell><main className={styles.page}><div className="v2-container"><Breadcrumbs items={[{label:"My Collection",href:"/ledger/my-collection"},{label:"My Enclosures"}]}/><p className={styles.kicker}>MY COLLECTION / KEEPER</p><h1>My enclosures</h1><p className={styles.lead}>Your own colony workspace. Each enclosure has a dedicated record and activity log.</p><p><Link href="/keeper/scan" style={{display:"inline-block",background:"#284d35",color:"#fff",padding:"13px 20px",borderRadius:12,fontWeight:700}}>▣ Scan bin · Quick Care →</Link> <Link href="/keeper/schedule" style={{display:"inline-block",padding:"13px 20px",fontWeight:700}}>Care schedule →</Link></p>
 {!member.signedIn?<p>Please <Link href="/account/login">sign in</Link> to manage your enclosures.</p>:unavailable?<p role="alert">Keeper storage is not configured yet. The customer database migration must be applied before enclosure records can be saved.</p>:<>
 {active.length?<div className={styles.list}>{active.map(e=><Link className={styles.entry} href={`/keeper/${e.id}`} key={e.id}><span><strong>{e.name}</strong><small>{(species.find(x=>x.id===e.speciesId)?.commonName || "Species")} · {e.label||"No bin label"}</small></span><span>{e.quantity} recorded ↗</span></Link>)}</div>:<p className={styles.empty}>No active enclosures yet. Start by selecting a species from your collection.</p>}
 {archived.length?<details><summary>Archived enclosures ({archived.length})</summary><div className={styles.list}>{archived.map(e=><Link className={styles.entry} href={`/keeper/${e.id}`} key={e.id}><span><strong>{e.name}</strong><small>{species.find(x=>x.id===e.speciesId)?.commonName||"Species"}</small></span><span>Archived ↗</span></Link>)}</div></details>:null}
 {record?<CreateEnclosure speciesId={record.id} speciesName={speciesDisplayName(record)}/>:<p><Link href="/ledger/my-collection">Select a species from My Collection →</Link></p>}
 </>}</div></main></PlatformShell>;
}

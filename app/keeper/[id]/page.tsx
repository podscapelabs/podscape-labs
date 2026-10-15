import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { KeeperControls } from "@/components/KeeperWorkspace";
import { KeeperBinTools } from "@/components/KeeperBinTools";
import { getEnclosure } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import styles from "../page.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Keeper Dashboard | PodScape Labs",robots:{index:false,follow:false}};
export default async function EnclosurePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);if(!data)notFound();
 const {enclosure,events}=data;
 const record=(await getSpeciesRecords()).find(x=>x.id===enclosure.speciesId);
 return <PlatformShell><main className={styles.page}><div className="v2-container"><Breadcrumbs items={[{label:"My Enclosures",href:"/keeper"},{label:enclosure.name}]}/><p className={styles.kicker}>KEEPER / PRIVATE ENCLOSURE</p><h1>{enclosure.name}</h1><p className={styles.lead}>{record?speciesDisplayName(record):"Unlinked species"} · {enclosure.label||"No bin label"} {record?<><br/><em>{speciesScientificName(record)}</em> · <Link href={`/ledger/${record.slug}`}>View species reference ↗</Link></>:null}</p>
 <p><Link href={"/keeper/scan?bin="+enclosure.id}>▣ Open this bin in Quick Care →</Link></p>
 <KeeperBinTools binId={enclosure.id} binName={enclosure.name} species={record?speciesDisplayName(record):"Your colony"}/>
 <p><Link href={"/keeper/"+enclosure.id+"/history"}>View complete care history →</Link></p>
 <KeeperControls entry={enclosure}/>
 <section style={{marginTop:30}}><h2>Activity history</h2>{events.length?<div className={styles.list}>{events.map(event=><div className={styles.entry} key={event.id}><span><strong>{event.kind.replaceAll("-"," ")}</strong><small>{event.note}</small></span><span>{new Date(event.createdAt).toLocaleDateString()}</span></div>)}</div>:<p className={styles.empty}>No activity recorded yet. Your first entry will appear here.</p>}</section>
 <p className={styles.lead}>This enclosure has a stable private route for its printed QR label. The link identifies the bin; signing in and ownership checks still control access.</p>
 </div></main></PlatformShell>;
}

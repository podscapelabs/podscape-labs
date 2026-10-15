import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { getEnclosure } from "@/lib/keeper";
import styles from "../../page.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Care History | PodScape Keeper",robots:{index:false,follow:false}};
export default async function CareHistory({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f\d-]{36}$/i.test(id))notFound();
 const data=await getEnclosure(id);if(!data)notFound();
 const {enclosure,events}=data;
 return <PlatformShell><main className={styles.page}><div className="v2-container">
 <Breadcrumbs items={[{label:"My Collection",href:"/ledger/my-collection"},{label:enclosure.name,href:"/keeper/"+id},{label:"Care history"}]}/>
 <p className={styles.kicker}>PODSCAPE LABS / KEEPER ARCHIVE</p>
 <h1>Care history</h1><p className={styles.lead}>{enclosure.name} · Your dated feeding, maintenance, observation and inventory records.</p>
 <p><Link href={"/keeper/scan?bin="+id}>▣ Log care with Quick Scan →</Link></p>
 <section aria-label="Recorded care events" className={styles.list}>{events.length?events.map(e=><article className={styles.entry} key={e.id}><span><strong style={{textTransform:"capitalize"}}>{e.kind.replaceAll("-"," ")}</strong><small>{e.note||"No additional notes"}{e.quantityChange!==null?" · Quantity change: "+e.quantityChange:""}</small></span><time dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"})}</time></article>):<p className={styles.empty}>No activity recorded yet. Your first care action will appear here.</p>}</section>
 <p className={styles.lead}>Showing the latest {events.length} records.</p>
 </div></main></PlatformShell>;
}

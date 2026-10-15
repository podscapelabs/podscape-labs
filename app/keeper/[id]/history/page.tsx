import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell, Breadcrumbs } from "@/components/PlatformShell";
import { getEnclosure, getEnclosureEvents } from "@/lib/keeper";
import styles from "../../page.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Care History | PodScape Keeper",robots:{index:false,follow:false}};
export default async function CareHistory({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){
 const {id}=await params;if(!/^[a-f\d-]{36}$/i.test(id))notFound();
 const requested=Number((await searchParams).page||"1");const page=Number.isInteger(requested)&&requested>0?requested:1;
 const [data,eventPage]=await Promise.all([getEnclosure(id),getEnclosureEvents(id,page)]);if(!data||!eventPage)notFound();
 const {enclosure}=data;const {events,total,hasNext}=eventPage;
 return <PlatformShell><main className={styles.page}><div className="v2-container">
 <Breadcrumbs items={[{label:"My Collection",href:"/ledger/my-collection"},{label:enclosure.name,href:"/keeper/"+id},{label:"Care history"}]}/>
 <p className={styles.kicker}>PODSCAPE LABS / KEEPER ARCHIVE</p>
 <h1>Care history</h1><p className={styles.lead}>{enclosure.name} · Your dated feeding, maintenance, observation and inventory records.</p>
 <p><Link href={"/keeper/scan?bin="+id}>▣ Log care with Quick Scan →</Link></p>
 <section aria-label="Recorded care events" className={styles.list}>{events.length?events.map(e=><article className={styles.entry} key={e.id}><span><strong style={{textTransform:"capitalize"}}>{e.kind.replaceAll("-"," ")}</strong><small>{e.note||"No additional notes"}{e.quantityChange!==null?" · Quantity change: "+e.quantityChange:""}</small></span><time dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"})}</time></article>):<p className={styles.empty}>No activity recorded yet. Your first care action will appear here.</p>}</section>
 <nav aria-label="Care history pages" style={{display:"flex",justifyContent:"space-between",gap:16,marginTop:18}}>
  {page>1?<Link href={`/keeper/${id}/history?page=${page-1}`}>← Newer entries</Link>:<span/>}
  {hasNext?<Link href={`/keeper/${id}/history?page=${page+1}`}>Older entries →</Link>:null}
 </nav>
 <p className={styles.lead}>Showing {events.length} of {total} care records · Page {page}.</p>
 </div></main></PlatformShell>;
}

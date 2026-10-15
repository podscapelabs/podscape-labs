"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./KeeperCollectionHub.module.css";
export type BinSummary={id:string;speciesId:string;speciesName:string;scientificName:string;speciesSlug:string;name:string;label:string;quantity:number;status:string;isPrimary:boolean};
export function KeeperCollectionHub({bins}:{bins:BinSummary[]}){
 const [search,setSearch]=useState("");const [open,setOpen]=useState<string|null>(null);
 const groups=useMemo(()=>{const map=new Map<string,{speciesId:string;name:string;scientific:string;slug:string;bins:BinSummary[]}>();for(const b of bins){if(!map.has(b.speciesId))map.set(b.speciesId,{speciesId:b.speciesId,name:b.speciesName,scientific:b.scientificName,slug:b.speciesSlug,bins:[]});map.get(b.speciesId)?.bins.push(b);}return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));},[bins]);
 const visible=groups.filter(g=>[g.name,g.scientific,...g.bins.flatMap(b=>[b.name,b.label])].some(x=>x.toLowerCase().includes(search.toLowerCase())));
 const total=bins.reduce((sum,b)=>sum+b.quantity,0);
 return <section className={styles.hub} aria-label="Colony management">
 <div className={styles.top}><div><p className={styles.eyebrow}>YOUR KEEPER COLLECTION</p><h2>My bins</h2><p>One collection. Every colony. Care in a tap.</p></div><Link className={styles.scan} href="/keeper/scan">▣ Scan a bin</Link></div>
 <div className={styles.summary}><span><strong>{groups.length}</strong> species with bins</span><span><strong>{bins.length}</strong> bins</span><span><strong>{total.toLocaleString()}</strong> estimated animals</span></div>
 <label className={styles.search}><span className="sr-only">Search species or bins</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search species, colony or bin…"/></label>
 <div className={styles.groups}>{visible.length?visible.map(g=><article className={styles.species} key={g.speciesId}><button type="button" className={styles.groupButton} onClick={()=>setOpen(open===g.speciesId?null:g.speciesId)} aria-expanded={open===g.speciesId}><span className={styles.leaf}>◈</span><span className={styles.groupTitle}><strong>{g.name}</strong><em>{g.scientific}</em><small>{g.bins.length} {g.bins.length===1?"bin":"bins"}</small></span><span aria-hidden="true">{open===g.speciesId?"⌃":"⌄"}</span></button>{open===g.speciesId?<div className={styles.details}>{g.bins.map(b=><Link href={"/keeper/"+b.id} className={styles.bin} key={b.id}><span><strong>{b.name}</strong><small>{b.label||"No location specified"} · ~{b.quantity} animals</small></span><span className={styles.condition}>{b.status.replaceAll("-"," ")}</span><span aria-hidden="true">↗</span></Link>)}<Link className={styles.reference} href={"/ledger/"+g.slug}>View species in Leaf Ledger ↗</Link></div>:null}</article>):<p className={styles.empty}>{bins.length?"No matching colonies.":"No bins yet. Add one from a species profile in My Collection."}</p>}</div>
 <div className={styles.foot}><Link href="/keeper">Manage all enclosures →</Link><span>Only your own records appear here.</span></div>
 </section>;
}

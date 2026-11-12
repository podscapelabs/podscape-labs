"use client";

import {useState} from "react";
import styles from "./BinSwitcher.module.css";
import {binDisplayName} from "@/lib/bin-identity";

export type SwitchableBin={id:string;name:string;speciesId:string;label?:string;species?:string};
/** Shared navigation keeps Quick Care in-session and ordinary bin pages on their route. */
export function BinSwitcher({bins,currentId,onSelect,disabled=false}:{bins:SwitchableBin[];currentId:string;onSelect:(id:string)=>void;disabled?:boolean}){
 const [scope,setScope]=useState<"all"|"species">("all");
 const current=bins.find(bin=>bin.id===currentId);
 if(!current||bins.length<2)return null;
 const visible=scope==="species"?bins.filter(bin=>bin.speciesId===current.speciesId):bins;
 const index=visible.findIndex(bin=>bin.id===currentId);
 return <nav className={styles.switcher} aria-label="Switch bin">
  <div className={styles.top}><strong>Switch bin</strong><label>Browse<select aria-label="Bin navigation scope" value={scope} disabled={disabled} onChange={event=>setScope(event.target.value as "all"|"species")}><option value="all">All active bins</option><option value="species">This species</option></select></label></div>
  <div className={styles.controls}>
   <button type="button" disabled={disabled||index<=0} onClick={()=>onSelect(visible[index-1].id)} aria-label="Previous bin">←</button>
   <label><span>Bin {index+1} of {visible.length}</span><select aria-label="Choose a bin" value={currentId} disabled={disabled} onChange={event=>onSelect(event.target.value)}>{visible.map(bin=><option key={bin.id} value={bin.id}>{binDisplayName(bin,bin.species)}</option>)}</select></label>
   <button type="button" disabled={disabled||index>=visible.length-1} onClick={()=>onSelect(visible[index+1].id)} aria-label="Next bin">→</button>
  </div>
 </nav>;
}

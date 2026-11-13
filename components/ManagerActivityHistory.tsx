"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {ManagerEvent} from "./ManagerCareWidgets";
import styles from "@/app/keeper/page.module.css";

export function ManagerActivityHistory({events,unavailable,embedded=false}:{events:ManagerEvent[];unavailable:boolean;embedded?:boolean}){
 const [search,setSearch]=useState("");
 const [kind,setKind]=useState("all");
 const types=useMemo(()=>[...new Set(events.map(event=>event.kind))].sort(),[events]);
 const filtered=useMemo(()=>events.filter(event=>(kind==="all"||event.kind===kind)
  &&[event.kind,event.note,event.enclosureName].some(value=>value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))),[events,search,kind]);
 return <section className={`${styles.managerHistory} ${embedded?styles.managerHistoryEmbedded:""}`}>
  {!embedded?<><p className={styles.managerEyebrow}>MANAGER / PRIVATE RECORDS</p>
  <h1>Care activity</h1></>:null}
  <p>{embedded?"Search recent care and observations without leaving Manager.":"Recent care and observations across your enclosures. Open an entry to view that bin’s full history."}</p>
  {!unavailable?<div className={styles.managerHistoryFilters}>
    <label>Search logs<input type="search" placeholder="Bin, activity or note…" value={search} onChange={event=>setSearch(event.target.value)}/></label>
    <label>Activity type<select value={kind} onChange={event=>setKind(event.target.value)}><option value="all">All activities</option>{types.map(type=><option value={type} key={type}>{type.replaceAll("-"," ")}</option>)}</select></label>
  </div>:null}
  {unavailable?<p role="alert">Care activity is not available right now. Existing records have not been changed.</p>
   :filtered.length?<div className={styles.managerHistoryList}>{filtered.map(event=><Link href={"/keeper/"+event.enclosureId+"/history"} key={event.id}>
    <span><strong>{event.kind.replaceAll("-"," ")}</strong><small>{event.enclosureName}{event.note?" · "+event.note:""}</small></span>
    <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time>
   </Link>)}</div>
   :<p className={styles.managerModuleEmpty}>{events.length?"No entries match your filters.":"No care activity has been recorded yet. Scan a bin or open an enclosure to add an entry."}</p>}
  <p className={styles.managerModuleFine}>Showing up to 30 most recent records. Complete, paginated history is available within each enclosure.</p>
 </section>;
}

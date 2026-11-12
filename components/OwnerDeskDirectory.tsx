"use client";
import {useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {ownerDesks} from "@/data/owner-desks";
import styles from "@/app/account/owner-tools/page.module.css";

type Group="all"|"content"|"community"|"commerce"|"games";
const groups=[
 {id:"all" as Group,label:"All desks"},
 {id:"content" as Group,label:"Content"},
 {id:"community" as Group,label:"Community"},
 {id:"commerce" as Group,label:"Commerce"},
 {id:"games" as Group,label:"Games"},
];
const groupByHref:Record<string,Exclude<Group,"all">>={
 "/account/owner-tools/species-requests":"community",
 "/admin/feedback":"community",
 "/admin/spotlight":"content",
 "/admin/updates":"content",
 "/admin/species":"content",
 "/admin/guides":"content",
 "/admin/lab":"content",
 "/admin/products":"commerce",
 "/admin/vendors":"commerce",
 "/admin/puzzle-desk":"games",
 "/admin/podbound":"games",
};
export function OwnerDeskDirectory(){
 const [query,setQuery]=useState("");
 const [group,setGroup]=useState<Group>("all");
 const term=query.trim().toLowerCase();
 const desks=ownerDesks.filter(d=>
  (group==="all"||groupByHref[d.href]===group)&&
  (!term||[d.title,d.label,d.description].join(" ").toLowerCase().includes(term))
 );
 return <section id="owner-desks" className={styles.directory} aria-labelledby="owner-directory-title">
  <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>YOUR WORKSPACE</p><h2 id="owner-directory-title">Studio desks</h2></div><span className={styles.sectionHint}>{desks.length} of {ownerDesks.length}</span></div>
  <div className={styles.directoryTools}>
   <label className={styles.searchLabel} htmlFor="owner-desk-search"><PodscapeLineIcon name="search"/><input id="owner-desk-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a desk…" autoComplete="off"/></label>
   <div className={styles.filters} role="group" aria-label="Filter desks by workstream">
    {groups.map(item=><button key={item.id} type="button" aria-pressed={group===item.id} onClick={()=>setGroup(item.id)}>{item.label}</button>)}
   </div>
  </div>
  <div className={styles.grid}>
   {desks.map(desk=><Link className={styles.card} href={desk.href} key={desk.href}>
     <span className={styles.symbol} aria-hidden="true"><PodscapeLineIcon name={desk.icon}/></span>
     <span className={styles.copy}><small>{desk.label}</small><strong>{desk.title}</strong><span>{desk.description}</span></span>
     <PodscapeLineIcon name="arrow-right"/>
   </Link>)}
  </div>
  {!desks.length?<div className={styles.noResults}><strong>No matching desks</strong><p>Try another search or choose All desks.</p><button type="button" onClick={()=>{setQuery("");setGroup("all")}}>Show all desks</button></div>:null}
 </section>;
}

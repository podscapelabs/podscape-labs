"use client";

import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {logKeeperEvent,undoKeeperEvent} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./ColonyWorkspace.module.css";

type CareEvent={id:string;kind:string;note:string;createdAt:string;quantityChange:number|null};
type Colony={id:string;name:string;label:string;species:string;image:string|null;status:string;breeding:string;quantity:number;archived:boolean};
function dayLabel(timestamp:string){
 const d=new Date(timestamp);
 return Number.isNaN(d.getTime())?"Date unavailable":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
export function ColonyWorkspace({colony,initialEvents,careDates,initialPanel,referenceUrl}:{
 colony:Colony;initialEvents:CareEvent[];careDates:Record<string,string>;initialPanel?:string;referenceUrl?:string
}){
 const router=useRouter();
 const [events,setEvents]=useState(initialEvents);
 const [pending,start]=useTransition();
 const [observation,setObservation]=useState("");
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [lastSaved,setLastSaved]=useState<string|null>(null);
 const [undoing,setUndoing]=useState(false);
 const [notesOpen,setNotesOpen]=useState(initialPanel==="observation");
 const id=encodeURIComponent(colony.id);
 const careUrl="/keeper/scan?bin="+id+"&mode=care";
 const lastMisted=events.find(x=>x.note==="Misted")?.createdAt||careDates.Misted;
 const lastFed=events.find(x=>x.note==="Fed")?.createdAt||careDates.Fed;
 function recordObservation(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const note=observation.trim();
  if(!note||pending||undoing||colony.archived)return;
  setError("");setMessage("");
  start(async()=>{
   try{
    const result=await logKeeperEvent({id:colony.id,kind:"observation",note});
    if(!result.success||!result.id){setError(result.error||"Unable to save note.");return;}
    const createdAt=new Date().toISOString();
    setEvents(old=>[{id:result.id!,kind:"observation",note,createdAt,quantityChange:null},...old]);
    setLastSaved(result.id);setObservation("");setMessage("Note saved to this colony.");
    setNotesOpen(false);router.refresh();
   }catch{setError("Unable to save note. Please retry.");}
  });
 }
 async function undo(){
  if(!lastSaved||pending||undoing)return;
  setUndoing(true);setError("");
  try{
   const result=await undoKeeperEvent({id:lastSaved,enclosureId:colony.id});
   if(!result.success){setError(result.error||"Could not undo note.");return;}
   setEvents(old=>old.filter(x=>x.id!==lastSaved));setLastSaved(null);setMessage("Note removed.");
   router.refresh();
  }catch{setError("Could not undo. Your record may still be saved.");}
  finally{setUndoing(false);}
 }
 const tiles=[
  {title:"Quick Care",detail:"Misting, feeding & care logs",href:careUrl,icon:"droplet" as const,featured:true},
  {title:"Colony Details",detail:"Population, habitat & status",href:"/keeper/"+id+"/details",icon:"jar" as const},
  {title:"Care Schedule",detail:"Set routines for this enclosure",href:"/keeper/"+id+"/details?panel=care#care-reminders",icon:"calendar" as const},
  {title:"History",detail:"Every recorded care action",href:"/keeper/"+id+"/history",icon:"note" as const},
  {title:"QR Label",detail:"Print, scan & identify",href:"/keeper/qr?bin="+id,icon:"qr" as const}
 ];
 return <div className={styles.root}>
  <nav className={styles.breadcrumb} aria-label="Colony navigation"><Link href="/keeper">Manager</Link><span>/</span><Link href="/keeper/collection">My Colonies</Link><span>/</span><span>{colony.name}</span></nav>
  <header className={styles.hero}>
   <div className={styles.heroImage}>{colony.image?<Image src={colony.image} alt="" fill sizes="(max-width:720px) 70px,96px" style={{objectFit:"cover"}}/>:<PodscapeLineIcon name="jar"/>}</div>
   <div className={styles.heroText}>
    <p>MANAGER / COLONY</p><h1>{colony.species}</h1><strong>{colony.name}</strong>
    <span>{colony.label||"No location assigned"} · {colony.status.replaceAll("-"," ")}{colony.archived?" · Archived":""}</span>
   </div>
  </header>
  <div className={styles.metrics} aria-label="At a glance">
   <div><span>Estimated population</span><strong>~{colony.quantity.toLocaleString()}</strong></div>
   <div><span>Last misted</span><strong>{lastMisted?dayLabel(lastMisted):"Not yet logged"}</strong></div>
   <div><span>Last fed</span><strong>{lastFed?dayLabel(lastFed):"Not yet logged"}</strong></div>
  </div>
  <section className={styles.tools} aria-labelledby="colony-tools-heading">
   <div className={styles.sectionTitle}><div><p>YOUR COLONY / WORKSPACES</p><h2 id="colony-tools-heading">What would you like to do?</h2></div></div>
   <div className={styles.toolGrid}>{tiles.map(tile=><Link key={tile.title} className={tile.featured?styles.featuredTool:undefined} href={tile.href}>
    <PodscapeLineIcon name={tile.icon}/><strong>{tile.title}</strong><small>{tile.detail}</small><span className={styles.toolArrow} aria-hidden="true">↗</span>
   </Link>)}</div>
  </section>
  <section className={styles.care} aria-labelledby="colony-notes-heading">
   <div className={styles.sectionTitle}><div><p>YOUR RECORDS</p><h2 id="colony-notes-heading">Notes & recent activity</h2></div><Link href={"/keeper/"+id+"/history"}>Full history →</Link></div>
   {events.length?<div className={styles.historyList}>{events.slice(0,3).map(event=><div key={event.id}><span><strong>{event.note||event.kind.replaceAll("-"," ")}</strong><small>{event.kind.replaceAll("-"," ")}</small></span><time dateTime={event.createdAt}>{dayLabel(event.createdAt)}</time></div>)}</div>:<p className={styles.empty}>Nothing logged yet. Your first care entry will appear here.</p>}
   <div className={styles.noteToggle}><button type="button" aria-expanded={notesOpen} aria-controls="colony-note-editor" onClick={()=>setNotesOpen(x=>!x)} disabled={colony.archived}>{notesOpen?"Close note":"＋ Add a note"}</button></div>
   {notesOpen?<form className={styles.noteForm} id="colony-note-editor" onSubmit={recordObservation}>
    <label htmlFor="colony-observation">Colony observation</label>
    <textarea id="colony-observation" rows={3} maxLength={1500} placeholder="New mancae, changes in activity, feeding observations…" value={observation} onChange={e=>setObservation(e.target.value)} required/>
    <button type="submit" disabled={pending||undoing||!observation.trim()||colony.archived}>{pending?"Saving…":"Save note"}</button>
   </form>:null}
   {error?<p className={styles.warning} role="alert">{error}</p>:null}
   {message?<div className={styles.notice} role="status"><span>{message}</span>{lastSaved?<button type="button" onClick={undo} disabled={undoing||pending}>{undoing?"Undoing…":"Undo"}</button>:null}</div>:null}
  </section>
  {referenceUrl?<Link className={styles.reference} href={referenceUrl}>Explore {colony.species} in Leaf Ledger →</Link>:null}
 </div>;
}

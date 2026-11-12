"use client";

import {useState,useTransition,type FormEvent,type ReactNode} from "react";
import {ColonyDashboardLayout,type ColonyWidgetId} from "@/components/ColonyDashboardLayout";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {logKeeperEvent,undoKeeperEvent} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {BinSwitcher,type SwitchableBin} from "@/components/BinSwitcher";
import {BinLifecycleControls} from "@/components/BinLifecycleControls";
import styles from "./ColonyWorkspace.module.css";

type CareEvent={id:string;kind:string;note:string;createdAt:string;quantityChange:number|null};
type Colony={id:string;name:string;label:string;species:string;image:string|null;status:string;breeding:string;quantity:number;archived:boolean;enclosureType:string};
function dayLabel(timestamp:string){
 const d=new Date(timestamp);
 return Number.isNaN(d.getTime())?"Date unavailable":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
export function ColonyWorkspace({colony,initialEvents,careDates,initialPanel,referenceUrl,scope,navigationBins=[]}:{
 colony:Colony;initialEvents:CareEvent[];careDates:Record<string,string>;initialPanel?:string;referenceUrl?:string;scope:string;navigationBins?:SwitchableBin[]
}){
 const router=useRouter();
 const [events,setEvents]=useState(initialEvents);
 const [pending,start]=useTransition();
 const [observation,setObservation]=useState("");
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [lastSaved,setLastSaved]=useState<string|null>(null);
 const [undoing,setUndoing]=useState(false);
 const [notesOpen,setNotesOpen]=useState(initialPanel==="observation"&&!colony.archived);
 const id=encodeURIComponent(colony.id);
 const careUrl="/keeper/scan?bin="+id+"&mode=care";
 const lastMisted=events.find(x=>x.note==="Misted")?.createdAt||careDates.Misted;
 const lastFed=events.find(x=>x.note==="Fed")?.createdAt||careDates.Fed;
 const latestObservation=events.find(x=>x.kind==="observation");
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
 const tiles:Array<{title:string;detail:string;href:string;icon:"droplet"|"jar"|"calendar"|"note"|"qr";featured?:boolean;requiresActive?:boolean}>=[
  {title:"Quick Care",detail:"Misting, feeding & care logs",href:careUrl,icon:"droplet" as const,featured:true,requiresActive:true},
  {title:"Care Schedule",detail:"Set routines for this enclosure",href:"/keeper/"+id+"/details?panel=care#care-reminders",icon:"calendar" as const},
  {title:"QR Label",detail:"Print, scan & identify",href:"/keeper/qr?bin="+id,icon:"qr" as const,requiresActive:true}
 ];
 const widgets:Record<ColonyWidgetId,ReactNode>={
  shortcuts:<section className={styles.tools} aria-label="Colony tools">
   <div className={styles.sectionTitle}><div><p>QUICK ACTIONS</p><h2>Colony tools</h2></div></div>
   <div className={styles.toolGrid}>{tiles.filter(tile=>!colony.archived||!tile.requiresActive).map(tile=><Link key={tile.title} className={tile.featured?styles.featuredTool:undefined} href={tile.href}>
     <PodscapeLineIcon name={tile.icon}/><strong>{tile.title}</strong><small>{tile.detail}</small><span className={styles.toolArrow} aria-hidden="true">↗</span>
    </Link>)}</div>
  </section>,
  care:<section className={styles.widgetPanel} aria-label="Care at a glance">
    <div className={styles.sectionTitle}><div><p>CARE & ROUTINES</p><h2>Care at a glance</h2></div>{!colony.archived?<Link href={careUrl}>Log care →</Link>:<span className={styles.readOnlyLabel}>Archived</span>}</div>
    <div className={styles.miniMetrics}>
      <div><span>Last misted</span><strong>{lastMisted?dayLabel(lastMisted):"Not logged"}</strong></div>
      <div><span>Last fed</span><strong>{lastFed?dayLabel(lastFed):"Not logged"}</strong></div>
    </div>
    {!colony.archived?<Link className={styles.widgetLink} href={"/keeper/"+id+"/details?panel=care#care-reminders"}>Manage schedule →</Link>:<p className={styles.dataHint}>This archived colony is read-only for care logging.</p>}
   </section>,
  population:<section className={styles.widgetPanel} aria-label="Population and breeding">
    <div className={styles.sectionTitle}><div><p>COLONY RECORDS</p><h2>Population & breeding</h2></div><Link href={"/keeper/"+id+"/details"}>Edit →</Link></div>
    <div className={styles.miniMetrics}>
      <div><span>Recorded population</span><strong>~{colony.quantity.toLocaleString()}</strong></div>
      <div><span>Breeding</span><strong>{colony.breeding.replaceAll("-"," ")}</strong></div>
    </div>
    <p className={styles.dataHint}>Values come from your saved colony record, not automatic estimates.</p>
   </section>,
  environment:<section className={styles.widgetPanel} aria-label="Enclosure and environment">
    <div className={styles.sectionTitle}><div><p>COLONY SETUP</p><h2>Enclosure & environment</h2></div><Link href={"/keeper/"+id+"/details"}>Edit →</Link></div>
    <div className={styles.factList}>
     <div><span>Enclosure</span><strong>{colony.enclosureType||"Not recorded"}</strong></div>
     <div><span>Location</span><strong>{colony.label||"Not assigned"}</strong></div>
     <div><span>Status</span><strong>{colony.status.replaceAll("-"," ")}</strong></div>
    </div>
    <p className={styles.dataHint}>Recorded setup only. No live humidity or temperature readings.</p>
   </section>,
  observations:<section className={styles.widgetPanel} aria-label="Colony observations">
   <div className={styles.sectionTitle}><div><p>YOUR NOTES</p><h2>Observations</h2></div><Link href={"/keeper/"+id+"/history"}>All notes →</Link></div>
   {latestObservation?<div className={styles.latestNote}>
    <strong>Latest note</strong><p>{latestObservation.note}</p>
   </div>:<p className={styles.empty}>Nothing noted yet. Keep an eye on your colony and record what you see.</p>}
   {!colony.archived?<div className={styles.noteToggle}><button type="button" aria-expanded={notesOpen} aria-controls="colony-note-editor" onClick={()=>setNotesOpen(x=>!x)}>{notesOpen?"Close note":"＋ Add observation"}</button></div>:null}
   {notesOpen&&!colony.archived?<form className={styles.noteForm} id="colony-note-editor" onSubmit={recordObservation}>
    <label htmlFor="colony-observation">Colony observation</label>
    <textarea id="colony-observation" rows={3} maxLength={1500} placeholder="New mancae, changes in activity, feeding observations…" value={observation} onChange={e=>setObservation(e.target.value)} required/>
    <button type="submit" disabled={pending||undoing||!observation.trim()||colony.archived}>{pending?"Saving…":"Save note"}</button>
   </form>:null}
   {error?<p className={styles.warning} role="alert">{error}</p>:null}
   {message?<div className={styles.notice} role="status"><span>{message}</span>{lastSaved?<button type="button" onClick={undo} disabled={undoing||pending}>{undoing?"Undoing…":"Undo"}</button>:null}</div>:null}
   </section>,
  activity:<section className={styles.widgetPanel} aria-label="Recent colony activity">
    <div className={styles.sectionTitle}><div><p>CARE HISTORY</p><h2>Recent care</h2></div><Link href={"/keeper/"+id+"/history"}>Full history →</Link></div>
    {events.length?<div className={styles.historyList}>{events.slice(0,3).map(event=><div key={event.id}><span><strong>{event.note||event.kind.replaceAll("-"," ")}</strong><small>{event.kind.replaceAll("-"," ")}</small></span><time dateTime={event.createdAt}>{dayLabel(event.createdAt)}</time></div>)}</div>:<p className={styles.empty}>No entries yet. Record care to start your colony history.</p>}
   </section>
 };
 return <div className={styles.root}>
  <nav className={styles.breadcrumb} aria-label="Colony navigation"><Link href="/keeper">Manager</Link><span>/</span><Link href="/keeper/collection">My Colonies</Link><span>/</span><span>{colony.name}</span></nav>
  <header className={styles.hero}>
   <div className={styles.heroImage}>{colony.image?<Image src={colony.image} alt="" fill sizes="(max-width:720px) 70px,96px" style={{objectFit:"cover"}}/>:<PodscapeLineIcon name="jar"/>}</div>
   <div className={styles.heroText}>
    <p>MANAGER / COLONY</p><h1>{colony.species}</h1><strong>{colony.name}</strong>
    <span>{colony.label||"No location assigned"} · {colony.status.replaceAll("-"," ")}{colony.archived?" · Archived":""}</span>
   </div>
  </header>
  <div className={styles.binToolbar}>
   <nav aria-label="Bin actions">
    {!colony.archived?<Link href={careUrl}>Quick Care</Link>:null}
    <Link href={"/keeper/"+id+"/details"}>Settings</Link>
    <Link href={"/keeper/"+id+"/history"}>History</Link>
    {referenceUrl?<Link href={referenceUrl}>Species reference</Link>:null}
   </nav>
   <BinLifecycleControls id={colony.id} name={colony.name} archived={colony.archived} compact/>
  </div>
  <BinSwitcher bins={navigationBins} currentId={colony.id} disabled={pending||undoing} onSelect={nextId=>{
   if(observation.trim()&&!window.confirm("Leave this bin without saving your observation?"))return;
   router.push("/keeper/"+nextId);
  }}/>
  {colony.archived?<div className={styles.archivedNotice} role="status"><strong>Archived colony</strong><span>Your records are available to review. Restore this colony from Settings before recording new care.</span><Link href={"/keeper/"+id+"/details"}>Open settings →</Link></div>:null}
  <ColonyDashboardLayout scope={scope} colonyId={colony.id} widgets={widgets} forceVisible={initialPanel==="observation"?"observations":undefined}/>
 </div>;
}

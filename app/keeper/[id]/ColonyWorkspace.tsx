"use client";

import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {logKeeperEvent,undoKeeperEvent} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./ColonyWorkspace.module.css";

type Action={label:string;kind:"feeding"|"maintenance";note:string;icon:"droplet"|"leaf"|"note"|"jar"};
const actions:Action[]=[
 {label:"Misted",kind:"maintenance",note:"Misted",icon:"droplet"},
 {label:"Fed",kind:"feeding",note:"Fed",icon:"leaf"},
 {label:"Spot cleaned",kind:"maintenance",note:"Spot cleaned",icon:"jar"},
 {label:"Leaf litter",kind:"maintenance",note:"Leaf litter added",icon:"leaf"}
];
type CareEvent={id:string;kind:string;note:string;createdAt:string;quantityChange:number|null};
type Colony={id:string;name:string;label:string;species:string;image:string|null;status:string;breeding:string;quantity:number;archived:boolean;};
function dayLabel(timestamp:string){
 const d=new Date(timestamp);
 return Number.isNaN(d.getTime())?"Date unavailable":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
function lastCare(events:CareEvent[],note:string){return events.find(item=>item.note===note)?.createdAt;}
function syncMisting(id:string,now:string){
 try{
  const key="podscape-keeper-reminder-"+id;
  const previous=localStorage.getItem(key);
  if(previous){
   const parsed=JSON.parse(previous);
   if(Number.isInteger(parsed.intervalDays)){
    const date=new Date(now);
    const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
    localStorage.setItem(key,JSON.stringify({...parsed,lastMisted:day,updatedAt:now}));
    return previous;
   }
  }
 }catch{/* The server care log still saves when local device settings are inaccessible. */}
 return undefined;
}
export function ColonyWorkspace({colony,initialEvents,referenceUrl}:{colony:Colony;initialEvents:CareEvent[];referenceUrl?:string}){
 const router=useRouter();
 const [events,setEvents]=useState(initialEvents);
 const [pending,start]=useTransition();
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [lastSaved,setLastSaved]=useState<{id:string;note:string;previousReminder?:string}|null>(null);
 const [undoing,setUndoing]=useState(false);
 function record(action:Action){
  if(pending||undoing||colony.archived)return;
  setMessage("");setError("");
  start(async()=>{
   try{
    const result=await logKeeperEvent({id:colony.id,kind:action.kind,note:action.note});
    if(!result.success||!result.id){setError(result.error||"Could not save care.");return;}
    const now=new Date().toISOString();
    const previousReminder=action.note==="Misted"?syncMisting(colony.id,now):undefined;
    setEvents(old=>[{id:result.id,kind:action.kind,note:action.note,createdAt:now,quantityChange:null},...old]);
    setLastSaved({id:result.id,note:action.note,previousReminder});
    setMessage(action.label+" recorded");
    router.refresh();
   }catch{setError("Could not save care. Please try again.");}
  });
 }
 async function undo(){
  if(!lastSaved||pending||undoing)return;
  setUndoing(true);setError("");
  try{
   const result=await undoKeeperEvent({id:lastSaved.id,enclosureId:colony.id});
   if(!result.success){setError(result.error||"Unable to undo that action.");return;}
   if(lastSaved.note==="Misted"&&lastSaved.previousReminder!==undefined){
    try{localStorage.setItem("podscape-keeper-reminder-"+colony.id,lastSaved.previousReminder)}catch{}
   }
   setEvents(old=>old.filter(item=>item.id!==lastSaved.id));
   setMessage("Care entry undone.");
   setLastSaved(null);
   router.refresh();
  }catch{setError("Could not undo. The care record may still be saved.");}
  finally{setUndoing(false);}
 }
 return <div className={styles.root}>
  <nav className={styles.breadcrumb} aria-label="Colony navigation"><Link href="/keeper">← Manager</Link><span>/</span><Link href="/keeper/collection">My Colonies</Link></nav>
  <header className={styles.hero}>
   <div className={styles.heroImage}>{colony.image?<Image src={colony.image} alt="" fill sizes="(max-width:720px) 110px,160px" style={{objectFit:"cover"}}/>:<PodscapeLineIcon name="jar"/>}</div>
   <div className={styles.heroText}><p>MANAGER / COLONY WORKSPACE</p><h1>{colony.species}</h1><strong>{colony.name}</strong><span>{colony.label||"No bin location recorded"} · {colony.status.replaceAll("-"," ")}</span></div>
  </header>
  <div className={styles.metrics} aria-label="Colony overview">
   <div><span>Recorded population</span><strong>{colony.quantity.toLocaleString()}</strong></div>
   <div><span>Last misted</span><strong>{lastCare(events,"Misted")?dayLabel(lastCare(events,"Misted")!):"Not logged"}</strong></div>
   <div><span>Breeding</span><strong>{colony.breeding.replaceAll("-"," ")}</strong></div>
  </div>
  <section className={styles.care} aria-labelledby="care-heading">
   <div className={styles.sectionTitle}><div><p>DAILY CARE</p><h2 id="care-heading">Quick Care</h2></div><Link href={"/keeper/"+colony.id+"/history"}>View history →</Link></div>
   <p className={styles.description}>Tap an action to save it to this bin's private care history.</p>
   {colony.archived?<p className={styles.warning}>This bin is archived. Restore it in Details before recording care.</p>:null}
   <div className={styles.actions}>{actions.map(action=><button type="button" key={action.note} disabled={pending||undoing||colony.archived} onClick={()=>record(action)}><PodscapeLineIcon name={action.icon}/><strong>{action.label}</strong><small>{lastCare(events,action.note)?"Last: "+dayLabel(lastCare(events,action.note)!):"Not logged yet"}</small></button>)}</div>
   {error?<p className={styles.warning} role="alert">{error}</p>:null}
   {message?<div className={styles.notice} role="status"><span>{message}</span>{lastSaved?<button type="button" onClick={undo} disabled={pending||undoing}>{undoing?"Undoing…":"Undo"}</button>:null}</div>:null}
  </section>
  <section className={styles.tools} aria-labelledby="tools-heading">
   <div className={styles.sectionTitle}><div><p>YOUR BIN</p><h2 id="tools-heading">Colony tools</h2></div></div>
   <div className={styles.toolGrid}>
    <Link href={"/keeper/"+colony.id+"/details"}><PodscapeLineIcon name="note"/><strong>Edit details</strong><small>Population, habitat and notes</small></Link>
    <Link href={"/keeper/qr?bin="+encodeURIComponent(colony.id)}><PodscapeLineIcon name="qr"/><strong>QR Label</strong><small>Print or download</small></Link>
    <Link href="/keeper/schedule"><PodscapeLineIcon name="calendar"/><strong>Care schedule</strong><small>Plan and review misting</small></Link>
    <Link href={"/keeper/"+colony.id+"/history"}><PodscapeLineIcon name="jar"/><strong>Care history</strong><small>Review previous records</small></Link>
   </div>
  </section>
  <section className={styles.history} aria-labelledby="recent-care-heading">
   <div className={styles.sectionTitle}><div><p>YOUR RECORDS</p><h2 id="recent-care-heading">Recent activity</h2></div><Link href={"/keeper/"+colony.id+"/history"}>View all →</Link></div>
   {events.length?<div className={styles.historyList}>{events.slice(0,4).map(event=><div key={event.id}><span><strong>{event.note}</strong><small>{event.kind.replaceAll("-"," ")}</small></span><time dateTime={event.createdAt}>{dayLabel(event.createdAt)}</time></div>)}</div>:<p className={styles.empty}>No care records yet. Your first log will appear here.</p>}
  </section>
  {referenceUrl?<Link className={styles.reference} href={referenceUrl}>Explore this species in Leaf Ledger →</Link>:null}
 </div>;
}

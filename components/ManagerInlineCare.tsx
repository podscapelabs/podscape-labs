"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {logKeeperEvent,undoKeeperEvent} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./ManagerInlineCare.module.css";

function synchronizeReminder(binId:string):string|null|undefined{
 try{
  const key="podscape-keeper-reminder-"+binId;
  const old=localStorage.getItem(key);
  if(!old)return undefined;
  const parsed=JSON.parse(old);
  if(!Number.isInteger(parsed?.intervalDays))return undefined;
  const now=new Date();
  const localDay=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  localStorage.setItem(key,JSON.stringify({...parsed,lastMisted:localDay,updatedAt:now.toISOString()}));
  return old;
 }catch{return undefined}
}
function restoreReminder(binId:string,old:string|null|undefined){
 if(old===undefined)return;
 try{const key="podscape-keeper-reminder-"+binId;if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old)}catch{}
}
const actions=[
 {label:"Misted",kind:"maintenance",icon:"droplet"},
 {label:"Fed",kind:"feeding",icon:"jar"},
 {label:"Spot cleaned",kind:"maintenance",icon:"bin"},
 {label:"Leaf litter added",kind:"maintenance",icon:"leaf"}
] as const;

/** Same owner-checked care events as QR Quick Care; no extra page navigation. */
export function ManagerInlineCare({binId,binName,compact=false}:{binId:string;binName:string;compact?:boolean}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [pending,start]=useTransition();
 const [saved,setSaved]=useState<{id:string;label:string;reminderBefore?:string|null}|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 function save(action:(typeof actions)[number]){
  if(pending)return;
  if(saved?.label===action.label){setNotice("Already logged in this session. Use Undo to correct it.");return;}
  setError("");setNotice("");
  start(async()=>{
   try{
    const result=await logKeeperEvent({id:binId,kind:action.kind,note:action.label});
    if(!result.success||!result.id){setError(result.error||"Could not save care.");return;}
    setSaved({id:result.id,label:action.label,reminderBefore:action.label==="Misted"?synchronizeReminder(binId):undefined});
    setNotice(action.label+" recorded for "+binName);
    router.refresh();
   }catch{setError("Connection interrupted. Check care history before trying again.");}
  });
 }
 function undo(){
  if(!saved||pending)return;
  const previous=saved;
  setError("");setNotice("");
  start(async()=>{
   try{
    const result=await undoKeeperEvent({id:previous.id,enclosureId:binId});
    if(!result.success){setError(result.error||"Could not undo this care entry.");return;}
    restoreReminder(binId,previous.reminderBefore);
    setSaved(null);setNotice(previous.label+" undone");router.refresh();
   }catch{setError("Unable to undo. Review your care history.");}
  });
 }
 return <div className={compact?styles.compact:styles.root}>
  <button type="button" className={styles.launch} aria-expanded={open} aria-controls={"inline-care-"+binId} aria-label={(open?"Close Quick Care for ":"Quick Care for ")+binName} onClick={()=>setOpen(value=>!value)}><PodscapeLineIcon name="droplet"/><span>{open?"Close":compact?"Care":"Quick Care"}</span></button>
  {open?<div id={"inline-care-"+binId} className={styles.panel} aria-label={"Care for "+binName}>
   <div className={styles.heading}><strong>{binName}</strong><small>Tap an activity to record it now.</small></div>
   <div className={styles.tiles}>{actions.map(action=><button key={action.label} type="button" disabled={pending} onClick={()=>save(action)} aria-label={"Log "+action.label+" for "+binName} className={saved?.label===action.label?styles.recorded:""}><PodscapeLineIcon name={action.icon}/><span>{action.label}</span>{saved?.label===action.label?<span aria-hidden="true">✓</span>:null}</button>)}</div>
   {notice?<p className={styles.notice} role="status">{notice}{saved?<button type="button" disabled={pending} onClick={undo}>Undo</button>:null}</p>:null}
   {error?<p role="alert" className={styles.error}>{error}</p>:null}
   <Link className={styles.advanced} href={"/keeper/scan?bin="+encodeURIComponent(binId)+"&mode=care"}>More care options · Multi-care →</Link>
  </div>:null}
 </div>;
}

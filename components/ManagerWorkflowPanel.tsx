"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {logKeeperEvent,logKeeperEventBatch,undoKeeperEvent,undoKeeperEventBatch,updateEnclosurePopulation} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import type {ManagerBin} from "./ManagerCareWidgets";
import styles from "./ManagerWorkflowPanel.module.css";
export type ManagerWorkflow="care"|"notes"|"population"|"bulk";
const tasks=[{label:"Misted",kind:"maintenance",icon:"droplet"},{label:"Fed",kind:"feeding",icon:"jar"},{label:"Spot cleaned",kind:"maintenance",icon:"bin"},{label:"Leaf litter added",kind:"maintenance",icon:"leaf"}] as const;
type UndoRecord={id:string;binId:string;previous?:string|null};
function mistReminder(id:string){try{const k="podscape-keeper-reminder-"+id,old=localStorage.getItem(k);if(!old)return undefined;const obj=JSON.parse(old);if(!Number.isInteger(obj.intervalDays))return undefined;const now=new Date(),day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");localStorage.setItem(k,JSON.stringify({...obj,lastMisted:day,updatedAt:now.toISOString()}));return old}catch{return undefined}}
function restoreReminder(id:string,value:string|null|undefined){if(value===undefined)return;try{const k="podscape-keeper-reminder-"+id;if(value===null)localStorage.removeItem(k);else localStorage.setItem(k,value)}catch{}}
export function ManagerWorkflowPanel({bins,mode,onClose}:{bins:ManagerBin[];mode:ManagerWorkflow;onClose:()=>void}){
 const router=useRouter(),[selected,setSelected]=useState(bins[0]?.id||""),[query,setQuery]=useState(""),[note,setNote]=useState(""),[count,setCount]=useState(String(bins[0]?.quantity??0)),[ids,setIds]=useState<string[]>([]),[pending,start]=useTransition(),[error,setError]=useState(""),[message,setMessage]=useState(""),[undo,setUndo]=useState<UndoRecord[]|null>(null),[confirm,setConfirm]=useState<{kind:string;label:string;ids:string[]}|null>(null);
 const bin=bins.find(item=>item.id===selected);
 const matched=bins.filter(item=>[item.name,item.label,item.species].some(v=>v.toLowerCase().includes(query.trim().toLowerCase()))).slice(0,40);
 const title=mode==="care"?"Quick Care":mode==="notes"?"Add an observation":mode==="population"?"Update population":"Care for multiple bins";
 function saveCare(kind:string,label:string,targets:string[],confirmed=false){
  if(!targets.length||pending)return;
  if(undo?.length){setError("Undo the last care action or reopen the workflow to log another.");return}
  if(!confirmed&&targets.length===bins.length&&bins.length>1){setConfirm({kind,label,ids:targets});return}
  setConfirm(null);setError("");setMessage("");
  start(async()=>{try{
   let records:UndoRecord[]=[];
   if(targets.length===1){const result=await logKeeperEvent({id:targets[0],kind,note:label});if(!result.success||!result.id){setError(result.error||"Save failed.");return}records=[{id:result.id,binId:targets[0],previous:label==="Misted"?mistReminder(targets[0]):undefined}]}else{
    const result=await logKeeperEventBatch({ids:targets,kind,note:label});if(!result.success||!result.events){setError(result.error||"Bulk save failed.");return}records=result.events.map(item=>({id:item.id,binId:item.enclosureId,previous:label==="Misted"?mistReminder(item.enclosureId):undefined}));
   }
   setUndo(records);setMessage(label+" recorded for "+targets.length+" "+(targets.length===1?"bin":"bins")+".");router.refresh();
  }catch{setError("Connection interrupted. Check your care history before retrying.")}});
 }
 function undoCare(){
  if(!undo?.length||pending)return;const records=undo;
  start(async()=>{try{const result=records.length===1?await undoKeeperEvent({id:records[0].id,enclosureId:records[0].binId}):await undoKeeperEventBatch({eventIds:records.map(item=>item.id)});if(!result.success){setError(result.error||"Undo failed.");return}for(const item of records)restoreReminder(item.binId,item.previous);setUndo(null);setMessage("Care action undone.");router.refresh()}catch{setError("Undo failed. Check your care history.")}});
 }
 function saveNote(){if(!bin||!note.trim()||pending)return;start(async()=>{try{const result=await logKeeperEvent({id:bin.id,kind:"observation",note:note.trim()});if(!result.success){setError(result.error||"Save failed.");return}setNote("");setMessage("Observation saved.");setError("");router.refresh()}catch{setError("Connection interrupted. Check observations before retrying.")}})}
 function saveCount(){if(!bin||!/^\d+$/.test(count)||pending)return;start(async()=>{try{const result=await updateEnclosurePopulation({id:bin.id,quantity:Number(count)});if(!result.success){setError(result.error||"Save failed.");return}setMessage("Population updated.");setError("");router.refresh()}catch{setError("Save interrupted. Check the bin before retrying.")}})}
 return <section className={styles.panel} aria-label={title}>
 <header className={styles.header}><div><small>MANAGER / QUICK WORKFLOW</small><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close Manager workflow">×</button></header>
 {!bins.length?<p>No active bins. <Link href="/keeper/new">Create your first bin →</Link></p>:<>
 <label className={styles.search}>Find a bin<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Species, name or location…"/></label>
 {mode==="bulk"?<><div className={styles.selectTools}><button type="button" onClick={()=>setIds(bins.map(item=>item.id))}>Select all</button><button type="button" onClick={()=>setIds([])}>Clear</button><span>{ids.length} selected</span></div><div className={styles.binList} role="group" aria-label="Select bins">{matched.map(item=><label key={item.id} className={styles.checkBin}><input type="checkbox" checked={ids.includes(item.id)} onChange={e=>{setConfirm(null);setIds(old=>e.target.checked?[...old,item.id]:old.filter(id=>id!==item.id))}}/><span><strong>{item.name}</strong><small>{item.species}</small></span></label>)}</div></>:<div className={styles.binList} role="group" aria-label="Choose bin">{matched.map(item=><button key={item.id} type="button" className={selected===item.id?styles.selectedBin:styles.binOption} onClick={()=>{setSelected(item.id);setCount(String(item.quantity));setNote("");setMessage("");setError("");setUndo(null)}} aria-pressed={selected===item.id}><span><strong>{item.name}</strong><small>{item.species}{item.label?" · "+item.label:""}</small></span>{selected===item.id?<PodscapeLineIcon name="check"/>:null}</button>)}</div>}
 {mode==="care"||mode==="bulk"?<div className={styles.tasks}>{tasks.map(task=><button type="button" key={task.label} disabled={pending||(mode==="bulk"?!ids.length:!bin)} onClick={()=>saveCare(task.kind,task.label,mode==="bulk"?ids:bin?[bin.id]:[])}><PodscapeLineIcon name={task.icon}/>{task.label}</button>)}</div>:null}
 {confirm?<div className={styles.confirm} role="alert"><p>Apply “{confirm.label}” to all {confirm.ids.length} selected bins?</p><button type="button" onClick={()=>setConfirm(null)}>Cancel</button><button type="button" disabled={pending} onClick={()=>saveCare(confirm.kind,confirm.label,confirm.ids,true)}>Confirm care</button></div>:null}
 {mode==="notes"?<form className={styles.form} onSubmit={e=>{e.preventDefault();saveNote()}}><label>Observation<textarea required maxLength={1500} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="New mancae, changes in activity, feeding observations…"/></label><button type="submit" disabled={pending||!bin||!note.trim()}>Save observation</button></form>:null}
 {mode==="population"?<form className={styles.form} onSubmit={e=>{e.preventDefault();saveCount()}}><label>Recorded population<input type="number" min={0} max={99999} step={1} required value={count} onChange={e=>setCount(e.target.value)}/></label><button type="submit" disabled={pending||!bin||!/^\d+$/.test(count)}>Save population</button></form>:null}
 {message?<div className={styles.message} role="status">{message}{undo?<button type="button" disabled={pending} onClick={undoCare}>Undo</button>:null}</div>:null}
 {error?<p role="alert" className={styles.error}>{error}</p>:null}
 <p className={styles.footer}>Uses the same private records as Quick Care and My Colonies. <Link href="/keeper/collection?view=active">All bins →</Link></p>
 </>}
 </section>;
}

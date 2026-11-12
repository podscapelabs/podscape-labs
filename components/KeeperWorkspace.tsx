"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEnclosure, updateEnclosure, logKeeperEvent } from "@/app/keeper/actions";
import {nextBinName} from "@/lib/bin-setup";
import {useUnsavedBinChanges} from "./useUnsavedBinChanges";
import type { Enclosure } from "@/lib/keeper";
import styles from "./KeeperWorkspace.module.css";

export function CreateEnclosure({ speciesId, speciesName }: {speciesId:string;speciesName:string}) {
 const [name,setName]=useState(()=>nextBinName(speciesName,[]));const [location,setLocation]=useState(""); const [message,setMessage]=useState(""); const [pending,start]=useTransition();const router=useRouter();
 function submit(e:FormEvent){e.preventDefault();start(async()=>{const result=await createEnclosure({speciesId,name,label:location});if(result.success&&result.id){router.push("/keeper/"+result.id+"?created=1");router.refresh();}else setMessage(result.error||"Unable to create.");});}
 return <form className={styles.create} onSubmit={submit}><label>New enclosure for {speciesName}<input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="e.g. Panda King · Bin A04" required /></label><label>Location (optional)<input value={location} maxLength={70} onChange={e=>setLocation(e.target.value)}/></label><button disabled={pending}>{pending?"Creating…":"Create bin →"}</button>{message?<p role="alert">{message}</p>:null}</form>;
}

export function KeeperControls({entry,showLogForm=true}: {entry:Enclosure;showLogForm?:boolean}) {
 const [form,setForm]=useState({name:entry.name,label:entry.label,quantity:entry.quantity,status:entry.status,breeding:entry.breeding,enclosureType:entry.enclosureType,acquiredOn:entry.acquiredOn||"",source:entry.source,notes:entry.notes});
 const [saved,setSaved]=useState(form);
 const dirty=JSON.stringify(form)!==JSON.stringify(saved);
 const [kind,setKind]=useState("feeding");const [note,setNote]=useState("");const [message,setMessage]=useState("");const [pending,start]=useTransition();const router=useRouter();
 useUnsavedBinChanges(dirty||Boolean(note.trim()));
 function edit(e:FormEvent){e.preventDefault();if(pending)return;setMessage("");start(async()=>{try{const result=await updateEnclosure({id:entry.id,...form});setMessage(result.success?"Bin details saved.":result.error||"Save failed.");if(result.success){setSaved({...form});router.refresh();}}catch{setMessage("Couldn't save this bin. Your changes are still here.");}});}
 function log(e:FormEvent){e.preventDefault();setMessage("");start(async()=>{const result=await logKeeperEvent({id:entry.id,kind,note});setMessage(result.success?"Care entry saved.":result.error||"Couldn't record activity.");if(result.success){setNote("");router.refresh();}});}
 const change=(key:keyof typeof form,value:string|number)=>setForm(prev=>({...prev,[key]:value}));
 return <div className={styles.workspace}>
 <form className={styles.card} onSubmit={edit}><div className={styles.heading}><h2>Bin details</h2><span>Private · Editable</span></div><div className={styles.fields}>
  <label>Estimated population<input type="number" min="0" max="99999" required value={form.quantity} onChange={e=>change("quantity",Number(e.target.value))}/></label>
  <label>Bin name<input value={form.name} maxLength={80} required onChange={e=>change("name",e.target.value)}/></label>
  <label>Bin label / location<input value={form.label} maxLength={70} onChange={e=>change("label",e.target.value)} placeholder="e.g. Rack B · 04"/></label>
  <label>Colony condition<select value={form.status} onChange={e=>change("status",e.target.value)}>{["planning","establishing","stable","thriving","declining","no-longer-kept"].map(v=><option key={v} value={v}>{v.replaceAll("-"," ")}</option>)}</select></label>
  <label>Breeding<select value={form.breeding} onChange={e=>change("breeding",e.target.value)}>{["unknown","not-observed","observed","active"].map(v=><option key={v} value={v}>{v.replaceAll("-"," ")}</option>)}</select></label>
  <label>Bin / setup<input value={form.enclosureType} maxLength={120} onChange={e=>change("enclosureType",e.target.value)} placeholder="e.g. 10 qt ventilated bin"/></label>
  <label>Acquired on<input type="date" value={form.acquiredOn} onChange={e=>change("acquiredOn",e.target.value)}/></label>
  <label>Source<input value={form.source} maxLength={300} onChange={e=>change("source",e.target.value)} placeholder="Breeder, shop, trade…"/></label>
  <label className={styles.wide}>Private keeper notes<textarea rows={3} maxLength={5000} value={form.notes} onChange={e=>change("notes",e.target.value)} placeholder="Habitat notes, colony changes…"/></label>
 </div><button className={styles.primary} disabled={pending||!dirty}>{pending?"Saving…":"Save changes"}</button><button type="button" className={styles.archiveButton} disabled={pending||!dirty} onClick={()=>{setForm({...saved});setMessage("Unsaved changes discarded.");}}>Cancel changes</button></form>
 {showLogForm?<form className={styles.card} onSubmit={log}><div className={styles.heading}><h2>Log activity</h2><span>A quick record from your bin</span></div><div className={styles.fields}><label>Activity<select value={kind} onChange={e=>setKind(e.target.value)}>{["feeding","maintenance","breeding","observation","inventory"].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className={styles.wide}>What happened?<textarea required maxLength={1500} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Fed vegetables; observed mancae; changed leaf litter…"/></label></div><button className={styles.primary} disabled={pending||!note.trim()}>{pending?"Recording…":"Add to activity log +"}</button></form>:null}
 <p className={styles.message} role="status" aria-live="polite">{message}</p>
 </div>;
}

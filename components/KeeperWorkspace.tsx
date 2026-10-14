"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEnclosure, updateEnclosure, logKeeperEvent } from "@/app/keeper/actions";
import type { Enclosure } from "@/lib/keeper";
import styles from "./KeeperWorkspace.module.css";

export function CreateEnclosure({ speciesId, speciesName }: {speciesId:string;speciesName:string}) {
 const [name,setName]=useState(""); const [message,setMessage]=useState(""); const [pending,start]=useTransition();const router=useRouter();
 function submit(e:FormEvent){e.preventDefault();start(async()=>{const result=await createEnclosure({speciesId,name});if(result.success&&result.id){router.push("/keeper/"+result.id);router.refresh();}else setMessage(result.error||"Unable to create.");});}
 return <form className={styles.create} onSubmit={submit}><label>New enclosure for {speciesName}<input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder="e.g. Panda King · Bin A04" required /></label><button disabled={pending}>{pending?"Creating…":"Create enclosure →"}</button>{message?<p role="alert">{message}</p>:null}</form>;
}

export function KeeperControls({entry}: {entry:Enclosure}) {
 const [form,setForm]=useState({name:entry.name,label:entry.label,quantity:entry.quantity,status:entry.status,breeding:entry.breeding,enclosureType:entry.enclosureType,notes:entry.notes});
 const [kind,setKind]=useState("feeding");const [note,setNote]=useState("");const [message,setMessage]=useState("");const [pending,start]=useTransition();const router=useRouter();
 function edit(e:FormEvent){e.preventDefault();setMessage("");start(async()=>{const result=await updateEnclosure({id:entry.id,...form});setMessage(result.success?"Enclosure saved.":result.error||"Save failed.");if(result.success)router.refresh();});}
 function log(e:FormEvent){e.preventDefault();setMessage("");start(async()=>{const result=await logKeeperEvent({id:entry.id,kind,note});setMessage(result.success?"Activity recorded.":result.error||"Couldn't record activity.");if(result.success){setNote("");router.refresh();}});}
 const change=(key:keyof typeof form,value:string|number)=>setForm(prev=>({...prev,[key]:value}));
 return <div className={styles.workspace}>
 <div className={styles.metrics}>
  <div className={styles.metric}><span>Estimated population</span><strong>{form.quantity}</strong><div className={styles.stepper}><button type="button" aria-label="Decrease population" onClick={()=>change("quantity",Math.max(0,form.quantity-1))}>−</button><input type="number" min="0" max="99999" value={form.quantity} aria-label="Population" onChange={e=>change("quantity",Number(e.target.value))}/><button type="button" aria-label="Increase population" onClick={()=>change("quantity",Math.min(99999,form.quantity+1))}>+</button></div></div>
  <div className={styles.metric}><span>Colony condition</span><strong>{form.status.replaceAll("-"," ")}</strong><small>Keeper reported</small></div>
  <div className={styles.metric}><span>Breeding</span><strong>{form.breeding.replaceAll("-"," ")}</strong><small>Observation status</small></div>
 </div>
 <form className={styles.card} onSubmit={edit}><div className={styles.heading}><h2>Colony profile</h2><span>Private · Editable</span></div><div className={styles.fields}>
  <label>Colony name<input value={form.name} maxLength={80} required onChange={e=>change("name",e.target.value)}/></label>
  <label>Bin label / location<input value={form.label} maxLength={70} onChange={e=>change("label",e.target.value)} placeholder="e.g. Rack B · 04"/></label>
  <label>Colony condition<select value={form.status} onChange={e=>change("status",e.target.value)}>{["planning","establishing","stable","thriving","declining","no-longer-kept"].map(v=><option key={v} value={v}>{v.replaceAll("-"," ")}</option>)}</select></label>
  <label>Breeding<select value={form.breeding} onChange={e=>change("breeding",e.target.value)}>{["unknown","not-observed","observed","active"].map(v=><option key={v} value={v}>{v.replaceAll("-"," ")}</option>)}</select></label>
  <label>Enclosure / setup<input value={form.enclosureType} maxLength={120} onChange={e=>change("enclosureType",e.target.value)} placeholder="e.g. 10 qt ventilated bin"/></label>
  <label className={styles.wide}>Private keeper notes<textarea rows={3} maxLength={5000} value={form.notes} onChange={e=>change("notes",e.target.value)} placeholder="Habitat notes, colony changes…"/></label>
 </div><button className={styles.primary} disabled={pending}>{pending?"Saving…":"Save colony details"}</button></form>
 <form className={styles.card} onSubmit={log}><div className={styles.heading}><h2>Log activity</h2><span>A quick record from your bin</span></div><div className={styles.fields}><label>Activity<select value={kind} onChange={e=>setKind(e.target.value)}>{["feeding","maintenance","breeding","observation","inventory"].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className={styles.wide}>What happened?<textarea required maxLength={1500} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Fed vegetables; observed mancae; changed leaf litter…"/></label></div><button className={styles.primary} disabled={pending||!note.trim()}>{pending?"Recording…":"Add to activity log +"}</button></form>
 <p className={styles.message} role="status" aria-live="polite">{message}</p>
 </div>;
}

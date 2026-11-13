"use client";
import {useRef,useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {createPortal} from "react-dom";
import {nextBinName} from "@/lib/bin-setup";
import {createEnclosure} from "@/app/keeper/actions";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";
import styles from "./QuickAddBin.module.css";

export function QuickAddBin({speciesId,speciesName,className,existingNames=[]}:{speciesId:string;speciesName:string;className?:string;existingNames?:string[]}){
 const [open,setOpen]=useState(false);
 const [name,setName]=useState("");
 const [label,setLabel]=useState("");
 const [error,setError]=useState("");
 const [pending,start]=useTransition();
 const opener=useRef<HTMLButtonElement>(null);
 const router=useRouter();
 const close=()=>{if(pending)return;setOpen(false);requestAnimationFrame(()=>opener.current?.focus())};
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!name.trim())return;
  setError("");
  start(async()=>{
   try{
    const result=await createEnclosure({speciesId,name:name.trim(),label:label.trim()});
    if(result.success&&result.id){
     setOpen(false);
     router.push("/keeper/"+result.id+"?created=1");
     router.refresh();
    }else setError(result.error||"Could not create this bin.");
   }catch{setError("Could not create this bin. Please try again.");}
  });
 }
 return <>
  <button ref={opener} className={className||styles.launch} type="button" onClick={()=>{setName(nextBinName(speciesName,existingNames));setLabel("");setError("");setOpen(true)}}>+ Add Bin</button>
  {open?createPortal(<PodscapeInfoDialog eyebrow="MANAGER · QUICK SETUP" icon="bin" title={"Add a bin"} description={"New enclosure for "+speciesName+". Saving a species alone never creates a bin."} onClose={close}>
   <form className={styles.form} onSubmit={submit}>
    <label className={styles.label}>Your bin name (editable)<input required maxLength={80} minLength={1} autoFocus disabled={pending} placeholder={speciesName+" · Bin A01"} value={name} onChange={event=>setName(event.target.value)} /></label>
    <label className={styles.label}>Location (optional)<input maxLength={70} disabled={pending} placeholder="e.g. Rack A · Shelf 2" value={label} onChange={event=>setLabel(event.target.value)}/></label>
    <p className={styles.hint}>Change the suggested name to anything that helps you identify this enclosure. The colony cards will still lead with the morph and scientific name; your custom bin name appears below. This creates one bin and keeps your other records untouched.</p>
    {error?<p className={styles.error} role="alert">{error}</p>:null}
    <button className={styles.submit} type="submit" disabled={pending||!name.trim()}>{pending?"Creating bin…":"Create & open bin →"}</button>
   </form>
  </PodscapeInfoDialog>,document.body):null}
 </>;
}

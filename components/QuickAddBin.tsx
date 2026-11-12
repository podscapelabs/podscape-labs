"use client";
import {useRef,useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {createPortal} from "react-dom";
import {createEnclosure} from "@/app/keeper/actions";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";
import styles from "./QuickAddBin.module.css";

export function QuickAddBin({speciesId,speciesName,className}:{speciesId:string;speciesName:string;className?:string}){
 const [open,setOpen]=useState(false);
 const [name,setName]=useState("");
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
    const result=await createEnclosure({speciesId,name:name.trim()});
    if(result.success&&result.id){
     setOpen(false);
     router.push("/keeper/"+result.id);
     router.refresh();
    }else setError(result.error||"Could not create this bin.");
   }catch{setError("Could not create this bin. Please try again.");}
  });
 }
 return <>
  <button ref={opener} className={className||styles.launch} type="button" onClick={()=>{setName("");setError("");setOpen(true)}}>+ Add Bin</button>
  {open?createPortal(<PodscapeInfoDialog eyebrow="MANAGER · QUICK SETUP" icon="bin" title={"Add a bin"} description={"New enclosure for "+speciesName+". Saving a species alone never creates a bin."} onClose={close}>
   <form className={styles.form} onSubmit={submit}>
    <label className={styles.label}>Bin name<input required maxLength={80} minLength={1} autoFocus disabled={pending} placeholder={speciesName+" · Bin A01"} value={name} onChange={event=>setName(event.target.value)} /></label>
    <p className={styles.hint}>This creates one actual bin, adds the species to My Collection if needed, and opens its private colony workspace. No other bins are changed.</p>
    {error?<p className={styles.error} role="alert">{error}</p>:null}
    <button className={styles.submit} type="submit" disabled={pending||!name.trim()}>{pending?"Creating bin…":"Create & open bin →"}</button>
   </form>
  </PodscapeInfoDialog>,document.body):null}
 </>;
}

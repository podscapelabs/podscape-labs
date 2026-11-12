"use client";

import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {deleteEnclosure,setEnclosureArchived} from "@/app/keeper/actions";
import styles from "./KeeperWorkspace.module.css";

export function BinLifecycleControls({id,name,archived}:{id:string;name:string;archived:boolean}){
 const router=useRouter();
 const [pending,start]=useTransition();
 const [error,setError]=useState("");
 function archive(){
  if(pending)return;
  setError("");
  start(async()=>{
   try{
    const result=await setEnclosureArchived({id,archived:!archived});
    if(!result.success){setError(result.error||"Could not update this bin.");return;}
    router.refresh();
   }catch{setError("Could not update this bin. Please try again.");}
  });
 }
 function remove(){
  if(pending||!window.confirm(`Permanently delete "${name}"?\n\nThis deletes this bin, its notes and its entire care history. This cannot be undone.\n\nYour saved species and other bins will stay in your collection. To keep this bin’s history, cancel and archive it instead.\n\nDelete this bin?`))return;
  setError("");
  start(async()=>{
   try{
    const result=await deleteEnclosure({id,confirmed:true});
    if(!result.success){setError(result.error||"Could not delete this bin.");return;}
    router.replace("/keeper/collection");
    router.refresh();
   }catch{setError("Could not confirm deletion. Refresh your bins before trying again.");}
  });
 }
 return <section className={styles.card} aria-labelledby="bin-management-title">
  <div className={styles.heading}><h2 id="bin-management-title">Manage this bin</h2></div>
  <p className={styles.lifecycleHelp}>Archive to keep your records. Permanently deleting a bin also deletes its notes and care history.</p>
  <div className={styles.lifecycleActions}>
   <button type="button" className={styles.archiveButton} disabled={pending} onClick={archive}>{archived?"Restore bin":"Archive bin"}</button>
   <button type="button" className={styles.deleteButton} disabled={pending} onClick={remove}>Delete bin</button>
  </div>
  {error?<p role="alert" className={styles.message}>{error}</p>:null}
 </section>;
}

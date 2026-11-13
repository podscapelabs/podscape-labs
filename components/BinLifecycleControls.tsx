"use client";

import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {deleteEnclosure,setEnclosureArchived} from "@/app/keeper/actions";
import {PodscapeConfirmDialog} from "./PodscapeConfirmDialog";
import styles from "./KeeperWorkspace.module.css";

export function BinLifecycleControls({id,name,archived,compact=false,speciesId}:{id:string;name:string;archived:boolean;compact?:boolean;speciesId?:string}){
 const router=useRouter();
 const [pending,start]=useTransition();
 const [error,setError]=useState("");
 const [confirmDelete,setConfirmDelete]=useState(false);
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
  if(pending)return;
  setConfirmDelete(false);
  setError("");
  start(async()=>{
   try{
    const result=await deleteEnclosure({id,confirmed:true});
    if(!result.success){setError(result.error||"Could not delete this bin.");return;}
    router.replace("/keeper/collection"+(speciesId?"?species="+encodeURIComponent(speciesId)+"#colonies":""));
    router.refresh();
   }catch{setError("Could not confirm deletion. Refresh your bins before trying again.");}
  });
 }
 return <section id="manage-bin" className={compact?styles.lifecycleCompact:styles.card} aria-label="Manage this bin">
  {!compact?<><div className={styles.heading}><h2>Manage this bin</h2></div>
  <p className={styles.lifecycleHelp}>Archive to keep your records. Permanently deleting a bin also deletes its notes and care history.</p></>:null}
  <div className={styles.lifecycleActions}>
   <button type="button" className={styles.archiveButton} disabled={pending} onClick={archive}>{archived?"Restore bin":"Archive bin"}</button>
   <button type="button" className={styles.deleteButton} disabled={pending} onClick={()=>setConfirmDelete(true)}>Delete bin</button>
  </div>
  {confirmDelete?<PodscapeConfirmDialog title={`Permanently delete "${name}"?`} eyebrow="MANAGER / DELETE BIN" confirmLabel="Delete bin permanently" cancelLabel="Keep bin" pending={pending}
   onConfirm={remove} onCancel={()=>setConfirmDelete(false)}>
    <p><strong>This cannot be undone.</strong> Deleting this bin also permanently deletes its notes and entire care history.</p>
    <p>Your saved species and other bins will remain. To keep this bin’s history, cancel and archive it instead.</p>
   </PodscapeConfirmDialog>:null}
  {error?<p role="alert" className={styles.message}>{error}</p>:null}
 </section>;
}

"use client";
import {useEffect,useRef,useState,useTransition,type FormEvent} from "react";
import {createPortal} from "react-dom";
import {submitSpeciesRequest} from "@/app/ledger/requests/actions";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";
import styles from "@/app/ledger/requests/requests.module.css";

export function SpeciesRequestButton({launchSignal,hideTrigger=false}:{launchSignal?:number;hideTrigger?:boolean}={}){
 const [open,setOpen]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
 const [pending,start]=useTransition();const trigger=useRef<HTMLButtonElement>(null);const opener=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!launchSignal)return;opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setSent(false);setError("");setOpen(true)},[launchSignal]);
 function close(){if(pending)return;setOpen(false);requestAnimationFrame(()=>(opener.current||trigger.current)?.focus());}
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const name=String(new FormData(event.currentTarget).get("name")||"");setError("");
  start(async()=>{try{const result=await submitSpeciesRequest(name);if(result.error)setError(result.error);else setSent(true);}catch{setError("Could not send your request. Please try again.");}});
 }
 return <div className={hideTrigger?undefined:styles.requestEntry}>
  {!hideTrigger?<button type="button" ref={trigger} onClick={()=>{opener.current=trigger.current;setSent(false);setError("");setOpen(true);}}>Request species</button>:null}
  {open?createPortal(<PodscapeInfoDialog title="Request a species" eyebrow="LEAF LEDGER" icon="leaf" onClose={close}>
   {sent?<div className={styles.card}><p role="status">Request sent! Thanks for helping grow Leaf Ledger.</p><button type="button" onClick={close}>Done</button></div>:<form className={styles.card} onSubmit={submit}>
    <label>Species or common name<input name="name" required autoFocus minLength={2} maxLength={120} placeholder="Which species would you like added?" disabled={pending}/></label>
    <button disabled={pending}>{pending?"Sending…":"Send request"}</button>
    {error?<p role="alert">{error}</p>:null}
   </form>}
  </PodscapeInfoDialog>,document.body):null}
 </div>;
}

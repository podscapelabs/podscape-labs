"use client";
import {useEffect,useRef,useState,useTransition,type FormEvent} from "react";
import {createPortal} from "react-dom";
import {submitSpeciesRequest} from "@/app/ledger/requests/actions";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";
import styles from "@/app/ledger/requests/requests.module.css";

export function SpeciesRequestButton({launchSignal,hideTrigger=false,onLaunchConsumed}:{launchSignal?:number;hideTrigger?:boolean;onLaunchConsumed?:()=>void}={}){
 const [open,setOpen]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
 const [pending,start]=useTransition();const trigger=useRef<HTMLButtonElement>(null);const opener=useRef<HTMLElement|null>(null);const generation=useRef(0);const consumed=useRef<number|undefined>(undefined);
 useEffect(()=>{if(!launchSignal){consumed.current=undefined;return;}if(consumed.current===launchSignal)return;consumed.current=launchSignal;generation.current++;opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setSent(false);setError("");setOpen(true);onLaunchConsumed?.()},[launchSignal,onLaunchConsumed]);
 function close(){generation.current++;setOpen(false);requestAnimationFrame(()=>(opener.current||trigger.current)?.focus());}
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending)return;const session=generation.current;const name=String(new FormData(event.currentTarget).get("name")||"");setError("");
  start(async()=>{try{const result=await submitSpeciesRequest(name);if(session!==generation.current)return;if(result.error)setError(result.error);else setSent(true);}catch{if(session===generation.current)setError("Could not send your request. Please try again.");}});
 }
 return <div className={hideTrigger?undefined:styles.requestEntry}>
  {!hideTrigger?<button type="button" ref={trigger} onClick={()=>{generation.current++;opener.current=trigger.current;setSent(false);setError("");setOpen(true);}}>Request species</button>:null}
  {open?createPortal(<PodscapeInfoDialog title="Request a species" eyebrow="INDEX" icon="leaf" onClose={close}>
   {sent?<div className={styles.card}><p role="status">Request sent! Thanks for helping grow the Index.</p><button type="button" onClick={close}>Done</button></div>:<form className={styles.card} onSubmit={submit}>
    <label>Species or common name<input name="name" required autoFocus minLength={2} maxLength={120} placeholder="Which species would you like added?" disabled={pending}/></label>
    <button disabled={pending}>{pending?"Sending…":"Send request"}</button>
    {error?<p role="alert">{error}</p>:null}
   </form>}
  </PodscapeInfoDialog>,document.body):null}
 </div>;
}

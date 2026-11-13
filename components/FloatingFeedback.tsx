"use client";
import {feedbackAllowedOnRoute} from "@/lib/interface-route-policy";
import {useEffect,useId,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {usePathname} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./FloatingFeedback.module.css";

type Category="bug"|"idea"|"general";
export function FloatingFeedback({enabled}:{enabled:boolean}){
 const pathname=usePathname();
 const [mounted,setMounted]=useState(false),[open,setOpen]=useState(false);
 const [category,setCategory]=useState<Category>("bug"),[message,setMessage]=useState("");
 const [sending,setSending]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState("");
 const heading=useId(),dialog=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const excluded=!feedbackAllowedOnRoute(pathname);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;
  const triggerNode=trigger.current;
  const handle=(event:KeyboardEvent)=>{
   if(event.key==="Escape")setOpen(false);
   if(event.key!=="Tab"||!dialog.current)return;
   const controls=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),textarea:not(:disabled)'));
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  const previousOverflow=document.body.style.overflow;
  window.addEventListener("keydown",handle);document.body.style.overflow="hidden";
  requestAnimationFrame(()=>dialog.current?.querySelector<HTMLElement>('button[aria-label="Close feedback"]')?.focus({preventScroll:true}));
  return ()=>{window.removeEventListener("keydown",handle);document.body.style.overflow=previousOverflow;(triggerNode||previous)?.focus()};
 },[open]);
 if(!mounted||!enabled||excluded)return null;
 const close=()=>{if(sending)return;setOpen(false)};
 const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(sending||message.trim().length<10)return;
  setSending(true);setError("");
  try{
   const response=await fetch("/api/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    category,message:message.trim(),page:window.location.pathname+window.location.search,
    device:navigator.userAgent.slice(0,250)
   })});
   const result=await response.json() as {error?:string};
   if(!response.ok){setError(result.error||"Feedback could not be sent.");return;}
   setSuccess(true);setMessage("");
  }catch{setError("Connection lost. Your message is still here—try again.");}
  finally{setSending(false)}
 };
 return createPortal(<>
  {!open?<button ref={trigger} type="button" className={styles.tab} aria-label="Send PodScape feedback" onClick={()=>{setSuccess(false);setError("");setOpen(true)}}>
   <PodscapeLineIcon name="note"/><span>Feedback</span>
  </button>:null}
  {open?<div className={styles.overlay} onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
   <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={heading} ref={dialog}>
    <div className={styles.top}><div><small>PODSCAPE / YOUR VOICE</small><h2 id={heading}>{success?"Thanks for helping PodScape grow!":"Send feedback"}</h2></div><button type="button" className={styles.close} aria-label="Close feedback" disabled={sending} onClick={close}>×</button></div>
    {success?<div className={styles.success} role="status"><PodscapeLineIcon name="check"/><p>Your feedback was received. Every bug report and idea helps shape the beta.</p><button type="button" onClick={close}>Back to PodScape</button><button type="button" className={styles.quiet} onClick={()=>{setSuccess(false);setCategory("bug")}}>Send another</button></div>:
    <form onSubmit={submit}>
     <p className={styles.description}>Found something odd? Have an idea? Tell us here without leaving the page.</p>
     <label className={styles.field}>What&apos;s this about?
      <select value={category} onChange={event=>setCategory(event.target.value as Category)} disabled={sending}>
       <option value="bug">Something isn&apos;t working</option><option value="idea">I have an idea</option><option value="general">General feedback</option>
      </select></label>
     <label className={styles.field}>Tell us more
      <textarea value={message} onChange={event=>setMessage(event.target.value)} rows={5} maxLength={2000} minLength={10} required disabled={sending} placeholder="What happened, what did you expect, or what would you love to see?"/>
     </label>
     <div className={styles.meta}><span>{message.length} / 2000</span><span>We&apos;ll include this page and basic device details to help investigate.</span></div>
     {error?<p className={styles.error} role="alert">{error}</p>:null}
     <button type="submit" className={styles.send} disabled={sending||message.trim().length<10}>{sending?"Sending…":"Send feedback →"}</button>
    </form>}
   </div>
  </div>:null}
 </>,document.body);
}

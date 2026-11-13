"use client";

import {useEffect,useRef,useState} from "react";
import styles from "./OwnerDeskUnsavedGuard.module.css";

/** Safe for ordinary native and server-action forms. Place inside the form being protected.
 * Custom multi-stage upload forms need their own explicit upload completion lifecycle.
 */
export function OwnerDeskUnsavedGuard({label="record"}:{label?:string}){
 const ref=useRef<HTMLSpanElement>(null);
 const [dirty,setDirty]=useState(false);
 useEffect(()=>{
  const form=ref.current?.closest("form");
  if(!form)return;
  let submitted=false;
  const initial=snapshot(form);
  const changed=()=>setDirty(snapshot(form)!==initial);
  const shouldConfirm=()=>!submitted&&snapshot(form)!==initial;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   if(!shouldConfirm())return;
   event.preventDefault();event.returnValue="";
  };
  const confirmExit=(event:Event)=>{
   if(!shouldConfirm())return;
   if(!window.confirm("You have unsaved "+label+" changes. Leave without saving?")){
    event.preventDefault();
    event.stopImmediatePropagation();
   }else submitted=true;
  };
  const onClick=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element)||event.defaultPrevented)return;
   if(form.contains(target))window.setTimeout(changed,0);
   const anchor=target.closest<HTMLAnchorElement>("a[href]");
   if(!anchor||!anchor.href||anchor.target==="_blank"||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const destination=new URL(anchor.href);
   const current=new URL(window.location.href);
   if(destination.pathname===current.pathname&&destination.search===current.search)return;
   confirmExit(event);
  };
  const onSubmit=(event:SubmitEvent)=>{
   if(event.target===form){submitted=true;return;}
   if(event.target instanceof HTMLFormElement)confirmExit(event);
  };
  form.addEventListener("input",changed);
  form.addEventListener("change",changed);
  document.addEventListener("click",onClick,true);
  document.addEventListener("submit",onSubmit,true);
  window.addEventListener("beforeunload",beforeUnload);
  return()=>{
   form.removeEventListener("input",changed);
   form.removeEventListener("change",changed);
   document.removeEventListener("click",onClick,true);
   document.removeEventListener("submit",onSubmit,true);
   window.removeEventListener("beforeunload",beforeUnload);
  };
 },[label]);
 return <span ref={ref} className={styles.status} role="status" aria-live="polite" data-dirty={dirty?"true":"false"}>{dirty?"● Unsaved changes":"No unsaved edits"}</span>;
}
function snapshot(form:HTMLFormElement){
 return [...new FormData(form).entries()].map(([name,value])=>
  JSON.stringify([name,typeof value==="string"?value:[value.name,value.size,value.lastModified].join(":")])
 ).join("|");
}

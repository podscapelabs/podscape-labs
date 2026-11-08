"use client";

import {useEffect,useRef,useState} from "react";

/** Keep this inside the species form. The browser retains control of native form actions. */
export function LedgerUnsavedGuard(){
  const marker=useRef<HTMLSpanElement>(null);
  const [dirty,setDirty]=useState(false);
  useEffect(()=>{
    const form=marker.current?.closest("form");
    if(!form)return;
    let submitted=false;
    const initial=snapshot(form);
    const changed=()=>{setDirty(snapshot(form)!==initial);};
    const beforeUnload=(event:BeforeUnloadEvent)=>{
      if(!submitted&&snapshot(form)!==initial){event.preventDefault();event.returnValue="";}
    };
    const confirmMove=(event:Event)=>{
      if(submitted||snapshot(form)===initial)return;
      if(!window.confirm("You have unsaved species changes. Leave without saving?")){
        event.preventDefault();
        event.stopImmediatePropagation();
      }else{submitted=true;}
    };
    const onClick=(event:MouseEvent)=>{
      const target=event.target;
      if(!(target instanceof Element)||event.defaultPrevented)return;
      if(form.contains(target))window.setTimeout(changed,0);
      const anchor=target.closest("a[href]");
      if(!anchor||!anchor.href||anchor.target==="_blank"||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const url=new URL(anchor.href);
      const current=new URL(window.location.href);
      if(url.pathname===current.pathname&&url.search===current.search&&url.hash)return;
      confirmMove(event);
    };
    const onSubmit=(event:SubmitEvent)=>{
      if(event.target===form){submitted=true;return;}
      // Switching records, creating a blank species or archiving can discard edits.
      if(event.target instanceof HTMLFormElement)confirmMove(event);
    };
    form.addEventListener("input",changed);
    form.addEventListener("change",changed);
    document.addEventListener("click",onClick,true);
    document.addEventListener("submit",onSubmit,true);
    window.addEventListener("beforeunload",beforeUnload);
    return ()=>{
      form.removeEventListener("input",changed);
      form.removeEventListener("change",changed);
      document.removeEventListener("click",onClick,true);
      document.removeEventListener("submit",onSubmit,true);
      window.removeEventListener("beforeunload",beforeUnload);
    };
  },[]);
  return <span ref={marker} className="ledger-unsaved-indicator" role="status" aria-live="polite">{dirty?"● Unsaved changes":"All changes saved"}</span>;
}

function snapshot(form:HTMLFormElement){
  return Array.from(new FormData(form).entries()).map(([key,value])=>
    [key,typeof value==="string"?value:[value.name,value.size,value.lastModified].join(":")]
  ).map(item=>JSON.stringify(item)).join("|");
}

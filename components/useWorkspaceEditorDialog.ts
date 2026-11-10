"use client";
import {useEffect,useRef} from "react";

/**
 * Common keyboard/focus contract for Home, Manager and Species widget libraries.
 * While open, trap Tab inside the editor, lock background scroll and restore
 * focus to the invoking control after close.
 */
export function useWorkspaceEditorDialog(open:boolean,onClose:()=>void){
 const ref=useRef<HTMLDivElement>(null);
 const returnFocus=useRef<HTMLElement|null>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previousOverflow=document.body.style.overflow;
  returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  document.body.style.overflow="hidden";
  const frame=requestAnimationFrame(()=>{
   const first=ref.current?.querySelector<HTMLElement>(
    "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])"
   );
   first?.focus();
  });
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){
    event.preventDefault();
    closeRef.current();
    return;
   }
   if(event.key!=="Tab"||!ref.current)return;
   const fields=Array.from(ref.current.querySelectorAll<HTMLElement>(
    "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])"
   )).filter(node=>node.getClientRects().length>0);
   if(!fields.length){event.preventDefault();return}
   const first=fields[0],last=fields[fields.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener("keydown",onKey);
  return ()=>{
   cancelAnimationFrame(frame);
   document.body.style.overflow=previousOverflow;
   document.removeEventListener("keydown",onKey);
   requestAnimationFrame(()=>returnFocus.current?.isConnected&&returnFocus.current.focus());
  };
 },[open]);
 return ref;
}

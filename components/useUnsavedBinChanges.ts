"use client";
import {useEffect} from "react";
/** Protect explicit link navigation and browser reload/close while a bin form is dirty. */
export function useUnsavedBinChanges(dirty:boolean){
 useEffect(()=>{
  if(!dirty)return;
  const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target instanceof Element?event.target.closest("a[href]"):null;
   if(!(link instanceof HTMLAnchorElement)||link.target==="_blank"||link.hasAttribute("download"))return;
   const target=new URL(link.href,location.href);
   if(target.pathname===location.pathname&&target.search===location.search)return;
   if(!window.confirm("Leave this bin without saving your changes?")){event.preventDefault();event.stopPropagation();}
  };
  window.addEventListener("beforeunload",unload);document.addEventListener("click",click,true);
  return()=>{window.removeEventListener("beforeunload",unload);document.removeEventListener("click",click,true);};
 },[dirty]);
}

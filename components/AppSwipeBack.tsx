"use client";

import {useEffect,useRef} from "react";
import {usePathname,useRouter} from "next/navigation";
import styles from "./AppSwipeBack.module.css";

// Native browser edge gestures remain the first choice. In installed PWAs,
// add a conservative content swipe for navigation, without intercepting carousels.
const RESERVED_EDGE=34;
const DISTANCE=110;
const MAX_DURATION=800;
function standalone(){
 return window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & {standalone?:boolean}).standalone);
}
function isInteractive(start:Element|null){
 if(!start)return true;
 if(start.closest('a,button,input,select,textarea,summary,dialog,[role="dialog"],[role="slider"],[role="tablist"],[role="grid"],[contenteditable="true"],[data-swipe-navigation="local"],[data-shortcut-index],[data-drag-handle],[data-workspace-drop-preview]'))return true;
 if(document.querySelector('dialog[open], [aria-modal="true"]'))return true;
 if(document.querySelector('.homeCanvasEditing, .shortcutEditing, .editing'))return true;
 for(let element:Element|null=start;element&&element!==document.documentElement;element=element.parentElement){
  if(!(element instanceof HTMLElement))continue;
  const style=getComputedStyle(element);
  // Some swipeable panels handle movement in JavaScript instead of overflow.
  // Respect explicitly horizontal touch surfaces even when their width doesn't overflow.
  if(style.touchAction==="pan-x"||style.touchAction==="pan-left"||style.touchAction==="pan-right")return true;
  if((style.overflowX==="auto"||style.overflowX==="scroll")&&element.scrollWidth>element.clientWidth+8)return true;
 }
 return false;
}

/**
 * Gesture navigation does not hijack the browser's own edge Back, any horizontal
 * content, or a species's deliberately scoped left/right profile carousel.
 * History is tab-local: never use router.back() just because a tab has external
 * browser history; doing so could exit PodScape on a first visit.
 */
export function AppSwipeBack(){
 const pathname=usePathname();
 const router=useRouter();
 const historyRef=useRef<string[]>([]);
 const popped=useRef(false);
 const started=useRef<{x:number;y:number;at:number}|null>(null);
 const navigating=useRef(false);
 const hintRef=useRef<HTMLDivElement>(null);
 const hideHint=()=>{
  const hint=hintRef.current;
  if(hint){hint.dataset.visible="false";hint.style.setProperty("--swipe-progress","0")}
 };

 useEffect(()=>{
  const onPop=()=>{popped.current=true;navigating.current=false;};
  window.addEventListener("popstate",onPop);
  return ()=>window.removeEventListener("popstate",onPop);
 },[]);
 useEffect(()=>{
  const stack=historyRef.current;
  if(stack.length===0){stack.push(pathname);return;}
  if(stack[stack.length-1]===pathname){popped.current=false;navigating.current=false;return;}
  if(popped.current){
   const index=stack.lastIndexOf(pathname);
   if(index>=0)stack.splice(index+1);
   else stack.splice(0,stack.length,pathname);
  }else stack.push(pathname);
  if(stack.length>40)stack.splice(0,stack.length-40);
  popped.current=false;navigating.current=false;
 },[pathname]);

 useEffect(()=>{
  const onStart=(event:TouchEvent)=>{
   started.current=null;
   hideHint();
   if(!standalone()||event.touches.length!==1||navigating.current)return;
   if(pathname==="/"||pathname==="/app"||pathname.startsWith("/admin")||pathname.startsWith("/auth/")||pathname.startsWith("/account/login")||pathname.startsWith("/account/register")||pathname.startsWith("/account/reset"))return;
   if(historyRef.current.length<2)return;
   const touch=event.touches[0];
   if(touch.clientX<RESERVED_EDGE||touch.clientX>window.innerWidth-RESERVED_EDGE)return;
   if(isInteractive(event.target instanceof Element?event.target:null))return;
   started.current={x:touch.clientX,y:touch.clientY,at:Date.now()};
  };
  const onMove=(event:TouchEvent)=>{
   const from=started.current,hint=hintRef.current;
   if(!from||!hint||event.touches.length!==1)return;
   const dx=event.touches[0].clientX-from.x,dy=event.touches[0].clientY-from.y;
   if(Math.abs(dy)>Math.max(25,Math.abs(dx)*.8)){started.current=null;hideHint();return;}
   if(dx<26){hideHint();return;}
   hint.dataset.visible="true";
   hint.style.setProperty("--swipe-progress",String(Math.min(1,Math.max(0,(dx-26)/(DISTANCE-26)))));
  };
  const onEnd=(event:TouchEvent)=>{
   const from=started.current;started.current=null;hideHint();
   if(!from||event.changedTouches.length!==1||navigating.current)return;
   const touch=event.changedTouches[0];
   const dx=touch.clientX-from.x,dy=touch.clientY-from.y;
   if(dx<DISTANCE||Math.abs(dx)<Math.abs(dy)*1.7||Date.now()-from.at>MAX_DURATION)return;
   if(historyRef.current.length<2)return;
   navigating.current=true;
   router.back();
  };
  const cancel=()=>{started.current=null;hideHint();};
  document.addEventListener("touchstart",onStart,{passive:true});
  document.addEventListener("touchmove",onMove,{passive:true});
  document.addEventListener("touchend",onEnd,{passive:true});
  document.addEventListener("touchcancel",cancel,{passive:true});
  return ()=>{
   document.removeEventListener("touchstart",onStart);
   document.removeEventListener("touchmove",onMove);
   document.removeEventListener("touchend",onEnd);
   document.removeEventListener("touchcancel",cancel);
  };
 },[pathname,router]);
 return <div ref={hintRef} className={styles.hint} data-visible="false" aria-hidden="true"><span>←</span> Back</div>;
}

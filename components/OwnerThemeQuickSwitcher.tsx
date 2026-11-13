"use client";
import {isStandaloneAccessRoute} from "@/lib/interface-route-policy";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {THEMES,isThemeId,type ThemeId} from "@/lib/theme-registry";
import {chooseThemePreference} from "@/lib/theme-runtime";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./OwnerThemeQuickSwitcher.module.css";
const SESSION_KEY="podscape-owner-theme-bubble-dismissed";

/** Mounted only for server-authenticated owners; uses the real shared theme preference. */
export function OwnerThemeQuickSwitcher(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const [dismissed,setDismissed]=useState(true);
 const [selected,setSelected]=useState<ThemeId>("light");
 const panel=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  try{setDismissed(sessionStorage.getItem(SESSION_KEY)==="1")}catch{setDismissed(false)}
  const sync=()=>{const current=document.documentElement.dataset.theme;if(isThemeId(current))setSelected(current)};
  const restore=()=>{try{sessionStorage.removeItem(SESSION_KEY)}catch{}setDismissed(false);setOpen(true)};
  sync();
  window.addEventListener("podscape-theme-change",sync);
  window.addEventListener("podscape-owner-theme-restore",restore);
  return()=>{window.removeEventListener("podscape-theme-change",sync);window.removeEventListener("podscape-owner-theme-restore",restore)};
 },[]);
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setOpen(false);trigger.current?.focus()}};
  const onPointer=(event:PointerEvent)=>{
   if(panel.current&&!panel.current.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setOpen(false);
  };
  document.addEventListener("keydown",onKey);
  document.addEventListener("pointerdown",onPointer);
  return()=>{document.removeEventListener("keydown",onKey);document.removeEventListener("pointerdown",onPointer)};
 },[open]);
 function change(theme:ThemeId){try{chooseThemePreference(theme);setSelected(theme)}catch{/* Device storage may be disabled. */}}
 function dismiss(){try{sessionStorage.setItem(SESSION_KEY,"1")}catch{}setOpen(false);setDismissed(true)}
 if(dismissed||isStandaloneAccessRoute(pathname))return null;
 return <div className={styles.root}>
  {open?<div ref={panel} id="owner-theme-selector" className={styles.panel} role="region" aria-label="Owner theme tester">
   <div className={styles.header}><strong>Owner Theme Tester</strong><button type="button" className={styles.close} onClick={()=>setOpen(false)} aria-label="Close theme selector">×</button></div>
   <p className={styles.hint}>Switch themes on this page without leaving it.</p>
   <div className={styles.options}>
    {THEMES.map(theme=><button type="button" key={theme.id} className={styles.option} aria-pressed={selected===theme.id} onClick={()=>change(theme.id)}>
     <span className={styles.swatch} style={{backgroundColor:theme.colors[0],borderColor:theme.colors[2]}}>{selected===theme.id?<span className={styles.check} aria-hidden="true">✓</span>:null}</span>
     <span>{theme.title}</span>
    </button>)}
   </div>
   <div className={styles.footer}><span role="status">Current: {THEMES.find(t=>t.id===selected)?.title}</span><button type="button" onClick={dismiss}>Dismiss bubble</button></div>
  </div>:null}
  <div className={styles.bubbleRow}>
   <button ref={trigger} type="button" className={styles.trigger} aria-label="Owner theme quick switcher" aria-expanded={open} aria-controls={open?"owner-theme-selector":undefined} onClick={()=>setOpen(v=>!v)} title="Theme tester"><PodscapeLineIcon name="creative"/><span>Theme</span></button>
   <button type="button" className={styles.dismiss} aria-label="Dismiss owner theme bubble" title="Hide until restored in Owner Studio" onClick={dismiss}>×</button>
  </div>
 </div>;
}

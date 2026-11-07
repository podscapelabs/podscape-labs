"use client";

import {useEffect,useRef,useState} from "react";
import styles from "./ShortcutWelcomeTip.module.css";

// A single first-visit walkthrough replaces the old one-screen shortcut hint.
const KEY="podscape-home-customize-tour-v1";
const steps=[
 {icon:"✧",eyebrow:"WELCOME TO YOUR HOME",title:"Make this space yours.",body:"Press and hold any section on your Homepage—your greeting, hero, shortcuts, or a widget—to enter edit mode."},
 {icon:"⠿",eyebrow:"MAKE IT YOURS",title:"Drag to rearrange.",body:"Once everything jiggles, drag a block to move it. Drag your shortcut icons to reorder them, or tap a shortcut to replace it."},
 {icon:"✓",eyebrow:"ALL SET",title:"One Done button.",body:"Tap Done when you're happy. Use Add Widget to bring in more tools, or reopen editing by pressing and holding any block."}
] as const;

export function ShortcutWelcomeTip(){
 const [step,setStep]=useState(0);
 const [visible,setVisible]=useState(false);
 const opener=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  try{if(localStorage.getItem(KEY)!=="seen")setVisible(true)}catch{}
 },[]);
 const dismiss=()=>{
  try{localStorage.setItem(KEY,"seen")}catch{}
  setVisible(false);
  opener.current?.focus();
 };
 useEffect(()=>{
  if(!visible)return;
  opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();dismiss()}
  };
  document.addEventListener("keydown",onKey);
  return ()=>document.removeEventListener("keydown",onKey);
 },[visible]);
 if(!visible)return null;
 const current=steps[step];
 return <div className={styles.scrim}>
  <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="customize-welcome-title" aria-describedby="customize-welcome-description">
   <div className={styles.tourTop}>
    <span>HOME CUSTOMIZATION</span>
    <button type="button" onClick={dismiss} aria-label="Skip Home tutorial">Skip</button>
   </div>
   <div className={styles.icon} aria-hidden="true">{current.icon}</div>
   <p className={styles.eyebrow}>{current.eyebrow}</p>
   <h2 id="customize-welcome-title">{current.title}</h2>
   <p id="customize-welcome-description">{current.body}</p>
   <div className={styles.progress} aria-label={`Step ${step+1} of ${steps.length}`}>
    {steps.map((_,i)=><span key={i} className={i===step?styles.progressActive:undefined}/>)}
   </div>
   <div className={styles.tourActions}>
    {step>0?<button type="button" className={styles.back} onClick={()=>setStep(value=>value-1)}>Back</button>:null}
    <button className={styles.done} type="button" onClick={()=>{if(step<steps.length-1){setStep(value=>value+1);return}dismiss();window.dispatchEvent(new Event("podscape-edit-home"))}} autoFocus>{step===steps.length-1?"Try customizing":"Next"}</button>
   </div>
  </section>
 </div>;
}

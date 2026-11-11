"use client";
import { useEffect, useRef, useState } from "react";
import { recordExperienceAction } from "./experience-achievements";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import { applyStarterPreferences, starterChoices, type StarterFocus, type StarterAppearance } from "./onboarding-presets";
import {THEMES} from "@/lib/theme-registry";
import {chooseThemePreference} from "@/lib/theme-runtime";
import styles from "./ShortcutWelcomeTip.module.css";

const steps:{icon:PodscapeIconName;eyebrow:string;title:string;body:string}[]=[
 {icon:"home",eyebrow:"WELCOME TO YOUR LITTLE WORLD",title:"Your hobby. Your space.",body:"One personal home for the isopod hobby. Discover species, manage colonies, explore guides, browse creations and enjoy the Fun Zone—all without learning a different site each time."},
 {icon:"search",eyebrow:"DISCOVER THE PORTALS",title:"Everything has its place.",body:"Leaf Ledger helps you identify and learn about species. Manager keeps your colonies and care tools together. Field Guide covers husbandry, while Fun Zone and PodBound are here when you want to play."},
 {icon:"edit",eyebrow:"MAKE IT YOURS",title:"A dashboard built around you.",body:"Hold a Home or Manager block to enter edit mode on mobile, or use Edit Dashboard on desktop. Add widgets, rearrange them, swap your navigation shortcuts, and reset any time. Your layout remains yours."},
 {icon:"grid",eyebrow:"YOUR SPACE, YOUR PRIORITIES",title:"Choose your starting dashboard.",body:"What brings you here? Pick a starting point, or keep your current layout. Every portal stays available and you can rearrange things anytime."},
 {icon:"creative",eyebrow:"PICK YOUR PODSCAPE PALETTE",title:"Make it feel like yours.",body:"Choose a colour theme, follow your device, or keep your current look. Your dashboard choice and your theme are independent."}
];
type Focus=StarterFocus|null;
const proofFocus:Record<StarterFocus,"default"|"discover"|"keep"|"collect"|"play">={
 balanced:"default",explorer:"discover",keeper:"keep",collector:"collect",play:"play"
};
export function ShortcutWelcomeTip({userId}:{userId:string|null}){
 const [step,setStep]=useState(0);
 const [visible,setVisible]=useState(false);
 const [skipped,setSkipped]=useState(false);
 const [focus,setFocus]=useState<Focus>(null);
 const [appearance,setAppearance]=useState<StarterAppearance>("keep");
 const [applyShortcuts,setApplyShortcuts]=useState(true);
 const [notice,setNotice]=useState("");
 const modalRef=useRef<HTMLElement|null>(null);
 const opener=useRef<HTMLElement|null>(null);
 const storageKey=userId?"podscape-onboarding-v2:"+userId:"";
 useEffect(()=>{
  if(!storageKey)return;
  try{
   const mode=new URLSearchParams(window.location.search).get("onboarding");
   setVisible(mode==="1"||localStorage.getItem(storageKey)!=="seen");
  }catch{}
 },[storageKey]);
 useEffect(()=>{
  if(!storageKey)return;
  const replay=()=>{
   setStep(0);setSkipped(false);setFocus(null);setAppearance("keep");
   setApplyShortcuts(true);setNotice("");setVisible(true);
  };
  window.addEventListener("podscape-open-onboarding",replay);
  return ()=>window.removeEventListener("podscape-open-onboarding",replay);
 },[storageKey]);
 const dismiss=()=>{
  if(storageKey)try{localStorage.setItem(storageKey,"seen")}catch{}
  setVisible(false);
  opener.current?.focus();
 };
 const skip=()=>{setSkipped(true);setStep(3);setNotice("");};
 const finish=()=>{
  // Selecting Keep current layout must never overwrite an existing widget layout.
  if(focus){
   if(!applyStarterPreferences({focus,appearance,shortcuts:applyShortcuts})){
    setNotice("The starter settings could not be saved. Your previous layout is unchanged.");
    return;
   }
  }else if(appearance!=="keep"){
   try{chooseThemePreference(appearance);}
   catch{setNotice("Your theme choice could not be saved. Try again.");return;}
  }
  if(!skipped)void recordExperienceAction("onboarding_complete",{
   steps:["welcome","portals","editing","layout","appearance"],focus:focus?proofFocus[focus]:"default"
  });
  dismiss();
 };
 useEffect(()=>{
  if(!visible)return;
  opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>modalRef.current?.querySelector<HTMLElement>("button")?.focus());
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();if(step>=3)dismiss();else skip();}
   if(event.key!=="Tab")return;
   const fields=Array.from(modalRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled])")||[]);
   if(!fields.length)return;
   const first=fields[0],last=fields[fields.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",onKey);
  return ()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",onKey);};
 },[visible,step]);
 if(!visible)return null;
 const current=steps[step];
 const selected=starterChoices.find(choice=>choice.id===focus);
 return <div className={styles.scrim}>
  <section className={styles.dialog} ref={modalRef} data-onboarding-dialog role="dialog" aria-modal="true" aria-labelledby="customize-welcome-title" aria-describedby="customize-welcome-description">
   <div className={styles.tourTop}>
    <span>WELCOME / {String(step+1).padStart(2,"0")} OF {String(steps.length).padStart(2,"0")}</span>
    <button type="button" onClick={step>=3||skipped?dismiss:skip}>{step>=3||skipped?"Close":"Skip tutorial"}</button>
   </div>
   <div className={styles.tourBody} key={step}>
   <div className={styles.icon} aria-hidden="true"><PodscapeLineIcon name={current.icon}/></div>
   <p className={styles.eyebrow}>{current.eyebrow}</p>
   <h2 id="customize-welcome-title">{current.title}</h2>
   <p id="customize-welcome-description">{current.body}</p>
   {step===0?<div className={styles.tourPreview} aria-label="Your connected PodScape portals">
    {([{icon:"leaf",label:"Discover"},{icon:"jar",label:"Manage"},{icon:"gamepad",label:"Play"}] as {icon:PodscapeIconName;label:string}[]).map(item=><span key={item.label}><PodscapeLineIcon name={item.icon}/>{item.label}</span>)}
   </div>:null}
   {step===1?<div className={styles.portalGrid} aria-label="Your available portals">
    {([{icon:"leaf",label:"Leaf Ledger",detail:"Species"},{icon:"manager",label:"Manager",detail:"Colonies"},{icon:"book",label:"Field Guide",detail:"Care"},{icon:"creative",label:"Fun Zone",detail:"Games"}] as {icon:PodscapeIconName;label:string;detail:string}[]).map(item=><div key={item.label}><PodscapeLineIcon name={item.icon}/><strong>{item.label}</strong><small>{item.detail}</small></div>)}
   </div>:null}
   {step===2?<div className={styles.editDemo}>
    <span><PodscapeLineIcon name="grip"/> Hold to arrange</span>
    <span><PodscapeLineIcon name="grid"/> Add widgets</span>
    <span><PodscapeLineIcon name="edit"/> Change shortcuts</span>
    <p>Nothing in this tutorial changes your colony records or saved species.</p>
   </div>:null}
   {step===3?<div className={styles.setup}>
    <fieldset className={styles.layoutChoices}><legend>Start with what matters to you</legend>
     <div className={styles.presetGrid}>
      <label className={styles.presetTile} data-selected={focus===null}>
       <input type="radio" name="podscape-starting-layout" checked={focus===null} onChange={()=>{setFocus(null)}}/>
       <span className={styles.presetTileIcon}><PodscapeLineIcon name="home"/></span>
       <strong>Keep current</strong>
       <small>Nothing overwritten</small>
      </label>
      {starterChoices.map(choice=><label key={choice.id} className={styles.presetTile} data-selected={focus===choice.id}>
       <input type="radio" name="podscape-starting-layout" checked={focus===choice.id} onChange={()=>{setFocus(choice.id)}}/>
       <span className={styles.presetTileIcon}><PodscapeLineIcon name={choice.icon}/></span>
       <strong>{choice.title}</strong>
       <small>{choice.id==="balanced"?"A little of everything":choice.id==="explorer"?"Species & guides":choice.id==="keeper"?"Colonies & care":choice.id==="collector"?"Wishlist & collections":"Games & EXP"}</small>
      </label>)}
     </div>
    </fieldset>
    <div className={styles.presetPreview} aria-live="polite" aria-label={selected?selected.title+" dashboard preview":"Current dashboard preview"}>
     <div className={styles.previewHeading}>
      <strong>{selected?selected.title+" dashboard":"Your current dashboard"}</strong>
      <small>{selected?"Included Home widgets":"Preserves your saved arrangement"}</small>
     </div>
     {selected?<div className={styles.previewWidgets}>{selected.preview.map(item=><span key={item.label}><PodscapeLineIcon name={item.icon}/><small>{item.label}</small></span>)}</div>:
      <div className={styles.keepPreview}><PodscapeLineIcon name="check"/><p>Everything stays the way you have it. You can still choose a new theme next.</p></div>}
     {selected?<label className={styles.presetCheckbox}><input type="checkbox" checked={applyShortcuts} onChange={e=>setApplyShortcuts(e.target.checked)}/> Use recommended navigation and Home shortcuts too</label>:null}
    </div>
    <p className={styles.setupAssurance}><PodscapeLineIcon name="lock"/> Your saved colonies, collected species and EXP are never replaced.</p>
   </div>:null}
   {step===4?<div className={styles.setup}>
    <fieldset className={styles.themeChoices}><legend>Choose your appearance</legend>
     <div className={styles.themeGrid}>
      <label className={styles.themeTile} data-selected={appearance==="keep"}>
       <input type="radio" name="podscape-starting-theme" checked={appearance==="keep"} onChange={()=>setAppearance("keep")}/>
       <span className={styles.keepThemeIcon}><PodscapeLineIcon name="check"/></span><strong>Keep current</strong><small>Keep your saved theme</small>
      </label>
      <label className={styles.themeTile} data-selected={appearance==="system"}>
       <input type="radio" name="podscape-starting-theme" checked={appearance==="system"} onChange={()=>setAppearance("system")}/>
       <span className={styles.keepThemeIcon}><PodscapeLineIcon name="creative"/></span><strong>System</strong><small>Match your device</small>
      </label>
      {THEMES.map(theme=><label key={theme.id} className={styles.themeTile} data-selected={appearance===theme.id}>
       <input type="radio" name="podscape-starting-theme" checked={appearance===theme.id} onChange={()=>setAppearance(theme.id)}/>
       <span className={styles.themeSwatch} aria-hidden="true" style={{background:theme.colors[0],borderColor:theme.colors[1]}}>
        <i style={{background:theme.colors[1]}}/><b style={{background:theme.colors[2]}}/>
       </span>
       <strong>{theme.title}</strong><small>{theme.description}</small>
      </label>)}
     </div>
    </fieldset>
    <div className={styles.themeSummary} aria-live="polite">
     <span><PodscapeLineIcon name="grid"/></span>
     <div><strong>{selected?selected.title+" starter":"Current layout"} + {appearance==="keep"?"current appearance":appearance==="system"?"system appearance":THEMES.find(t=>t.id===appearance)?.title+" theme"}</strong>
      <small>Nothing changes until you tap Start exploring. You can change these settings again in your account.</small></div>
    </div>
    {skipped?<p className={styles.skipNote}>Skipping the tour keeps your choices available, but the tutorial achievement is awarded only after completing all steps.</p>:null}
    {notice?<p className={styles.skipNote} role="alert">{notice}</p>:null}
   </div>:null}
   </div>
   <div className={styles.tourFooter}>
   <div className={styles.progress} aria-label={`Step ${step+1} of ${steps.length}`}>
    {steps.map((_,i)=><span key={i} className={i<=step?styles.progressActive:undefined}/>)}
   </div>
   <div className={styles.tourActions}>
    {step>0&&!skipped?<button type="button" className={styles.back} onClick={()=>setStep(n=>n-1)}>Back</button>:null}
    {step===steps.length-1?<button type="button" className={styles.back} onClick={dismiss}>Not now</button>:null}
    <button className={styles.done} type="button" onClick={()=>step===steps.length-1?finish():setStep(n=>n+1)}>
     {step===steps.length-1?"Start exploring":step===3?"Next: appearance":"Next"}
    </button>
   </div>
   </div>
  </section>
 </div>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import { recordExperienceAction } from "./experience-achievements";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import { applyStarterPreferences, starterChoices, type StarterFocus, type StarterAppearance } from "./onboarding-presets";
import styles from "./ShortcutWelcomeTip.module.css";

const steps:{icon:PodscapeIconName;eyebrow:string;title:string;body:string}[]=[
 {icon:"home",eyebrow:"WELCOME TO YOUR LITTLE WORLD",title:"Your hobby. Your space.",body:"One personal home for the isopod hobby. Discover species, manage colonies, explore guides, browse creations and enjoy the Fun Zone—all without learning a different site each time."},
 {icon:"search",eyebrow:"DISCOVER THE PORTALS",title:"Everything has its place.",body:"Leaf Ledger helps you identify and learn about species. Manager keeps your colonies and care tools together. Field Guide covers husbandry, while Fun Zone and PodBound are here when you want to play."},
 {icon:"edit",eyebrow:"MAKE IT YOURS",title:"A dashboard built around you.",body:"Hold a Home or Manager block to enter edit mode on mobile, or use Edit Dashboard on desktop. Add widgets, rearrange them, swap your navigation shortcuts, and reset any time. Your layout remains yours."},
 {icon:"grid",eyebrow:"SET UP YOUR STARTING SPACE",title:"What brings you to PodScape?",body:"Pick a dashboard that matches your hobby—or keep the current one. These settings are just a starting point. Every portal stays available and you can customize again whenever you like."}
];
type Focus=StarterFocus|null;
const proofFocus:Record<StarterFocus,"default"|"discover"|"keep"|"collect"|"play">={
 balanced:"default",explorer:"discover",keeper:"keep",collector:"collect",play:"play"
};
export function ShortcutWelcomeTip({userId,ownerPreview=false}:{userId:string|null;ownerPreview?:boolean}){
 const [step,setStep]=useState(0);
 const [visible,setVisible]=useState(false);
 const [previewMode,setPreviewMode]=useState(false);
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
   const preview=ownerPreview&&mode==="preview";
   setPreviewMode(preview);
   setVisible(preview||mode==="1"||localStorage.getItem(storageKey)!=="seen");
  }catch{}
 },[storageKey,ownerPreview]);
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
  if(!previewMode&&storageKey)try{localStorage.setItem(storageKey,"seen")}catch{}
  setVisible(false);
  opener.current?.focus();
 };
 const skip=()=>{setSkipped(true);setStep(steps.length-1);setNotice("");};
 const finish=()=>{
  // Owner preview is read-only: never save a layout, theme, completion flag, or achievement.
  if(previewMode){dismiss();return;}
  // Existing saved dashboards are never touched unless the user selects a preset.
  if(focus){
   if(!applyStarterPreferences({focus,appearance,shortcuts:applyShortcuts})){
    setNotice("These preferences could not be saved on this device. Your previous dashboard is unchanged.");
    return;
   }
  }else if(appearance!=="keep"){
   // Appearance alone is a deliberate preference even without choosing a layout.
   try{
    if(appearance==="system")localStorage.removeItem("podscape-theme");
    else localStorage.setItem("podscape-theme",appearance);
    const theme=appearance==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):appearance;
    document.documentElement.dataset.theme=theme;
    document.documentElement.dataset.themePreference=appearance;
    document.documentElement.style.colorScheme=theme;
    window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
   }catch{setNotice("The appearance preference could not be saved.");return;}
  }
  if(!skipped)void recordExperienceAction("onboarding_complete",{
   steps:["welcome","portals","editing","layout"],focus:focus?proofFocus[focus]:"default"
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
   if(event.key==="Escape"){event.preventDefault();skip();}
   if(event.key!=="Tab")return;
   const fields=Array.from(modalRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled])")||[]);
   if(!fields.length)return;
   const first=fields[0],last=fields[fields.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",onKey);
  return ()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",onKey);};
 },[visible]);
 if(!visible)return null;
 const current=steps[step];
 const selected=starterChoices.find(choice=>choice.id===focus);
 return <div className={styles.scrim}>
  <section className={styles.dialog} ref={modalRef} data-onboarding-dialog role="dialog" aria-modal="true" aria-labelledby="customize-welcome-title" aria-describedby="customize-welcome-description">
   <div className={styles.tourTop}>
    <span>{previewMode?"OWNER PREVIEW":"WELCOME"} / {String(step+1).padStart(2,"0")} OF {String(steps.length).padStart(2,"0")}</span>
    <button type="button" onClick={previewMode?dismiss:skip} disabled={!previewMode&&skipped&&step===steps.length-1}>{previewMode?"Close preview":"Skip tutorial"}</button>
   </div>
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
   {step===steps.length-1?<div className={styles.setup}>
    <fieldset className={styles.layoutChoices}><legend>Choose a starting dashboard</legend>
     <label className={styles.layoutChoice} data-selected={focus===null}>
      <input type="radio" name="podscape-starting-layout" checked={focus===null} onChange={()=>setFocus(null)}/>
      <span><strong>Keep my current layout</strong><small>No widgets or shortcuts will be overwritten</small></span>
     </label>
     {starterChoices.map(choice=><label key={choice.id} className={styles.layoutChoice} data-selected={focus===choice.id}>
      <input type="radio" name="podscape-starting-layout" value={choice.id} checked={focus===choice.id} onChange={()=>setFocus(choice.id)}/>
      <span className={styles.choiceGlyph}><PodscapeLineIcon name={choice.icon}/></span>
      <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
     </label>)}
    </fieldset>
    {selected?<div className={styles.presetPreview} aria-label={selected.title+" dashboard preview"}>
     <div className={styles.previewHeading}><strong>{selected.title} starter dashboard</strong><small>Widgets you&apos;ll see first</small></div>
     <div className={styles.previewWidgets}>{selected.preview.map(item=><span key={item.label}><PodscapeLineIcon name={item.icon}/><small>{item.label}</small></span>)}</div>
     <label className={styles.presetCheckbox}><input type="checkbox" checked={applyShortcuts} onChange={e=>setApplyShortcuts(e.target.checked)}/> Also set recommended Home and bottom-nav shortcuts</label>
     <p>Applying this preset replaces only your visible Home widgets and, if selected, navigation shortcuts. Your colony data and saved favorites remain untouched.</p>
    </div>:null}
    <label className={styles.appearanceLabel}>Appearance
     <select value={appearance} onChange={e=>setAppearance(e.target.value as StarterAppearance)}>
      <option value="keep">Keep my current appearance</option><option value="system">Follow device settings</option>
      <option value="light">Light</option><option value="dark">Dark</option>
     </select>
    </label>
    {skipped?<p className={styles.skipNote}>You can choose a layout without completing the tour. The tutorial achievement is awarded only after all four steps.</p>:null}
    {notice?<p className={styles.skipNote} role="alert">{notice}</p>:null}
    {previewMode?<p className={styles.skipNote} role="status">Preview only — your current dashboard, shortcuts, appearance, and achievements will not change.</p>:null}
   </div>:null}
   <div className={styles.progress} aria-label={`Step ${step+1} of ${steps.length}`}>
    {steps.map((_,i)=><span key={i} className={i<=step?styles.progressActive:undefined}/>)}
   </div>
   <div className={styles.tourActions}>
    {step>0&&!skipped?<button type="button" className={styles.back} onClick={()=>setStep(n=>n-1)}>Back</button>:null}
    {step===steps.length-1?<button type="button" className={styles.back} onClick={dismiss}>Not now</button>:null}
    <button className={styles.done} type="button" onClick={()=>step===steps.length-1?finish():setStep(n=>n+1)}>
     {step===steps.length-1?(previewMode?"Close preview":focus?"Apply & explore":"Start exploring"):"Next"}
    </button>
   </div>
  </section>
 </div>;
}

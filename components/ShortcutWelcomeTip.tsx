"use client";
import {useEffect,useRef,useState} from "react";
import {recordExperienceAction} from "./experience-achievements";
import styles from "./ShortcutWelcomeTip.module.css";
import {PodscapeLineIcon, type PodscapeIconName} from "./PodscapeLineIcon";

const steps: {icon:PodscapeIconName;eyebrow:string;title:string;body:string}[]=[
 {icon:"home",eyebrow:"WELCOME TO PODSCAPE",title:"Your hobby. Your space.",body:"PodScape brings species discovery, colony management, shopping, guides and original games together in one personal space."},
 {icon:"search",eyebrow:"EXPLORE YOUR PORTALS",title:"Everything has its place.",body:"Leaf Ledger is for discovering species, Manager is for keeping colonies, Shop is for products, and Fun Zone is for puzzles. Your shortcuts take you directly to each portal."},
 {icon:"edit",eyebrow:"MAKE IT YOURS",title:"Arrange it your way.",body:"On mobile, press and hold a section to customize. On desktop, choose Edit Dashboard. Reorder blocks, add widgets, and change your shortcuts whenever you like."},
 {icon:"grid",eyebrow:"YOUR STARTING LAYOUT",title:"What's your PodScape focus?",body:"Choose the widgets you want to see first. This only changes your dashboard; every portal and tool remains available."}
] as const;
type Focus="default"|"discover"|"keep"|"collect"|"play";
const choices:{id:Focus;title:string;description:string;visible:string[]}[]=[
 {id:"default",title:"Balanced",description:"Start with the familiar Home",visible:["recent"]},
 {id:"discover",title:"Explorer",description:"Species, guides and discoveries",visible:["recent","guides","pins"]},
 {id:"keep",title:"Keeper",description:"Colonies, care and progress",visible:["colony","schedule","progress","recent"]},
 {id:"collect",title:"Collector",description:"Your favourites and colonies",visible:["pins","colony","recent"]},
 {id:"play",title:"Puzzle Lover",description:"Games, progress and what's new",visible:["games","progress","recent"]}
];
const order=["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins"];
function applyFocus(focus:Focus){
 if(focus==="default")return; // Don't replace an existing layout unless a preset is chosen.
 const choice=choices.find(option=>option.id===focus);
 if(!choice)return;
 try{
  const raw=JSON.parse(localStorage.getItem("podscape-home-widgets-v2")||"null");
  const current=raw&&Array.isArray(raw.order)&&raw.order.length===order.length?raw.order:order;
  const sorted=[...new Set([...current,...order])].filter(id=>order.includes(id));
  localStorage.setItem("podscape-home-widgets-v2",JSON.stringify({order:sorted,visible:choice.visible}));
  window.dispatchEvent(new Event("podscape-home-widgets-changed"));
 }catch{}
}
export function ShortcutWelcomeTip({userId}:{userId:string|null}){
 const [step,setStep]=useState(0);
 const [visible,setVisible]=useState(false);
 const [skipped,setSkipped]=useState(false);
 const [focus,setFocus]=useState<Focus>("default");
 const opener=useRef<HTMLElement|null>(null);
 const storageKey=userId?"podscape-onboarding-v2:"+userId:"";
 useEffect(()=>{
  if(!storageKey)return;
  try{setVisible(localStorage.getItem(storageKey)!=="seen")}catch{}
 },[storageKey]);
 const dismiss=()=>{
  if(storageKey)try{localStorage.setItem(storageKey,"seen")}catch{}
  setVisible(false);opener.current?.focus();
 };
 const skip=()=>{setSkipped(true);setStep(steps.length-1)};
 const finish=()=>{
  applyFocus(focus);
  if(!skipped)void recordExperienceAction("onboarding_complete",{
   steps:["welcome","portals","editing","layout"],focus
  });
  dismiss();
 };
 useEffect(()=>{
  if(!visible)return;
  opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();skip()}
   if(event.key==="Tab"){
    const buttons=Array.from(document.querySelectorAll<HTMLElement>("[data-onboarding-dialog] button:not([disabled]),[data-onboarding-dialog] input:not([disabled])"));
    if(!buttons.length)return;
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  };
  document.addEventListener("keydown",onKey);
  return ()=>document.removeEventListener("keydown",onKey);
 },[visible]);
 if(!visible)return null;
 const current=steps[step];
 return <div className={styles.scrim}>
  <section className={styles.dialog} data-onboarding-dialog role="dialog" aria-modal="true" aria-labelledby="customize-welcome-title" aria-describedby="customize-welcome-description">
   <div className={styles.tourTop}>
    <span>PODSCAPE / FIRST VISIT</span>
    <button type="button" onClick={skip} disabled={skipped&&step===steps.length-1}>Skip tutorial</button>
   </div>
   <div className={styles.icon} aria-hidden="true"><PodscapeLineIcon name={current.icon}/></div>
   <p className={styles.eyebrow}>{current.eyebrow}</p>
   <h2 id="customize-welcome-title">{current.title}</h2>
   <p id="customize-welcome-description">{current.body}</p>
   {step===steps.length-1?<fieldset className={styles.layoutChoices}><legend>Choose a starting layout</legend>
    {choices.map(choice=><label key={choice.id} className={styles.layoutChoice} data-selected={focus===choice.id}>
      <input type="radio" name="podscape-starting-layout" value={choice.id} checked={focus===choice.id} onChange={()=>setFocus(choice.id)}/>
      <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
    </label>)}
    {skipped?<p className={styles.skipNote}>You can choose a layout without completing the tutorial. The welcome achievement is reserved for finishing all four steps.</p>:null}
   </fieldset>:null}
   <div className={styles.progress} aria-label={`Step ${step+1} of ${steps.length}`}>
    {steps.map((_,i)=><span key={i} className={i===step?styles.progressActive:undefined}/>)}
   </div>
   <div className={styles.tourActions}>
    {step>0&&!skipped?<button type="button" className={styles.back} onClick={()=>setStep(n=>n-1)}>Back</button>:null}
    <button className={styles.done} type="button" onClick={()=>step===steps.length-1?finish():setStep(n=>n+1)} autoFocus>
     {step===steps.length-1?skipped?"Use this layout":"Finish & explore":"Next"}
    </button>
   </div>
  </section>
 </div>;
}

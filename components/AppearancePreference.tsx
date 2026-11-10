"use client";
import {useEffect,useState} from "react";
import styles from "./AppearancePreference.module.css";

type Appearance="light"|"dark"|"woodland"|"system";
const KEY="podscape-theme";
function isAppearance(value:string|null):value is Appearance{
 return value==="light"||value==="dark"||value==="woodland"||value==="system";
}
function resolve(mode:Appearance):"light"|"dark"|"woodland"{
 return mode==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):mode;
}
function apply(mode:Appearance){
 const theme=resolve(mode);
 document.documentElement.dataset.theme=theme;
 document.documentElement.dataset.themePreference=mode;
 document.documentElement.style.colorScheme=theme==="light"?"light":"dark";
 window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
}
const options=[
 {id:"light",title:"Light",description:"Warm parchment",colors:["#EEE8D8","#F8F4E8","#173D2B"]},
 {id:"dark",title:"Dark",description:"Deep forest",colors:["#12231A","#172B20","#B8C88F"]},
 {id:"woodland",title:"Woodland",description:"Cocoa & chestnut",colors:["#211A16","#30251F","#D6AC76"]},
 {id:"system",title:"System",description:"Match your device",colors:["#EEE8D8","#172B20","#B8C88F"]}
] as const;
export function AppearancePreference(){
 const [mode,setMode]=useState<Appearance>("system");
 useEffect(()=>{
  const stored=localStorage.getItem(KEY);
  const initial:Appearance=isAppearance(stored)?stored:"system";
  setMode(initial);apply(initial);
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const sync=()=>{if(!localStorage.getItem(KEY)||localStorage.getItem(KEY)==="system")apply("system");};
  const onChange=()=>{const saved=localStorage.getItem(KEY);setMode(isAppearance(saved)?saved:"system");};
  media.addEventListener("change",sync);
  window.addEventListener("podscape-theme-change",onChange);
  return ()=>{media.removeEventListener("change",sync);window.removeEventListener("podscape-theme-change",onChange);};
 },[]);
 function choose(next:Appearance){
  if(next==="system")localStorage.removeItem(KEY);
  else localStorage.setItem(KEY,next);
  setMode(next);apply(next);
 }
 return <div className={styles.wrapper}>
  <p className={styles.heading}>Appearance</p>
  <div className={styles.choices} role="group" aria-label="Appearance preference">
   {options.map(option=><button type="button" key={option.id} aria-pressed={mode===option.id} className={mode===option.id?styles.active:styles.choice} onClick={()=>choose(option.id)}>
    <span className={styles.swatches} aria-hidden="true">{option.colors.map((color,i)=><span key={i} style={{backgroundColor:color}}/>)}</span>
    <strong>{option.title}</strong>
    <small>{option.description}</small>
   </button>)}
  </div>
  <p className={styles.help}>Your theme applies throughout PodScape on this device. System follows your device appearance.</p>
 </div>;
}

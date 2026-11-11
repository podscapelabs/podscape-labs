"use client";
import {useEffect,useState} from "react";
import styles from "./AppearancePreference.module.css";
import {THEMES,SYSTEM_OPTION,THEME_STORAGE_KEY,type ThemePreference} from "@/lib/theme-registry";
import {applyThemePreference,storedThemePreference,chooseThemePreference} from "@/lib/theme-runtime";

const options=[...THEMES,SYSTEM_OPTION];
export function AppearancePreference(){
 const [mode,setMode]=useState<ThemePreference>("system");
 useEffect(()=>{
  const initial=storedThemePreference();
  setMode(initial);applyThemePreference(initial);
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const sync=()=>{if(!localStorage.getItem(THEME_STORAGE_KEY)||localStorage.getItem(THEME_STORAGE_KEY)==="system")applyThemePreference("system");};
  const onChange=()=>setMode(storedThemePreference());
  media.addEventListener("change",sync);
  window.addEventListener("podscape-theme-change",onChange);
  return ()=>{media.removeEventListener("change",sync);window.removeEventListener("podscape-theme-change",onChange);};
 },[]);
 function choose(next:ThemePreference){
  setMode(next);chooseThemePreference(next);
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

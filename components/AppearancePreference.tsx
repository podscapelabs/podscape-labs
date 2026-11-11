"use client";
import {useEffect,useState} from "react";
import styles from "./AppearancePreference.module.css";
import {THEMES,SYSTEM_OPTION,THEME_STORAGE_KEY,isThemePreference,resolveTheme,themeColorScheme,type ThemePreference} from "@/lib/theme-registry";

function apply(mode:ThemePreference){
 const theme=resolveTheme(mode,window.matchMedia("(prefers-color-scheme: dark)").matches);
 document.documentElement.dataset.theme=theme;
 document.documentElement.dataset.themePreference=mode;
 document.documentElement.style.colorScheme=themeColorScheme(theme);
 window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
}
const options=[...THEMES,SYSTEM_OPTION];
export function AppearancePreference(){
 const [mode,setMode]=useState<ThemePreference>("system");
 useEffect(()=>{
  const stored=localStorage.getItem(THEME_STORAGE_KEY);
  const initial:ThemePreference=isThemePreference(stored)?stored:"system";
  setMode(initial);apply(initial);
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const sync=()=>{if(!localStorage.getItem(THEME_STORAGE_KEY)||localStorage.getItem(THEME_STORAGE_KEY)==="system")apply("system");};
  const onChange=()=>{const saved=localStorage.getItem(THEME_STORAGE_KEY);setMode(isThemePreference(saved)?saved:"system");};
  media.addEventListener("change",sync);
  window.addEventListener("podscape-theme-change",onChange);
  return ()=>{media.removeEventListener("change",sync);window.removeEventListener("podscape-theme-change",onChange);};
 },[]);
 function choose(next:ThemePreference){
  if(next==="system")localStorage.removeItem(THEME_STORAGE_KEY);
  else localStorage.setItem(THEME_STORAGE_KEY,next);
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

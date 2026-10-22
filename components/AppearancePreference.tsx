"use client";
import { useEffect, useState } from "react";
import styles from "./AppearancePreference.module.css";

type Appearance = "light" | "dark" | "system";
const KEY = "podscape-theme";
function resolve(mode:Appearance):"light"|"dark" {
  return mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
}
function apply(mode:Appearance) {
  const theme = resolve(mode);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.dataset.themePreference = mode;
  window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
}
export function AppearancePreference(){
  const [mode,setMode]=useState<Appearance>("system");
  useEffect(()=>{
    const stored=localStorage.getItem(KEY);
    const initial:Appearance=stored==="light"||stored==="dark"?stored:"system";
    setMode(initial);apply(initial);
    const media=window.matchMedia("(prefers-color-scheme: dark)");
    const sync=()=>{if(localStorage.getItem(KEY)!=="light"&&localStorage.getItem(KEY)!=="dark")apply("system");};
    media.addEventListener("change",sync);
    return ()=>media.removeEventListener("change",sync);
  },[]);
  function choose(next:Appearance){
    if(next==="system")localStorage.removeItem(KEY);
    else localStorage.setItem(KEY,next);
    setMode(next);apply(next);
  }
  return <div className={styles.wrapper}><p className={styles.heading}>Appearance</p><div className={styles.choices} role="group" aria-label="Appearance preference">{(["light","dark","system"] as const).map(option=><button type="button" key={option} aria-pressed={mode===option} className={mode===option?styles.active:styles.choice} onClick={()=>choose(option)}>{option==="light"?"☀ Light":option==="dark"?"☾ Dark":"◐ System"}</button>)}</div><p className={styles.help}>Your choice applies across PodScape on this device. System follows your iPhone appearance.</p></div>;
}

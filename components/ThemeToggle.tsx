"use client";

import {useEffect,useState} from "react";
import {MoonIcon,SunIcon} from "./Icons";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {THEMES,THEME_IDS,isThemeId,type ThemeId,type ThemePreference} from "@/lib/theme-registry";
import {chooseThemePreference,storedThemePreference} from "@/lib/theme-runtime";

export function ThemeToggle(){
 const [theme,setTheme]=useState<ThemeId|null>(null);
 const [preference,setPreference]=useState<ThemePreference>("system");

 useEffect(()=>{
  const sync=()=>{
   setPreference(storedThemePreference());
   const current=document.documentElement.dataset.theme;
   setTheme(isThemeId(current)?current:"light");
  };
  sync();
  window.addEventListener("podscape-theme-change",sync);
  return()=>window.removeEventListener("podscape-theme-change",sync);
 },[]);

 function toggleTheme(){
  const current=theme||"light";
  const next=THEME_IDS[(THEME_IDS.indexOf(current)+1)%THEME_IDS.length];
  chooseThemePreference(next);
  setTheme(next);
  setPreference(next);
 }
 const next=THEME_IDS[(THEME_IDS.indexOf(theme||"light")+1)%THEME_IDS.length];
 const currentName=THEMES.find(t=>t.id===(theme||"light"))?.title||"Light";
 const nextName=THEMES.find(t=>t.id===next)?.title||"Light";
 const glyph=THEMES.find(t=>t.id===(theme||"light"))?.glyph||"sun";
 const icon=glyph==="moon"?<MoonIcon/>:glyph==="leaf"?<PodscapeLineIcon name="leaf"/>:glyph==="creative"?<PodscapeLineIcon name="creative"/>:<SunIcon/>;
 return <button className="theme-toggle" type="button" onClick={toggleTheme}
  aria-label={`${preference==="system"?"Following device appearance. ":""}Switch to ${nextName} theme`}
  title={`Current: ${currentName} · Switch to ${nextName}`}>
  <span className="theme-icon">{icon}</span>
 </button>;
}

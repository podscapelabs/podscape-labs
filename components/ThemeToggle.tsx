"use client";

import {useEffect,useState} from "react";
import {MoonIcon,SunIcon} from "./Icons";
import {PodscapeLineIcon} from "./PodscapeLineIcon";

type Theme="light"|"dark"|"woodland";
type ThemePreference=Theme|"system";
const order:Theme[]=["light","dark","woodland"];
const names:Record<Theme,string>={light:"Light",dark:"Dark",woodland:"Woodland"};

export function ThemeToggle(){
 const [theme,setTheme]=useState<Theme|null>(null);
 const [preference,setPreference]=useState<ThemePreference>("system");

 useEffect(()=>{
  const sync=()=>{
   const saved=localStorage.getItem("podscape-theme");
   setPreference(saved==="light"||saved==="dark"||saved==="woodland"?saved:"system");
   const current=document.documentElement.dataset.theme;
   setTheme(current==="dark"||current==="woodland"?current:"light");
  };
  sync();
  window.addEventListener("podscape-theme-change",sync);
  return()=>window.removeEventListener("podscape-theme-change",sync);
 },[]);

 function toggleTheme(){
  const current=theme||"light";
  const next=order[(order.indexOf(current)+1)%order.length];
  document.documentElement.dataset.theme=next;
  document.documentElement.dataset.themePreference=next;
  document.documentElement.style.colorScheme=next==="light"?"light":"dark";
  localStorage.setItem("podscape-theme",next);
  setTheme(next);
  setPreference(next);
  window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:next}));
 }
 const next=order[(order.indexOf(theme||"light")+1)%order.length];
 return <button className="theme-toggle" type="button" onClick={toggleTheme}
  aria-label={`${preference==="system"?"Following device appearance. ":""}Switch to ${names[next]} theme`}
  title={`Current: ${names[theme||"light"]} · Switch to ${names[next]}`}>
   <span className="theme-icon theme-icon-sun"><SunIcon/></span>
   <span className="theme-icon theme-icon-moon"><MoonIcon/></span>
   <span className="theme-icon theme-icon-woodland"><PodscapeLineIcon name="leaf"/></span>
 </button>;
}

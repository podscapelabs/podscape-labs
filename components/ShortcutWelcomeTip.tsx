"use client";

import {useEffect,useState} from "react";
import styles from "./ShortcutWelcomeTip.module.css";

const KEY="podscape-shortcut-intro-v1";
export function ShortcutWelcomeTip(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
   try{if(localStorage.getItem(KEY)!=="seen")setVisible(true)}catch{}
 },[]);
 const dismiss=()=>{
   try{localStorage.setItem(KEY,"seen")}catch{}
   setVisible(false);
 };
 useEffect(()=>{
   if(!visible)return;
   const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")dismiss()};
   document.addEventListener("keydown",onKey);
   return ()=>document.removeEventListener("keydown",onKey);
 },[visible]);
 if(!visible)return null;
 return <div className={styles.scrim}>
  <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="customize-welcome-title" aria-describedby="customize-welcome-description">
   <div className={styles.icon} aria-hidden="true">✧</div>
   <p className={styles.eyebrow}>WELCOME TO YOUR PODSCAPE</p>
   <h2 id="customize-welcome-title">Make this little world yours.</h2>
   <p id="customize-welcome-description">Press and hold a homepage shortcut or bottom toolbar icon until it wiggles. Then drag to rearrange, tap an icon to swap it, and press Done when you&apos;re happy.</p>
   <p className={styles.note}>Spotlight and other essential sections stay right where they belong.</p>
   <button className={styles.done} type="button" onClick={dismiss} autoFocus>Got it, let&apos;s explore!</button>
  </section>
 </div>;
}

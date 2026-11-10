"use client";

import {useEffect,useState} from "react";
import styles from "./InstallPodscape.module.css";
import {PodscapeLineIcon} from "./PodscapeLineIcon";

type Browser="ios-safari"|"ios-other"|"android"|"desktop";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
const DISMISS_KEY="podscape-install-tip-dismissed-v1";

function isStandalone(){
 return window.matchMedia("(display-mode: standalone)").matches ||
   (navigator as Navigator & {standalone?:boolean}).standalone===true;
}
function getBrowser():Browser{
 const ua=navigator.userAgent;
 if(/iPad|iPhone|iPod/i.test(ua))return /Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua)?"ios-safari":"ios-other";
 if(/Android/i.test(ua))return "android";
 return "desktop";
}
function Guidance({browser}:{browser:Browser}){
 if(browser==="ios-safari")return <ol><li>Tap the <strong>Share</strong> button in Safari (the square with an upward arrow).</li><li>Scroll down and tap <strong>Add to Home Screen</strong>. If it is hidden, find it under <strong>Edit Actions</strong>.</li><li>Tap <strong>Add</strong>. Launch PodScape from its new icon.</li></ol>;
 if(browser==="ios-other")return <ol><li>Open <strong>podscapelabs.com/app</strong> in Safari for the most consistent experience.</li><li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> to place PodScape on your Home Screen.</li></ol>;
 if(browser==="android")return <ol><li>Open PodScape in Chrome.</li><li>Tap the browser menu <strong>⋮</strong>.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li></ol>;
 return <p className={styles.help}>In a supported desktop browser, look for an <strong>Install</strong> option in the address bar or browser menu.</p>;
}
export function InstallPodscape({variant="banner"}:{variant?:"banner"|"settings"}){
 const [ready,setReady]=useState(false);
 const [installed,setInstalled]=useState(false);
 const [browser,setBrowser]=useState<Browser>("desktop");
 const [expanded,setExpanded]=useState(variant==="settings");
 const [dismissed,setDismissed]=useState(false);
 const [installPrompt,setInstallPrompt]=useState<InstallEvent|null>(null);
 useEffect(()=>{
  setInstalled(isStandalone());
  setBrowser(getBrowser());
  try{setDismissed(localStorage.getItem(DISMISS_KEY)==="yes")}catch{}
  setReady(true);
  const onPrompt=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallEvent)};
  const onInstalled=()=>{setInstalled(true);setInstallPrompt(null)};
  window.addEventListener("beforeinstallprompt",onPrompt);
  window.addEventListener("appinstalled",onInstalled);
  return ()=>{window.removeEventListener("beforeinstallprompt",onPrompt);window.removeEventListener("appinstalled",onInstalled)};
 },[]);
 if(!ready||installed)return null;
 if(variant==="banner"&&(dismissed||browser==="desktop"))return null;
 const dismiss=()=>{setDismissed(true);try{localStorage.setItem(DISMISS_KEY,"yes")}catch{}};
 const install=async()=>{
  if(!installPrompt){setExpanded(true);return}
  try{await installPrompt.prompt();const result=await installPrompt.userChoice;if(result.outcome==="accepted")setInstallPrompt(null);else setExpanded(true)}catch{setExpanded(true)}
 };
 return <section className={variant==="banner"?styles.banner:styles.settings} aria-label="Install PodScape">
  <span className={styles.mark} aria-hidden="true"><PodscapeLineIcon name="home"/></span>
  <div className={styles.body}>
   <strong>{variant==="banner"?"Make PodScape an app":"Add PodScape to your Home Screen"}</strong>
   <p>{variant==="banner"?"One tap from your Home Screen, without opening the browser first.":"Keep PodScape a tap away on your phone or supported computer."}</p>
   {expanded&&<div className={styles.instructions}><Guidance browser={browser}/></div>}
   <div className={styles.actions}>
    {installPrompt?<button type="button" className={styles.primary} onClick={install}>Install PodScape</button>:
     <button type="button" className={styles.primary} onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>{expanded?"Hide steps":"How to add it"}</button>}
    {variant==="banner"&&<button type="button" className={styles.quiet} onClick={dismiss}>Not now</button>}
   </div>
  </div>
  {variant==="banner"&&<button className={styles.close} type="button" onClick={dismiss} aria-label="Dismiss install suggestion">×</button>}
 </section>;
}

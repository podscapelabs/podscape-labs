"use client";
import {useEffect,useState} from "react";
import {pinKey,readHomePins,toggleHomePin,type HomePin} from "./home-pins";
import styles from "./PinToHome.module.css";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
export function PinToHome({pin,userId}:{pin:HomePin;userId:string|null}){
 const [added,setAdded]=useState(false);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const refresh=()=>{setAdded(readHomePins(userId).some(p=>pinKey(p)===pinKey(pin)));setReady(true)};
  refresh();
  window.addEventListener("storage",refresh);
  window.addEventListener("podscape-home-pins-changed",refresh);
  return ()=>{window.removeEventListener("storage",refresh);window.removeEventListener("podscape-home-pins-changed",refresh)};
 },[pin.kind,pin.id,userId]);
 return <button type="button" className={styles.button} disabled={!ready} aria-pressed={added} onClick={()=>setAdded(toggleHomePin(userId,pin))}>
   <span aria-hidden="true"><PodscapeLineIcon name={added?"check":"bookmark"} /></span>{added?"Added to Home · Remove":"Add to Home"}
 </button>;
}

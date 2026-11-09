"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {availableNavigationChoices,navigationGroups,type NavChoice} from "@/components/navigation-customization";
import styles from "@/components/MarketingHome.module.css";
import pins from "./menu-pins.module.css";

const storageKey="podscape-menu-pinned-v1";
function readPins(allowedIds:Set<string>):string[]{
 try {
  const saved=JSON.parse(localStorage.getItem(storageKey)||"[]");
  return Array.isArray(saved)?[...new Set(saved.filter((id):id is string=>typeof id==="string"&&allowedIds.has(id)))].slice(0,12):[];
 }catch{return []}
}
function MenuItem({item,pinned,onToggle}:{item:NavChoice;pinned:boolean;onToggle:()=>void}){
 return <div className={pins.item}>
  <Link className={pins.destination} href={item.href}>
   <i><PodscapeLineIcon name={item.icon}/></i>
   <span><strong>{item.label}{item.planned?<em className={styles.menuPlanned}>Planned</em>:null}</strong><small>{item.description}</small></span>
   <b aria-hidden="true">›</b>
  </Link>
  {!item.planned?<button type="button" className={pins.pinButton} onClick={onToggle} aria-pressed={pinned} aria-label={pinned?`Unpin ${item.label} from top`:`Pin ${item.label} to top`} title={pinned?"Unpin from top":"Pin to top"}>
   <svg viewBox="0 0 24 24" fill={pinned?"currentColor":"none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 3 6 0-1 5 4 4v2H6v-2l4-4-1-5Z"/><path d="M12 14v7"/></svg>
  </button>:null}
 </div>;
}
export function MenuPinnedDirectory({isOwner=false}:{isOwner?:boolean}){
 const visibleChoices=useMemo(()=>availableNavigationChoices(isOwner),[isOwner]);
 const available=useMemo(()=>visibleChoices.filter(item=>item.id!=="menu"&&!item.planned),[visibleChoices]);
 const allowedIds=useMemo(()=>new Set(available.map(item=>item.id)),[available]);
 const [ids,setIds]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const sync=()=>setIds(readPins(allowedIds));
  sync();setReady(true);
  window.addEventListener("storage",sync);
  return ()=>window.removeEventListener("storage",sync);
 },[allowedIds]);
 const toggle=(id:string)=>{
  const next=ids.includes(id)?ids.filter(value=>value!==id):[...ids,id].slice(0,12);
  setIds(next);
  try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}
 };
 const pinned=ids.map(id=>available.find(item=>item.id===id)).filter((item):item is NavChoice=>Boolean(item));
 return <>
  {ready&&pinned.length?<section className={styles.menuGroup} aria-label="Pinned destinations">
   <div className={pins.groupHeading}><h2>Pinned to top</h2><span>{pinned.length} of 12</span></div>
   <nav className={pins.list} aria-label="Your pinned destinations">{pinned.map(item=><MenuItem key={item.id} item={item} pinned onToggle={()=>toggle(item.id)}/>)}</nav>
  </section>:null}
  {navigationGroups.map(group=>{
   const choices=visibleChoices.filter(item=>item.group===group&&item.id!=="menu");
   if(!choices.length)return null;
   return <section key={group} className={styles.menuGroup} aria-label={group}>
    <h2>{group}</h2>
    <nav className={pins.list} aria-label={group+" destinations"}>
     {choices.map(item=><MenuItem key={item.id} item={item} pinned={ids.includes(item.id)} onToggle={()=>toggle(item.id)}/>)}
    </nav>
   </section>;
  })}
 </>;
}

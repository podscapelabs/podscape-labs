"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createPortal} from "react-dom";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {updateCategoryById,type UpdateCategory} from "@/data/update-categories";
import styles from "./PodscapeHome.module.css";
import detailStyles from "./UpdateDetailDialog.module.css";

export type RecentCategory=UpdateCategory;
export type RecentItem={title:string;description:string;href:string;details?:string[]};
export type RecentGroup={
 category:RecentCategory;
 newestAt:string;
 items:RecentItem[];
};

function UpdateDetailDialog({item,category,onClose}:{item:RecentItem;category:RecentCategory;onClose:()=>void}){
 const closeRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  closeRef.current?.focus();
  function onKeyDown(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();onClose();return;}
   if(event.key!=="Tab"||!dialogRef.current)return;
   const controls=Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]'));
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  document.addEventListener("keydown",onKeyDown);
  return ()=>{document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",onKeyDown);};
 },[onClose]);
 const details=item.details||[];
 return <div className={detailStyles.backdrop} onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
   <div className={detailStyles.dialog} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="podscape-update-title" aria-describedby="podscape-update-description">
    <div className={detailStyles.top}>
     <span className={detailStyles.category}><PodscapeLineIcon name={updateCategoryById[category].icon}/>{updateCategoryById[category].label}</span>
     <button ref={closeRef} type="button" className={detailStyles.close} aria-label="Close update details" onClick={onClose}><PodscapeLineIcon name="close"/></button>
    </div>
    <h2 id="podscape-update-title">{item.title}</h2>
    <p id="podscape-update-description" className={detailStyles.intro}>{item.description}</p>
    {details.length>0?<section aria-label="Changes in this update" className={detailStyles.changes}>
      <h3>What&apos;s changed</h3>
      <ul>{details.map((detail,index)=><li key={index}><span aria-hidden="true"><PodscapeLineIcon name="check"/></span><span>{detail}</span></li>)}</ul>
     </section>:null}
    {item.href?<div className={detailStyles.actions}><Link href={item.href} onClick={onClose}>Explore this area <PodscapeLineIcon name="arrow-right"/></Link></div>:null}
   </div>
  </div>;
}

/** One category card is always visible, regardless of how many related edits occurred. */
export function RecentCategoryCards({groups}:{groups:RecentGroup[]}){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 const [active,setActive]=useState<{item:RecentItem;category:RecentCategory}|null>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const close=()=>{
  setActive(null);
  requestAnimationFrame(()=>openerRef.current?.focus());
 };
 function open(item:RecentItem,category:RecentCategory,opener:HTMLElement){
  openerRef.current=opener;
  setActive({item,category});
 }
 return <>
  <div className={styles.recentRail} role="region" aria-label="Recent updates by category" tabIndex={0}>
   {groups.map(group=>{
    const newest=group.items[0];if(!newest)return null;
    const count=group.items.length-1;
    const isExpanded=Boolean(expanded[group.category]);
    const id="recent-category-"+group.category;
    return <article className={styles.recentCategoryCard} key={group.category}>
     <div className={styles.recentCategoryHead}>
      <span className={styles.recentCategoryGlyph}><PodscapeLineIcon name={updateCategoryById[group.category].icon}/></span>
      <span className={styles.recentCategoryName}>{updateCategoryById[group.category].label}</span>
     </div>
     {newest.details!==undefined?<button className={styles.recentCategoryPrimary} type="button" onClick={event=>open(newest,group.category,event.currentTarget)}>
       <strong>{newest.title}</strong><span>{newest.description}</span><small>View update <span aria-hidden="true">→</span></small>
      </button>:<Link className={styles.recentCategoryPrimary} href={newest.href}>
       <strong>{newest.title}</strong><span>{newest.description}</span><small>Explore <span aria-hidden="true">→</span></small>
      </Link>}
     {count>0?<div className={styles.recentCategoryFooter}>
      <button type="button" aria-expanded={isExpanded} aria-controls={id}
       onClick={()=>setExpanded(current=>({...current,[group.category]:!current[group.category]}))}>
       {isExpanded?"Hide updates":`+ ${count} more ${updateCategoryById[group.category].plural}`}
       <PodscapeLineIcon name={isExpanded?"arrow-up":"arrow-down"}/>
      </button>
      <div className={styles.recentCategoryMore} id={id} hidden={!isExpanded}>
       {isExpanded?group.items.slice(1).map((item,index)=>item.details!==undefined?
        <button type="button" key={item.href+"|"+item.title+"|"+index} onClick={event=>open(item,group.category,event.currentTarget)}>{item.title}<span aria-hidden="true">→</span></button>:
        <Link href={item.href} key={item.href+"|"+item.title+"|"+index}>{item.title}<span aria-hidden="true">→</span></Link>):null}
      </div>
     </div>:<div className={styles.recentCategoryFooter}><span className={styles.recentCategoryOnly}>Latest in {updateCategoryById[group.category].label}</span></div>}
    </article>;
   })}
  </div>
  {active?createPortal(<UpdateDetailDialog item={active.item} category={active.category} onClose={close}/>,document.body):null}
 </>;
}

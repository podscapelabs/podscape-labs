"use client";

import {useRef,useState} from "react";
import Link from "next/link";
import {createPortal} from "react-dom";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {updateCategoryById,type UpdateCategory} from "@/data/update-categories";
import styles from "./PodscapeHome.module.css";
import detailStyles from "./UpdateDetailDialog.module.css";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";

export type RecentCategory=UpdateCategory;
export type RecentItem={title:string;description:string;href:string;details?:string[]};
export type RecentGroup={
 category:RecentCategory;
 newestAt:string;
 items:RecentItem[];
};

function UpdateDetailDialog({item,category,onClose}:{item:RecentItem;category:RecentCategory;onClose:()=>void}){
 const details=item.details||[];
 return <PodscapeInfoDialog eyebrow={updateCategoryById[category].label}
  icon={updateCategoryById[category].icon} title={item.title}
  description={item.description} onClose={onClose}>
   {details.length>0?<section aria-label="Changes in this update" className={detailStyles.changes}>
    <h3>What&apos;s changed</h3>
    <ul>{details.map((detail,index)=><li key={index}><span aria-hidden="true"><PodscapeLineIcon name="check"/></span><span>{detail}</span></li>)}</ul>
   </section>:null}
   <div className={detailStyles.actions}>
    {item.href&&item.href!=="/app"?<Link href={item.href} onClick={onClose}>Explore this area <PodscapeLineIcon name="arrow-right"/></Link>:null}
    <Link href={`/updates?category=${category}`} onClick={onClose}>View all {updateCategoryById[category].label.toLowerCase()} <PodscapeLineIcon name="arrow-right"/></Link>
   </div>
 </PodscapeInfoDialog>;
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
      <Link className={styles.recentCategoryName} href={`/updates?category=${group.category}`} aria-label={`View all ${updateCategoryById[group.category].label} updates`}>{updateCategoryById[group.category].label}</Link>
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

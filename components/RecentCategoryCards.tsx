"use client";

import {useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {updateCategoryById,type UpdateCategory} from "@/data/update-categories";
import styles from "./PodscapeHome.module.css";

export type RecentCategory=UpdateCategory;
export type RecentGroup={
 category:RecentCategory;
 newestAt:string;
 items:{title:string;description:string;href:string}[];
};
/** One category card is always visible, regardless of the number of related edits. */
export function RecentCategoryCards({groups}:{groups:RecentGroup[]}){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 return <div className={styles.recentRail} role="region" aria-label="Recent updates by category" tabIndex={0}>
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
    <Link className={styles.recentCategoryPrimary} href={newest.href}>
     <strong>{newest.title}</strong>
     <span>{newest.description}</span>
     <small>View update <span aria-hidden="true">→</span></small>
    </Link>
    {count>0?<div className={styles.recentCategoryFooter}>
     <button type="button" aria-expanded={isExpanded} aria-controls={id}
      onClick={()=>setExpanded(current=>({...current,[group.category]:!current[group.category]}))}>
      {isExpanded?"Hide updates":`+ ${count} more ${updateCategoryById[group.category].plural}`}
      <PodscapeLineIcon name={isExpanded?"arrow-up":"arrow-down"}/>
     </button>
     {isExpanded?<div className={styles.recentCategoryMore} id={id}>
      {group.items.slice(1).map(item=><Link href={item.href} key={item.href}>{item.title}<span aria-hidden="true">→</span></Link>)}
     </div>:null}
    </div>:<div className={styles.recentCategoryFooter}><span className={styles.recentCategoryOnly}>Latest in {updateCategoryById[group.category].label}</span></div>}
   </article>;
  })}
 </div>;
}

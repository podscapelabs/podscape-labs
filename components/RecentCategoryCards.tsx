"use client";

import {useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "./PodscapeHome.module.css";

export type RecentGroup={
 label:"SPECIES"|"FIELD GUIDE"|"SHOP";
 newestAt:string;
 items:{title:string;description:string;href:string}[];
};
const icons:Record<RecentGroup["label"],PodscapeIconName>={
 "SPECIES":"leaf","FIELD GUIDE":"book","SHOP":"shop"
};
const descriptions:Record<RecentGroup["label"],string>={
 "SPECIES":"Leaf Ledger","FIELD GUIDE":"Field Guide","SHOP":"PodScape Shop"
};

/** One category card is always visible, regardless of the number of related edits. */
export function RecentCategoryCards({groups}:{groups:RecentGroup[]}){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 return <div className={styles.recentRail} role="region" aria-label="Recent updates by category" tabIndex={0}>
  {groups.map(group=>{
   const newest=group.items[0];if(!newest)return null;
   const count=group.items.length-1;
   const isExpanded=Boolean(expanded[group.label]);
   const id="recent-category-"+group.label.toLowerCase().replaceAll(" ","-");
   return <article className={styles.recentCategoryCard} key={group.label}>
    <div className={styles.recentCategoryHead}>
     <span className={styles.recentCategoryGlyph}><PodscapeLineIcon name={icons[group.label]}/></span>
     <span className={styles.recentCategoryName}>{descriptions[group.label]}</span>
    </div>
    <Link className={styles.recentCategoryPrimary} href={newest.href}>
     <strong>{newest.title}</strong>
     <span>{newest.description}</span>
     <small>View update <span aria-hidden="true">→</span></small>
    </Link>
    {count>0?<div className={styles.recentCategoryFooter}>
     <button type="button" aria-expanded={isExpanded} aria-controls={id}
      onClick={()=>setExpanded(current=>({...current,[group.label]:!current[group.label]}))}>
      {isExpanded?"Hide updates":`+ ${count} more ${group.label==="SPECIES"?"species":group.label==="FIELD GUIDE"?"guides":"products"}`}
      <PodscapeLineIcon name={isExpanded?"arrow-up":"arrow-down"}/>
     </button>
     {isExpanded?<div className={styles.recentCategoryMore} id={id}>
      {group.items.slice(1).map(item=><Link href={item.href} key={item.href}>{item.title}<span aria-hidden="true">→</span></Link>)}
     </div>:null}
    </div>:<div className={styles.recentCategoryFooter}><span className={styles.recentCategoryOnly}>Latest in {descriptions[group.label]}</span></div>}
   </article>;
  })}
 </div>;
}

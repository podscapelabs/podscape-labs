"use client";
import Link from "next/link";
import type {PodscapeIconName} from "./PodscapeLineIcon";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./PortalActionRail.module.css";

export type PortalAction={label:string;icon:PodscapeIconName;href?:string;onClick?:()=>void;description?:string;disabled?:boolean};
export function PortalActionRail({label,actions,compact=false,layout="inline"}:{label:string;actions:PortalAction[];compact?:boolean;layout?:"inline"|"grid"}){
 return <nav className={[styles.rail,compact?styles.compact:"",layout==="grid"?styles.grid:""].filter(Boolean).join(" ")} aria-label={label}>
  {actions.filter(action=>Boolean(action.href)||Boolean(action.onClick)).map(action=>{
   const body=<><PodscapeLineIcon name={action.icon}/><span>{action.label}</span></>;
   if(action.disabled)return <span key={action.label+(action.href||"")} className={styles.disabled} aria-disabled="true" title={action.description}>{body}</span>;
   return action.href?<Link href={action.href} key={action.label+action.href} className={styles.action} aria-label={action.description?action.label+": "+action.description:action.label} title={action.description}>{body}</Link>:
    <button key={action.label} type="button" className={styles.action} onClick={action.onClick} title={action.description}>{body}</button>;
  })}
 </nav>;
}

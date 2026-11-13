"use client";
import type {ReactNode} from "react";
import styles from "./PodscapeHome.module.css";

/** Shared library hierarchy across Home, Manager, Species and Fun Zone.
 * Keep existing library dialog, saved widget IDs and editing logic unchanged.
 */
export function WidgetLibraryHeading({eyebrow,title="Widget Library",titleId,onDone}:{
 eyebrow:string;title?:string;titleId:string;onDone:()=>void
}){
 return <div className={styles.homeEditorHead}>
  <div><small>{eyebrow}</small><h2 id={titleId}>{title}</h2></div>
  <button type="button" onClick={onDone} aria-label={"Close "+title}>Done</button>
 </div>;
}
export function WidgetLibrarySummary({added,total,arrangeLabel,onArrange,children}:{
 added:number;total:number;arrangeLabel:string;onArrange:()=>void;children?:ReactNode
}){
 return <div className={styles.widgetLibraryActions}>
  <span role="status">{added} of {total} widgets added</span>
  <button type="button" onClick={onArrange}>{arrangeLabel}</button>
  {children}
 </div>;
}

"use client";

import {useEffect,useRef,type ReactNode} from "react";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "./PodscapeInfoDialog.module.css";

type Props={
 title:string;
 eyebrow:string;
 icon?:PodscapeIconName;
 description?:string;
 onClose:()=>void;
 children:ReactNode;
};

/** The shared PodScape information sheet: native focus trapping, Escape to close,
 * focus restoration handled by the caller, and all colour from theme roles. */
export function PodscapeInfoDialog({title,eyebrow,icon,description,onClose,children}:Props){
 const ref=useRef<HTMLDialogElement>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  const dialog=ref.current;
  if(!dialog)return;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  if(!dialog.open)dialog.showModal();
  const onCancel=(event:Event)=>{event.preventDefault();closeRef.current()};
  dialog.addEventListener("cancel",onCancel);
  return()=>{
   dialog.removeEventListener("cancel",onCancel);
   if(dialog.open)dialog.close();
   document.body.style.overflow=previousOverflow;
   requestAnimationFrame(()=>{if(previousFocus?.isConnected)previousFocus.focus()});
  };
 },[]);
 return <dialog ref={ref} className={styles.dialog} aria-label={title}
  onMouseDown={event=>{
   if(event.target===event.currentTarget)closeRef.current();
  }}>
  <div className={styles.content}>
   <div className={styles.header}>
    <span className={styles.eyebrow}>{icon?<PodscapeLineIcon name={icon}/>:null}{eyebrow}</span>
    <button type="button" className={styles.close} aria-label="Close information" onClick={onClose}><PodscapeLineIcon name="close"/></button>
   </div>
   <div className={styles.body}>
    <h2>{title}</h2>
    {description?<p className={styles.description}>{description}</p>:null}
    {children}
   </div>
  </div>
 </dialog>;
}

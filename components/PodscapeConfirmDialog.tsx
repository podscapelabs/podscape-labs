"use client";
import {useEffect,useRef,type ReactNode} from "react";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./PodscapeInfoDialog.module.css";

/** Destructive-action counterpart to PodscapeInfoDialog.
 * Uses the same native modal, theme surface and mobile sheet, but requires an explicit choice.
 */
export function PodscapeConfirmDialog({title,eyebrow="CONFIRM ACTION",children,confirmLabel,cancelLabel="Keep it",pending=false,onConfirm,onCancel,danger=true}:{
 title:string;eyebrow?:string;children:ReactNode;confirmLabel:string;cancelLabel?:string;
 pending?:boolean;onConfirm:()=>void;onCancel:()=>void;danger?:boolean;
}){
 const ref=useRef<HTMLDialogElement>(null);
 const cancelRef=useRef<HTMLButtonElement>(null);
 const closeRef=useRef(onCancel);
 const pendingRef=useRef(pending);
 closeRef.current=onCancel;
 pendingRef.current=pending;
 useEffect(()=>{
  const dialog=ref.current;
  if(!dialog)return;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  if(!dialog.open)dialog.showModal();
  cancelRef.current?.focus({preventScroll:true});
  const onEscape=(event:Event)=>{event.preventDefault();if(!pendingRef.current)closeRef.current()};
  dialog.addEventListener("cancel",onEscape);
  return()=>{
   dialog.removeEventListener("cancel",onEscape);
   if(dialog.open)dialog.close();
   document.body.style.overflow=previousOverflow;
   requestAnimationFrame(()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})});
  };
 },[]);
 return <dialog ref={ref} role="alertdialog" aria-label={title} aria-busy={pending} className={styles.dialog}
  onMouseDown={event=>{if(event.target===event.currentTarget&&!pendingRef.current)closeRef.current()}}>
  <div className={styles.content}>
   <div className={styles.header}><span className={styles.eyebrow}><PodscapeLineIcon name={danger?"warning":"note"}/>{eyebrow}</span></div>
   <div className={styles.body}>
    <h2>{title}</h2>
    <div className={styles.confirmBody}>{children}</div>
    <div className={styles.confirmActions}>
     <button ref={cancelRef} type="button" disabled={pending} className={styles.confirmCancel} onClick={onCancel}>{cancelLabel}</button>
     <button type="button" disabled={pending} className={danger?styles.confirmDanger:styles.confirmPrimary} onClick={onConfirm}>{pending?"Working…":confirmLabel}</button>
    </div>
   </div>
  </div>
 </dialog>;
}

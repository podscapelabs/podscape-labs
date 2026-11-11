"use client";
import {useRef} from "react";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./RankingModal.module.css";

export function RankingModal({trigger,title,children,subtle=false}:{trigger:string;title:string;children:React.ReactNode;subtle?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);
 const triggerButton=useRef<HTMLButtonElement>(null);
 const close=()=>{dialog.current?.close();triggerButton.current?.focus()};
 return <>
  <button ref={triggerButton} type="button" className={subtle?styles.triggerSubtle:styles.trigger} onClick={()=>dialog.current?.showModal()}>
   <PodscapeLineIcon name={subtle?"edit":"book"}/><span>{trigger}</span><span aria-hidden="true">→</span>
  </button>
  <dialog ref={dialog} className={styles.dialog} aria-label={title} onClick={event=>{if(event.target===event.currentTarget)close()}}>
   <div className={styles.content}>
    <header className={styles.header}><div><small>PODSCAPE · RANKINGS</small><h2>{title}</h2></div>
     <button type="button" aria-label="Close ranking information" onClick={close}><PodscapeLineIcon name="close"/></button>
    </header>
    <div className={styles.body}>{children}</div>
   </div>
  </dialog>
 </>;
}

"use client";
import {useRef,useState,type ReactNode} from "react";
import {PodscapeInfoDialog} from "@/components/PodscapeInfoDialog";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./RankingModal.module.css";

/** The same accessible information sheet used for rules, updates and rankings. */
export function RankingModal({trigger,title,children,subtle=false}:{trigger:string;title:string;children:ReactNode;subtle?:boolean}){
 const [open,setOpen]=useState(false);
 const triggerButton=useRef<HTMLButtonElement>(null);
 const close=()=>{setOpen(false);requestAnimationFrame(()=>triggerButton.current?.isConnected&&triggerButton.current.focus())};
 return <>
  <button ref={triggerButton} type="button" className={subtle?styles.triggerSubtle:styles.trigger} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>
   <PodscapeLineIcon name={subtle?"edit":"book"}/><span>{trigger}</span><span aria-hidden="true">→</span>
  </button>
  {open?<PodscapeInfoDialog title={title} eyebrow="PODSCAPE · RANKINGS" icon="trophy" onClose={close}>{children}</PodscapeInfoDialog>:null}
 </>;
}

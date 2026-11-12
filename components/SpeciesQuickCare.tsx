"use client";
import {useRef,useState} from "react";
import {createPortal} from "react-dom";
import Link from "next/link";
import {PodscapeInfoDialog} from "./PodscapeInfoDialog";
import {binDisplayName} from "@/lib/bin-identity";
import styles from "./QuickAddBin.module.css";
type Bin={id:string;name:string;label:string};
export function SpeciesQuickCare({bins,speciesName}:{bins:Bin[];speciesName:string}){
 const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);
 const href=(id:string)=>"/keeper/scan?bin="+id+"&mode=care";
 if(!bins.length)return null;
 if(bins.length===1)return <Link href={href(bins[0].id)}>Quick Care</Link>;
 const close=()=>{setOpen(false);requestAnimationFrame(()=>trigger.current?.focus())};
 return <><button type="button" ref={trigger} className={styles.launch} onClick={()=>setOpen(true)}>Quick Care</button>
 {open?createPortal(<PodscapeInfoDialog title="Choose a bin" eyebrow="QUICK CARE" description={speciesName} onClose={close}>
 <div className={styles.form}>{bins.map(bin=><Link className={styles.launch} key={bin.id} href={href(bin.id)}>{binDisplayName(bin)} →</Link>)}</div>
 </PodscapeInfoDialog>,document.body):null}</>;
}

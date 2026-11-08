"use client";

import {useEffect,useRef,useState,type ReactNode} from "react";
import styles from "@/app/admin/species/ledger-desk.module.css";

const stages=[
 {id:"identity",name:"Identity",summary:"Name, classification and morph"},
 {id:"profile",name:"Profile",summary:"A short introduction to this species"},
 {id:"status",name:"Status",summary:"Publication and catalogue details"},
 {id:"photo",name:"Photos",summary:"Specimen photograph and image description"},
 {id:"traits",name:"Traits",summary:"Notable characteristics"},
 {id:"care",name:"Care",summary:"General care and behaviour"},
 {id:"notes",name:"Notes",summary:"Internal notes and guide references"},
] as const;
type StageId=(typeof stages)[number]["id"];

export function LedgerDeskWorkflow({recordId,children}:{recordId:string;children:ReactNode}){
 const [stage,setStage]=useState<StageId>("identity");
 const [done,setDone]=useState<StageId[]>([]);
 const root=useRef<HTMLDivElement>(null);
 // Completion is a local workflow marker, never a claim that the form was saved.
 useEffect(()=>{setStage("identity");setDone([])},[recordId]);
 const currentIndex=stages.findIndex(item=>item.id===stage);
 const select=(id:StageId)=>{
  setStage(id);
  // Keep the editor in view instead of jumping through hidden form sections.
  requestAnimationFrame(()=>root.current?.scrollIntoView({behavior:"smooth",block:"start"}));
 };
 const complete=()=>{
  setDone(previous=>previous.includes(stage)?previous:[...previous,stage]);
  if(currentIndex<stages.length-1)select(stages[currentIndex+1].id);
 };
 const onInput=(event:React.FormEvent<HTMLDivElement>)=>{
  const target=event.target;
  if(!(target instanceof HTMLElement))return;
  const panel=target.closest<HTMLElement>("[data-ledger-stage]");
  const id=panel?.dataset.ledgerStage as StageId|undefined;
  if(id)setDone(previous=>previous.filter(item=>item!==id));
 };
 return <div className={styles.workflow} ref={root} data-active-step={stage} onInput={onInput} onChange={onInput}>
  <nav className={styles.workflowNav} aria-label="Ledger editing steps">
   {stages.map((item,index)=><button type="button" key={item.id} onClick={()=>select(item.id)} className={stage===item.id?styles.workflowCurrent:""} aria-current={stage===item.id?"step":undefined} aria-controls={"ledger-"+item.id}>
    <span className={styles.workflowStepNumber}>{done.includes(item.id)?"✓":index+1}</span><span>{item.name}</span>
   </button>)}
  </nav>
  <div className={styles.workflowProgress} aria-live="polite">
   <div><span>Step {currentIndex+1} of {stages.length}</span><strong>{stages[currentIndex].name}</strong><small>{stages[currentIndex].summary}</small></div>
   <span>{done.length} reviewed</span>
  </div>
  <div className={styles.workflowContent}>{children}</div>
  <div className={styles.workflowFooter}>
   <p>{done.includes(stage)?"✓ Section reviewed":"Changes in this section are saved when you save the record."}</p>
   <div className={styles.workflowFooterActions}>
    {currentIndex>0?<button type="button" className={styles.workflowBack} onClick={()=>select(stages[currentIndex-1].id)}>← Back</button>:null}
    {currentIndex<stages.length-1
      ?<button type="button" className={styles.workflowNext} onClick={complete}>Done &amp; Next →</button>
      :<button type="submit" className={styles.workflowNext}>Save record ✓</button>}
   </div>
  </div>
 </div>;
}

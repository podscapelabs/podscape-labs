"use client";

import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "@/app/keeper/page.module.css";

type Section="stats"|"tools"|"enclosures";
type Tool={id:string;label:string;href:string;icon:PodscapeIconName};
const defaults:Section[]=["stats","tools","enclosures"];
const labels:Record<Section,string>={stats:"Colony Statistics",tools:"Quick Tools",enclosures:"Your Enclosures"};
const key="podscape-manager-layout-v1";
const library:Tool[]=[
 {id:"scan",label:"Scan bin",href:"/keeper/scan",icon:"scan"},
 {id:"qr",label:"Create QR",href:"/keeper/qr",icon:"qr"},
 {id:"add",label:"Add bin",href:"/keeper/collection",icon:"bin"},
 {id:"care",label:"Log care",href:"/keeper/collection",icon:"droplet"},
 {id:"schedule",label:"Schedule",href:"/keeper/schedule",icon:"calendar"},
 {id:"notes",label:"Notes",href:"/keeper/collection",icon:"note"},
 {id:"colonies",label:"All colonies",href:"/keeper/collection",icon:"jar"},
 {id:"history",label:"Care history",href:"/keeper/collection",icon:"note"}
];
type Layout={order:Section[];visible:Section[];tools:string[]};
const initial:Layout={order:defaults,visible:defaults,tools:["scan","qr","add","care","schedule","notes"]};
function normalize(value:unknown):Layout{
 if(!value||typeof value!=="object")return initial;
 const raw=value as Partial<Layout>;
 const order=[...(Array.isArray(raw.order)?raw.order.filter((v):v is Section=>defaults.includes(v as Section)):[]),...defaults].filter((v,i,a)=>a.indexOf(v)===i);
 const visible=Array.isArray(raw.visible)?defaults.filter(v=>raw.visible!.includes(v)):defaults;
 const tools=Array.isArray(raw.tools)?raw.tools.filter(v=>library.some(t=>t.id===v)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6):initial.tools;
 return {order,visible,tools:tools.length?tools:initial.tools};
}
export function ManagerWorkspace({stats,enclosures,scope}:{stats:ReactNode;enclosures:ReactNode;scope:string}){
 const storageKey=key+":"+scope;
 const [layout,setLayout]=useState<Layout>(initial);
 const [ready,setReady]=useState(false);
 const [editing,setEditing]=useState(false);
 const [slot,setSlot]=useState<number|null>(null);
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved)setLayout(normalize(JSON.parse(saved)))}catch{}setReady(true)},[storageKey]);
 const update=(next:Layout)=>{setLayout(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}};
 const swap=(id:string)=>{if(slot===null)return;const next=[...layout.tools];const prior=next.indexOf(id);if(prior>=0){[next[slot],next[prior]]=[next[prior],next[slot]]}else next[slot]=id;update({...layout,tools:next});setSlot(null)};
 const move=(id:Section,dir:number)=>{const next=[...layout.order],at=next.indexOf(id),to=at+dir;if(to<0||to>=next.length)return;[next[at],next[to]]=[next[to],next[at]];update({...layout,order:next})};
 const sections:Record<Section,ReactNode>={
  stats,
  enclosures,
  tools:<section className={styles.section} key="tools"><header><h2>Quick Tools</h2><button type="button" className={styles.managerTextButton} onClick={()=>setEditing(true)}>Customize ↗</button></header>
   <nav className={styles.tools} aria-label="Keeper quick tools">
    {layout.tools.map((id,i)=>{const tool=library.find(t=>t.id===id);return tool?<Link href={tool.href} key={id} onClick={e=>{if(editing){e.preventDefault();setSlot(i)}}}><span><PodscapeLineIcon name={tool.icon}/></span><small>{tool.label}</small></Link>:null})}
   </nav>
   {editing?<p className={styles.managerHint}>Tap any Quick Tool to replace or swap it.</p>:null}
  </section>
 };
 return <div className={styles.managerWorkspace}>
  <div className={styles.managerWorkspaceHeader}><span>Your workspace</span><button type="button" onClick={()=>{setEditing(v=>!v);setSlot(null)}}>{editing?"Done":"Customize workspace"}</button></div>
  {editing?<div className={styles.managerEditor}>
   <h3>Arrange dashboard</h3><p>Show, hide and reorder your workspace sections. Your tools are always available from Manager.</p>
   {layout.order.map((id,i)=><div className={styles.managerEditorRow} key={id}>
    <label><input type="checkbox" checked={layout.visible.includes(id)} onChange={e=>update({...layout,visible:e.target.checked?[...layout.visible,id]:layout.visible.filter(v=>v!==id)})}/>{labels[id]}</label>
    <button type="button" disabled={i===0} aria-label={"Move "+labels[id]+" up"} onClick={()=>move(id,-1)}>↑</button>
    <button type="button" disabled={i===layout.order.length-1} aria-label={"Move "+labels[id]+" down"} onClick={()=>move(id,1)}>↓</button>
   </div>)}
   <div className={styles.managerEditorActions}><button type="button" onClick={()=>setSlot(0)}>Edit Quick Tools</button><button type="button" onClick={()=>update(initial)}>Reset layout</button></div>
  </div>:null}
  {editing&&slot!==null?<div className={styles.managerEditor} role="dialog" aria-label="Choose Quick Tool">
   <div className={styles.managerPickerTitle}><h3>Replace Quick Tool {slot+1}</h3><button type="button" onClick={()=>setSlot(null)} aria-label="Close tool picker">×</button></div>
   <div className={styles.managerToolLibrary}>{library.map(tool=><button type="button" key={tool.id} onClick={()=>swap(tool.id)}><PodscapeLineIcon name={tool.icon}/><span>{tool.label}</span>{layout.tools[slot]===tool.id?" ✓":""}</button>)}</div>
  </div>:null}
  {layout.order.filter(id=>layout.visible.includes(id)).map(id=><div key={id}>{sections[id]}</div>)}
  {ready&&layout.visible.length===0?<p className={styles.managerHint}>All sections are hidden. Use Customize workspace to show them again.</p>:null}
  <div className={styles.managerFallback}><Link href="/keeper/collection">All colonies →</Link><Link href="/keeper/scan">Scan bin →</Link><Link href="/keeper/schedule">Schedule →</Link></div>
 </div>;
}

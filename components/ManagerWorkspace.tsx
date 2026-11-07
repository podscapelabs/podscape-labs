"use client";

import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "@/app/keeper/page.module.css";
import homeStyles from "./PodscapeHome.module.css";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import {WorkspaceEditToolbar,WorkspaceEditBlock,useWorkspaceDrag} from "./WorkspaceEditCanvas";

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
 const order=[...uniqueAllowed(Array.isArray(raw.order)?raw.order:[],defaults),...defaults].filter((v,i,a)=>a.indexOf(v)===i);
 const visible=Array.isArray(raw.visible)?defaults.filter(v=>raw.visible!.includes(v)):defaults;
 const tools=Array.isArray(raw.tools)?raw.tools.filter(v=>library.some(t=>t.id===v)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6):initial.tools;
 return {order,visible,tools:tools.length?tools:initial.tools};
}
export function ManagerWorkspace({stats,enclosures,scope,primaryHref}:{stats:ReactNode;enclosures:ReactNode;scope:string;primaryHref:string}){
 const storageKey=key+":"+scope;
 const [layout,setLayout]=useState<Layout>(initial);
 const [ready,setReady]=useState(false);
 const [editing,setEditing]=useState(false);
 const [canvasEditing,setCanvasEditing]=useState(false);
 const [tab,setTab]=useState<"library"|"arrange">("library");
 const [slot,setSlot]=useState<number|null>(null);
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved)setLayout(normalize(JSON.parse(saved)))}catch{}setReady(true)},[storageKey]);
 const update=(next:Layout)=>{setLayout(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}};
 const swap=(id:string)=>{if(slot===null)return;const next=[...layout.tools];const prior=next.indexOf(id);if(prior>=0){[next[slot],next[prior]]=[next[prior],next[slot]]}else next[slot]=id;update({...layout,tools:next});setSlot(null)};
 const move=(id:Section,dir:number)=>update({...layout,order:moveBlock(layout.order,layout.visible,id,dir)});
 const reorder=(from:Section,to:Section)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const visible=layout.order.filter(id=>layout.visible.includes(id));
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<Section>("manager",visible,reorder);
 const finishCanvas=()=>{stop();setCanvasEditing(false)};
 const resetToDefault=()=>{if(!window.confirm("Restore the default Manager layout and Quick Tools? Your colony records will not be affected."))return;stop();update({order:[...defaults],visible:[...defaults],tools:[...initial.tools]});setSlot(null)};
 const sections:Record<Section,ReactNode>={
  stats,
  enclosures,
  tools:<section className={styles.section} key="tools"><header><h2>Quick Tools</h2></header>
   <nav className={styles.tools} aria-label="Keeper quick tools">
    {layout.tools.map(id=>{const tool=library.find(t=>t.id===id);return tool?<Link href={id==="care"||id==="notes"?primaryHref:tool.href} key={id}><span><PodscapeLineIcon name={tool.icon}/></span><small>{tool.label}</small></Link>:null})}
   </nav>
  </section>
 };
 return <div className={`${styles.managerWorkspace} ${canvasEditing?homeStyles.homeCanvasEditing:""}`}>
  <div className={styles.managerWorkspaceHeader}><span>Your workspace</span><button type="button" className={homeStyles.editHomeButton} onClick={()=>{setCanvasEditing(true);setEditing(false);setSlot(null)}}><span aria-hidden="true">✎</span><span>Edit Manager</span></button></div>
  {canvasEditing?<WorkspaceEditToolbar title="Arrange your Manager" description="Drag sections to arrange your workspace. Quick Tools stay grouped." onAdd={()=>{finishCanvas();setEditing(true);setTab("library");setSlot(null)}} onReset={resetToDefault} onDone={finishCanvas}/>:null}
  {editing?<div className={homeStyles.homeEditorOverlay} onPointerDown={e=>{if(e.target===e.currentTarget){setEditing(false);setSlot(null)}}}>
   <div className={`${homeStyles.widgetEditor} ${homeStyles.widgetLibrary}`} role="dialog" aria-modal="true" aria-labelledby="manager-widget-title">
    <div className={homeStyles.homeEditorHead}><div><small>YOUR WORKSPACE, YOUR WAY</small><h2 id="manager-widget-title">Widget Library</h2></div><button type="button" onClick={()=>{setEditing(false);setSlot(null)}}>Done</button></div>
    <p>Choose which Manager sections appear and arrange them your way. Quick Tools can be swapped without changing your homepage.</p>
    <div className={homeStyles.widgetTabs} role="group" aria-label="Manager widget library views">
     <button type="button" className={tab==="library"?homeStyles.widgetTabActive:""} aria-pressed={tab==="library"} onClick={()=>{setTab("library");setSlot(null)}}>Explore widgets</button>
     <button type="button" className={tab==="arrange"?homeStyles.widgetTabActive:""} aria-pressed={tab==="arrange"} onClick={()=>{setTab("arrange");setSlot(null)}}>On My Manager <span>({layout.visible.length})</span></button>
    </div>
    {slot!==null?<div className={styles.managerEditor}><div className={styles.managerPickerTitle}><h3>Replace Quick Tool {slot+1}</h3><button type="button" onClick={()=>setSlot(null)} aria-label="Close tool picker">×</button></div><div className={styles.managerToolLibrary}>{library.map(tool=><button type="button" key={tool.id} onClick={()=>swap(tool.id)}><PodscapeLineIcon name={tool.icon}/><span>{tool.label}</span>{layout.tools[slot]===tool.id?" ✓":""}</button>)}</div></div>:
    tab==="library"?<div className={homeStyles.widgetLibraryGroups}><section><h3>Manager widgets</h3><div className={homeStyles.widgetGallery}>{defaults.map(id=><article key={id} className={homeStyles.widgetGalleryCard}><div className={homeStyles.widgetPreview}><span><PodscapeLineIcon name={id==="stats"?"leaf":id==="tools"?"scan":"jar"}/></span><div><strong>{labels[id]}</strong><small>{id==="stats"?"Species, bins and population":id==="tools"?"Your everyday keeper actions":"Recently updated enclosures"}</small></div></div><div className={homeStyles.widgetGalleryCopy}><strong>{labels[id]}</strong><p>{id==="tools"?"Customize your six quick actions.":"Choose whether this section appears on your Manager."}</p><button type="button" className={layout.visible.includes(id)?homeStyles.widgetRemove:homeStyles.widgetAdd} onClick={()=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(v=>v!==id):[...layout.visible,id]})}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add to Manager"}</button>{id==="tools"?<div className={styles.managerToolLibrary} aria-label="Choose a Quick Tool slot to edit">{layout.tools.map((toolId,i)=><button type="button" key={i} onClick={()=>setSlot(i)} aria-label={`Replace ${library.find(tool=>tool.id===toolId)?.label||"Quick Tool"} in slot ${i+1}`}><span>{i+1}. {library.find(tool=>tool.id===toolId)?.label||"Quick Tool"}</span><span aria-hidden="true">✎</span></button>)}</div>:null}</div></article>)}</div></section></div>:
    <div className={homeStyles.widgetArrange}><p>Use the arrows to arrange your Manager widgets. Changes save automatically on this device.</p>{layout.order.filter(id=>layout.visible.includes(id)).map((id,i,visible)=><div className={homeStyles.widgetArrangeRow} key={id}><span className={homeStyles.widgetArrangeIcon}><PodscapeLineIcon name={id==="stats"?"leaf":id==="tools"?"scan":"jar"}/></span><strong>{labels[id]}</strong><button type="button" disabled={i===0} aria-label={`Move ${labels[id]} up`} onClick={()=>move(id,-1)}>↑</button><button type="button" disabled={i===visible.length-1} aria-label={`Move ${labels[id]} down`} onClick={()=>move(id,1)}>↓</button><button type="button" aria-label={`Remove ${labels[id]}`} onClick={()=>update({...layout,visible:layout.visible.filter(v=>v!==id)})}>×</button></div>)}{layout.visible.length===0?<p>No Manager widgets selected. Explore the library to add one.</p>:null}</div>}
    <div className={homeStyles.widgetLibraryFooter}><small>{layout.visible.length} widget{layout.visible.length===1?"":"s"} on your Manager · Saved on this device</small><button type="button" onClick={()=>{if(!window.confirm("Restore the default Manager layout and Quick Tools? Your colony records will not be affected."))return;update(initial);setSlot(null);setTab("library")}}>Reset layout</button></div>
   </div>
  </div>:null}
  {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="manager" label={labels[id]} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={false} onMove={move} onRemove={id=>update({...layout,visible:layout.visible.filter(v=>v!==id)})} begin={begin} move={dragMove} stop={stop} onLongPress={()=>{setCanvasEditing(true);setEditing(false);setSlot(null)}}>{sections[id]}</WorkspaceEditBlock>)}
  {ready&&layout.visible.length===0?<p className={styles.managerHint}>All sections are hidden. Tap Edit Manager to add a widget.</p>:null}
  <div className={styles.managerFallback}><Link href="/keeper/collection">All colonies →</Link><Link href="/keeper/scan">Scan bin →</Link><Link href="/keeper/schedule">Schedule →</Link></div>
 </div>;
}

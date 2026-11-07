"use client";

import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "@/app/keeper/page.module.css";
import homeStyles from "./PodscapeHome.module.css";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import {WorkspaceEditToolbar,WorkspaceEditBlock,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {ManagerCareOverview,ManagerActivityFeed,ManagerInsights,type ManagerBin,type ManagerEvent} from "./ManagerCareWidgets";

type Section="stats"|"care"|"tools"|"activity"|"enclosures"|"insights";
type Tool={id:string;label:string;href:string;icon:PodscapeIconName};
const defaults:Section[]=["stats","care","tools","activity","enclosures","insights"];
const labels:Record<Section,string>={stats:"Colony Statistics",care:"Care Overview",tools:"Quick Tools",activity:"Recent Activity",enclosures:"Your Enclosures",insights:"Colony Insights"};
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
const initial:Layout={order:defaults,visible:["stats","care","tools","activity","enclosures"],tools:["scan","qr","add","care","schedule","notes"]};
function normalize(value:unknown):Layout{
 if(!value||typeof value!=="object")return initial;
 const raw=value as Partial<Layout>;
 const order=[...uniqueAllowed(Array.isArray(raw.order)?raw.order:[],defaults),...defaults].filter((v,i,a)=>a.indexOf(v)===i);
 // Existing layouts keep their custom selections, but gain the new care/activity widgets on upgrade.
 const legacy=Array.isArray(raw.order)&&!raw.order.some(v=>v==="care"||v==="activity"||v==="insights");
 const visible=Array.isArray(raw.visible)?defaults.filter(v=>raw.visible!.includes(v)||(legacy&&(v==="care"||v==="activity"))):initial.visible;
 const tools=Array.isArray(raw.tools)?raw.tools.filter(v=>library.some(t=>t.id===v)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6):initial.tools;
 return {order,visible,tools:tools.length?tools:initial.tools};
}
export function ManagerWorkspace({stats,enclosures,bins,events,activityAvailable,scope,primaryHref}:{stats:ReactNode;enclosures:ReactNode;bins:ManagerBin[];events:ManagerEvent[];activityAvailable:boolean;scope:string;primaryHref:string}){
 const storageKey=key+":"+scope;
 const [layout,setLayout]=useState<Layout>(initial);
 const [ready,setReady]=useState(false);
 const [editing,setEditing]=useState(false);
 const [canvasEditing,setCanvasEditing]=useState(false);
 const [slot,setSlot]=useState<number|null>(null);
 // Preserve the position of the section the user held while editor controls mount above it.
 const editAnchor=useRef<{id:Section;top:number}|null>(null);
 const enterCanvas=(id?:Section)=>{
  if(id){
   const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="manager"]')).find(node=>node.dataset.workspaceBlock===id);
   editAnchor.current=block?{id,top:block.getBoundingClientRect().top}:null;
  }else editAnchor.current=null;
  setCanvasEditing(true);
  setEditing(false);
  setSlot(null);
 };
 useLayoutEffect(()=>{
  if(!canvasEditing||!editAnchor.current)return;
  const {id,top}=editAnchor.current;
  editAnchor.current=null;
  const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="manager"]')).find(node=>node.dataset.workspaceBlock===id);
  if(!block)return;
  const difference=block.getBoundingClientRect().top-top;
  if(Math.abs(difference)>1)window.scrollBy({top:difference,behavior:"instant"});
 },[canvasEditing]);
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved)setLayout(normalize(JSON.parse(saved)))}catch{}setReady(true)},[storageKey]);
 const update=(next:Layout)=>{setLayout(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}};
 const swap=(id:string)=>{if(slot===null)return;const next=[...layout.tools];const prior=next.indexOf(id);if(prior>=0){[next[slot],next[prior]]=[next[prior],next[slot]]}else next[slot]=id;update({...layout,tools:next});setSlot(null)};
 const move=(id:Section,dir:number)=>update({...layout,order:moveBlock(layout.order,layout.visible,id,dir)});
 const reorder=(from:Section,to:Section)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const visible=layout.order.filter(id=>layout.visible.includes(id));
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<Section>("manager",visible,reorder);
 const finishCanvas=()=>{stop();editAnchor.current=null;setCanvasEditing(false)};
 const resetToDefault=()=>{if(!window.confirm("Restore the default Manager layout and Quick Tools? Your colony records will not be affected."))return;stop();update({order:[...defaults],visible:[...defaults],tools:[...initial.tools]});setSlot(null)};
 const sections:Record<Section,ReactNode>={
  stats,
  care:<ManagerCareOverview bins={bins}/>,
  activity:<ManagerActivityFeed events={events} available={activityAvailable}/>,
  insights:<ManagerInsights bins={bins} events={events}/>,
  enclosures,
  tools:<section className={styles.section} key="tools"><header><h2>Quick Tools</h2></header>
   <nav className={styles.tools} aria-label="Keeper quick tools">
    {layout.tools.map(id=>{const tool=library.find(t=>t.id===id);return tool?<Link href={id==="care"||id==="notes"?primaryHref:tool.href} key={id}><span><PodscapeLineIcon name={tool.icon}/></span><small>{tool.label}</small></Link>:null})}
   </nav>
  </section>
 };
 return <div className={`${styles.managerWorkspace} ${canvasEditing?homeStyles.homeCanvasEditing:""}`}>
  {canvasEditing?<WorkspaceEditToolbar title="Arrange your Manager" description="Drag sections to arrange your workspace. Quick Tools stay grouped." onAdd={()=>{finishCanvas();setEditing(true);setSlot(null)}} onReset={resetToDefault} onDone={finishCanvas}/>:null}
  {editing?<div className={homeStyles.homeEditorOverlay} onPointerDown={e=>{if(e.target===e.currentTarget){setEditing(false);setSlot(null)}}}>
   <div className={`${homeStyles.widgetEditor} ${homeStyles.widgetLibrary}`} role="dialog" aria-modal="true" aria-labelledby="manager-widget-title">
    <div className={homeStyles.homeEditorHead}><div><small>YOUR WORKSPACE, YOUR WAY</small><h2 id="manager-widget-title">Widget Library</h2></div><button type="button" onClick={()=>{setEditing(false);setSlot(null)}}>Done</button></div>
    <p>Add or remove Manager sections, and choose the Quick Tools you use most.</p>
    <div className={homeStyles.widgetLibraryActions}><span>{layout.visible.length} of {defaults.length} sections shown</span><button type="button" onClick={()=>{setEditing(false);setSlot(null);setCanvasEditing(true)}}>Arrange Manager</button></div>
    {slot!==null?<div className={styles.managerEditor}><div className={styles.managerPickerTitle}><h3>Replace Quick Tool {slot+1}</h3><button type="button" onClick={()=>setSlot(null)} aria-label="Close tool picker">×</button></div><div className={styles.managerToolLibrary}>{library.map(tool=><button type="button" key={tool.id} onClick={()=>swap(tool.id)}><PodscapeLineIcon name={tool.icon}/><span>{tool.label}</span>{layout.tools[slot]===tool.id?" ✓":""}</button>)}</div></div>:
    <div className={homeStyles.widgetLibraryGroups}><section><h3>Manager widgets</h3><div className={homeStyles.widgetGallery}>{defaults.map(id=><article key={id} className={homeStyles.widgetGalleryCard}><div className={homeStyles.widgetPreview}><span><PodscapeLineIcon name={id==="stats"?"leaf":id==="tools"?"scan":id==="care"?"droplet":id==="activity"?"note":id==="insights"?"community":"jar"}/></span><div><strong>{labels[id]}</strong><small>{id==="stats"?"Species, bins and population":id==="care"?"Due misting and schedules":id==="tools"?"Your everyday keeper actions":id==="activity"?"Latest care records":id==="insights"?"Trends from your records":"Recently updated enclosures"}</small></div></div><div className={homeStyles.widgetGalleryCopy}><strong>{labels[id]}</strong><p>{id==="tools"?"Customize your six quick actions.":"Choose whether this section appears on your Manager."}</p><button type="button" className={layout.visible.includes(id)?homeStyles.widgetRemove:homeStyles.widgetAdd} onClick={()=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(v=>v!==id):[...layout.visible,id]})}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add to Manager"}</button>{id==="tools"?<div className={styles.managerToolLibrary} aria-label="Choose a Quick Tool slot to edit">{layout.tools.map((toolId,i)=><button type="button" key={i} onClick={()=>setSlot(i)} aria-label={`Replace ${library.find(tool=>tool.id===toolId)?.label||"Quick Tool"} in slot ${i+1}`}><span>{i+1}. {library.find(tool=>tool.id===toolId)?.label||"Quick Tool"}</span><span aria-hidden="true">✎</span></button>)}</div>:null}</div></article>)}</div></section></div>}
    <div className={homeStyles.widgetLibraryFooter}><small>{layout.visible.length} widget{layout.visible.length===1?"":"s"} on your Manager · Saved on this device</small><button type="button" onClick={()=>{if(!window.confirm("Restore the default Manager layout and Quick Tools? Your colony records will not be affected."))return;update(initial);setSlot(null)}}>Reset layout</button></div>
   </div>
  </div>:null}
  {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="manager" label={labels[id]} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={false} onMove={move} onRemove={id=>update({...layout,visible:layout.visible.filter(v=>v!==id)})} begin={begin} move={dragMove} stop={stop} onLongPress={()=>enterCanvas(id)}>{sections[id]}</WorkspaceEditBlock>)}
  {ready&&layout.visible.length===0?<div className={styles.managerHint}>All Manager sections are hidden. <button type="button" className={styles.managerTextButton} onClick={()=>{setEditing(true);setSlot(null)}}>Open Widget Library</button></div>:null}
  <div className={styles.managerFallback}><Link href="/keeper/collection">All colonies →</Link><Link href="/keeper/scan">Scan bin →</Link><Link href="/keeper/schedule">Schedule →</Link><button type="button" className={styles.managerTextButton} onClick={()=>{setEditing(true);setSlot(null)}}>Customize Manager</button></div>
 </div>;
}

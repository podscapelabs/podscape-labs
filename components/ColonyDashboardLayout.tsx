"use client";
import {useEffect,useState,type ReactNode} from "react";
import {WorkspaceEditBlock,WorkspaceEditToolbar,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import home from "./PodscapeHome.module.css";
import styles from "@/app/keeper/[id]/ColonyWorkspace.module.css";

const groups={
 "Quick actions":[["shortcuts","Colony tools","Care, schedules, settings and QR"]],
 "Care & routines":[["care","Care at a glance","Misting, feeding and care shortcuts"],["activity","Recent care","The latest recorded care actions"]],
 "Colony records":[["population","Population & breeding","Recorded size and breeding status"],["environment","Enclosure & environment","Saved habitat and enclosure information"],["observations","Colony notes","Record notes and observations"]]
} as const;
export const colonyWidgetIds=["shortcuts","care","population","environment","observations","activity"] as const;
export type ColonyWidgetId=(typeof colonyWidgetIds)[number];
type Layout={order:ColonyWidgetId[];visible:ColonyWidgetId[]};
const defaultVisible:ColonyWidgetId[]=["shortcuts","care","population","observations"];
export const defaultColonyLayout=():Layout=>({order:[...colonyWidgetIds],visible:[...defaultVisible]});
export function normalizeColonyLayout(value:unknown):Layout{
 if(!value||typeof value!=="object")return defaultColonyLayout();
 const raw=value as Partial<Layout>;
 const order=[...uniqueAllowed(Array.isArray(raw.order)?raw.order:[],colonyWidgetIds),...colonyWidgetIds].filter((x,i,a)=>a.indexOf(x)===i);
 const visible=uniqueAllowed(Array.isArray(raw.visible)?raw.visible:defaultVisible,colonyWidgetIds);
 return {order,visible};
}
const labels:Record<ColonyWidgetId,string>={shortcuts:"Colony tools",care:"Care at a glance",population:"Population & breeding",environment:"Enclosure & environment",observations:"Colony notes",activity:"Recent care"};
export function ColonyDashboardLayout({scope,colonyId,widgets,forceVisible}:{
 scope:string;colonyId:string;widgets:Record<ColonyWidgetId,ReactNode>;forceVisible?:ColonyWidgetId
}){
 const storageKey="podscape-colony-dashboard-v1:"+scope+":"+colonyId;
 const [layout,setLayout]=useState<Layout>(defaultColonyLayout);
 const [ready,setReady]=useState(false);
 const [editing,setEditing]=useState(false);
 const [libraryOpen,setLibraryOpen]=useState(false);
 useEffect(()=>{
  try{const saved=localStorage.getItem(storageKey);setLayout(saved?normalizeColonyLayout(JSON.parse(saved)):defaultColonyLayout())}
  catch{setLayout(defaultColonyLayout())}
  setReady(true);
 },[storageKey]);
 const update=(next:Layout)=>{const clean=normalizeColonyLayout(next);setLayout(clean);try{localStorage.setItem(storageKey,JSON.stringify(clean))}catch{}};
 const visible=layout.order.filter(id=>layout.visible.includes(id)||id===forceVisible);
 const reorder=(from:ColonyWidgetId,to:ColonyWidgetId)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const move=(id:ColonyWidgetId,delta:number)=>update({...layout,order:moveBlock(layout.order,visible,id,delta)});
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<ColonyWidgetId>("colony",visible,reorder);
 const done=()=>{stop();setEditing(false)};
 const reset=()=>{if(!window.confirm("Reset this colony dashboard? Your care records, notes and other colony layouts will not change."))return;stop();update(defaultColonyLayout())};
 const toggle=(id:ColonyWidgetId)=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(x=>x!==id):[...layout.visible,id]});
 return <div className={styles.colonyDashboard} data-workspace-root="colony"
  onPointerMove={event=>{if(editing)dragMove(event)}} onPointerUp={()=>{if(editing)stop()}} onPointerCancel={()=>{if(editing)stop()}}>
  {!editing?<div className={styles.dashboardHeading}>
    <div><p>YOUR COLONY, YOUR SPACE</p><h2>Colony dashboard</h2><small>See what matters. Open a focused workspace for more.</small></div>
    <button type="button" onClick={()=>setLibraryOpen(true)}>✎ Customize</button>
   </div>:<WorkspaceEditToolbar title="Arrange your colony" description="Drag or move widgets. Your changes apply to this colony on this device." onAdd={()=>{done();setLibraryOpen(true)}} onReset={reset} onDone={done}/>}
  <div className={styles.colonyWidgetGrid}>
   {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="colony" label={labels[id]} index={index} count={visible.length} editing={editing} dragging={dragging===id} required={false}
     onMove={move} onRemove={toggle} begin={begin} move={dragMove} stop={stop} onLongPress={()=>setEditing(true)}>
     {widgets[id]}
    </WorkspaceEditBlock>)}
  </div>
  {ready&&!editing?<div className={styles.addWidgetFooter}><button type="button" onClick={()=>setLibraryOpen(true)}>＋ Add widgets</button></div>:null}
  {ready&&!visible.length?<p className={styles.emptyDashboard}>This colony dashboard is clear. Add a widget to begin.</p>:null}
  {libraryOpen?<div className={home.homeEditorOverlay} onPointerDown={event=>{if(event.target===event.currentTarget)setLibraryOpen(false)}}>
   <div className={styles.colonyWidgetLibrary} role="dialog" aria-modal="true" aria-labelledby="colony-widget-heading">
    <header className={styles.libraryHeader}><div><small>PERSONALIZE THIS COLONY</small><h2 id="colony-widget-heading">Colony widgets</h2></div><button type="button" onClick={()=>setLibraryOpen(false)}>Done</button></header>
    <p>Choose what&apos;s useful to you. Every colony can have its own layout; hiding widgets never changes your records.</p>
    <div className={styles.libraryControls}><span>{visible.length} of {colonyWidgetIds.length} shown</span><button type="button" onClick={()=>{setLibraryOpen(false);setEditing(true)}}>Arrange widgets</button></div>
    {Object.entries(groups).map(([group,items])=><section className={styles.libraryGroup} key={group}>
      <h3>{group}</h3><div className={styles.libraryGrid}>{items.map(([id,title,description])=><article className={styles.libraryCard} key={id}>
       <strong>{title}</strong><small>{description}</small><button type="button" aria-pressed={layout.visible.includes(id as ColonyWidgetId)} onClick={()=>toggle(id as ColonyWidgetId)}>{layout.visible.includes(id as ColonyWidgetId)?"✓ Added":"+ Add widget"}</button>
      </article>)}</div>
     </section>)}
    <footer className={styles.libraryFooter}><button type="button" onClick={reset}>Reset colony</button><button type="button" onClick={()=>setLibraryOpen(false)}>Done</button></footer>
   </div>
  </div>:null}
 </div>;
}

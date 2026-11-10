"use client";

import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useShortcutEditor} from "./useShortcutEditor";
import {moveNavigationSlot} from "./navigation-customization";
import {HomeCanvasEditContext} from "./HomeCanvasEditContext";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import styles from "@/app/keeper/page.module.css";
import homeStyles from "./PodscapeHome.module.css";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import {WorkspaceEditToolbar,WorkspaceEditBlock,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {ManagerCareOverview,ManagerActivityFeed,ManagerInsights,type ManagerBin,type ManagerEvent} from "./ManagerCareWidgets";
import {recordExperienceAction} from "./experience-achievements";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import {useWorkspaceEditorDialog} from "./useWorkspaceEditorDialog";

type Section="hero"|"stats"|"care"|"tools"|"activity"|"enclosures"|"insights";
type Tool={id:string;label:string;href:string;icon:PodscapeIconName};
const defaults:Section[]=["hero","tools","enclosures","care","activity","stats","insights"];
const required:Section[]=["hero","tools"];
const labels:Record<Section,string>={hero:"Manager Hero",stats:"Colony Statistics",care:"Care Overview",tools:"Quick Tools",activity:"Recent Activity",enclosures:"Your Enclosures",insights:"Colony Insights"};
const key="podscape-manager-layout-v1";
const library:Tool[]=[
 {id:"scan",label:"Scan bin",href:"/keeper/scan",icon:"scan"},
 {id:"qr",label:"Create QR",href:"/keeper/qr",icon:"qr"},
 {id:"bulkqr",label:"Bulk QR labels",href:"/keeper/qr?mode=bulk",icon:"qr"},
 {id:"add",label:"Add bin",href:"/keeper/new",icon:"bin"},
 {id:"care",label:"Log care",href:"/keeper/scan?manual=1",icon:"droplet"},
 {id:"schedule",label:"Schedule",href:"/keeper/schedule",icon:"calendar"},
 {id:"notes",label:"Observations",href:"/keeper/collection?intent=notes",icon:"note"},
 {id:"colonies",label:"All colonies",href:"/keeper/collection",icon:"jar"},
 {id:"history",label:"Care history",href:"/keeper/activity",icon:"note"},
 {id:"activity",label:"Recent activity",href:"/keeper/activity",icon:"note"}
];
type Layout={order:Section[];visible:Section[];tools:string[]};
const initial:Layout={order:defaults,visible:["hero","tools","enclosures","care"],tools:["scan","care","colonies","add","schedule","qr"]};
const detailed:Layout={order:defaults,visible:[...defaults],tools:[...initial.tools]};
function normalize(value:unknown):Layout{
 if(!value||typeof value!=="object")return initial;
 const raw=value as Partial<Layout>;
 const previousDefault=["stats","care","tools","activity","enclosures","insights"];
 const oldUntouched=Array.isArray(raw.order)&&raw.order.join("|")===previousDefault.join("|");
 const previousLaunchVisible=["stats","care","tools","activity","enclosures"];
 const previousCompactVisible=["tools","enclosures","care","activity","stats"];
 const untouchedVisibility=Array.isArray(raw.visible)&&[previousLaunchVisible,previousCompactVisible].some(items=>items.length===raw.visible!.length&&items.every(item=>raw.visible!.includes(item as Section)));
 const untouchedTools=Array.isArray(raw.tools)&&raw.tools.join("|")==="scan|qr|add|care|schedule|notes";
 const savedOrder=oldUntouched?[...defaults]:[...uniqueAllowed(Array.isArray(raw.order)?raw.order:[],defaults),...defaults].filter((v,i,a)=>a.indexOf(v)===i);
 const order:Section[]=["hero","tools",...savedOrder.filter(v=>!required.includes(v))];
 // Existing layouts keep their custom selections, but gain the new care/activity widgets on upgrade.
 const legacy=Array.isArray(raw.order)&&!raw.order.some(v=>v==="care"||v==="activity"||v==="insights");
 const visible=Array.isArray(raw.visible)?(oldUntouched&&untouchedVisibility?initial.visible:defaults.filter(v=>required.includes(v)||raw.visible!.includes(v)||(legacy&&(v==="care"||v==="activity")))):initial.visible;
 const tools=Array.isArray(raw.tools)?(oldUntouched&&untouchedTools?initial.tools:raw.tools.filter(v=>library.some(t=>t.id===v)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6)):initial.tools;
 return {order,visible,tools:[...tools,...initial.tools.filter(id=>!tools.includes(id))].slice(0,6)};
}

function ManagerQuickShortcuts({ids,change,primaryHref,canvasEditing}:{ids:string[];change:(ids:string[])=>void;primaryHref:string;canvasEditing:boolean}){
 const router=useRouter();
 const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change,canvasEditing);
 const current=library.find(tool=>tool.id===ids[selected])||library[0];
 const destination=(tool:Tool)=>tool.href;
 return <>
  {editing&&!canvasEditing?<div className={homeStyles.jiggleToolbar} role="region" aria-label="Customize Manager shortcuts">
    <span className={homeStyles.jiggleHint}><PodscapeLineIcon name="grip" /> <strong>Arrange your shortcuts</strong><small>Drag icons or use the move buttons. Tap one to replace it.</small></span>
    <button type="button" className={homeStyles.jiggleDone} onClick={done}>Done</button>
    <label className={homeStyles.jigglePicker}>Replace {current.label}
     <select value={current.id} onChange={event=>change(swapManagerSlot(ids,selected,event.target.value))}>
      {library.map(tool=><option key={tool.id} value={tool.id}>{tool.label}{ids.includes(tool.id)&&tool.id!==current.id?" (swap)":""}</option>)}
     </select>
    </label>
    <div className={homeStyles.shortcutMoveControls} role="group" aria-label="Move selected Manager shortcut">
      <button type="button" disabled={selected<=0} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}} aria-label={`Move ${current.label} left`}>← Left</button>
      <button type="button" disabled={selected>=ids.length-1} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}} aria-label={`Move ${current.label} right`}>Right →</button>
    </div>
    <button type="button" className={homeStyles.jiggleReset} onClick={()=>{if(confirmWorkspaceReset("manager-shortcuts")){change([...initial.tools]);setSelected(0)}}}>Reset shortcuts</button>
   </div>:null}
   {canvasEditing?<div className={homeStyles.inlineShortcutPicker}><span>Drag shortcuts to reorder · Tap one to replace</span>
    <label>Replace {current.label}<select value={current.id} onChange={event=>change(swapManagerSlot(ids,selected,event.target.value))}>{library.map(tool=><option key={tool.id} value={tool.id}>{tool.label}</option>)}</select></label>
    <div className={homeStyles.shortcutMoveControls} role="group" aria-label="Move selected Manager shortcut">
      <button type="button" disabled={selected<=0} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}} aria-label={`Move ${current.label} left`}>← Left</button>
      <button type="button" disabled={selected>=ids.length-1} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}} aria-label={`Move ${current.label} right`}>Right →</button>
    </div>
    <button type="button" onClick={()=>{change([...initial.tools]);setSelected(0)}}>Reset shortcuts</button>
   </div>:null}
   <nav className={`${homeStyles.shortcuts} ${styles.managerHomeShortcuts} ${editing?homeStyles.shortcutEditing:""}`} aria-label="Manager shortcuts">
    {ids.map((id,index)=>{const tool=library.find(item=>item.id===id);if(!tool)return null;const dragHandlers=handlers(index);
      return <button type="button" key={id} data-shortcut-index={index} className={`${homeStyles.shortcut} ${index%3===0?homeStyles.sand:index%3===1?homeStyles.sage:homeStyles.rose} ${editing?homeStyles.jiggling:""} ${editing&&selected===index?homeStyles.shortcutSelected:""}`}
       aria-label={editing?`Choose or drag ${tool.label}`:tool.label} style={editing?{animationDelay:`${index*-75}ms`}:undefined}
       {...dragHandlers} onClick={event=>{dragHandlers.onClick(event);if(!event.defaultPrevented)router.push(destination(tool))}}>
       <span className={homeStyles.shortcutIcon}><PodscapeLineIcon name={tool.icon}/></span><span>{tool.label}</span>
      </button>;
    })}
   </nav>
 </>;
}
function swapManagerSlot(ids:string[],slot:number,id:string){
 const next=[...ids],previous=next.indexOf(id);
 if(previous>=0)next[previous]=ids[slot];
 next[slot]=id;
 return next;
}

export function ManagerWorkspace({hero,stats,enclosures,bins,events,activityAvailable,scope,primaryHref}:{hero:ReactNode;stats:ReactNode;enclosures:ReactNode;bins:ManagerBin[];events:ManagerEvent[];activityAvailable:boolean;scope:string;primaryHref:string}){
 const router=useRouter();
 const storageKey=key+":"+scope;
 const [layout,setLayout]=useState<Layout>(initial);
 const [ready,setReady]=useState(false);
 const [editing,setEditing]=useState(false);
 const [canvasEditing,setCanvasEditing]=useState(false);
 const [slot,setSlot]=useState<number|null>(null);
 const dialogRef=useWorkspaceEditorDialog(editing,()=>{setEditing(false);setSlot(null)});
 const [query,setQuery]=useState("");
 const [showDirectory,setShowDirectory]=useState(false);
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
 const update=(next:Layout)=>{setLayout(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}if(ready&&JSON.stringify(next)!==JSON.stringify(layout)&&JSON.stringify(next)!==JSON.stringify(initial))void recordExperienceAction("manager_personalized",{order:next.order,visible:next.visible,tools:next.tools,changed:true,changedOrder:next.order.join("|")!==initial.order.join("|")});};
 const swap=(id:string)=>{if(slot===null)return;const next=[...layout.tools];const prior=next.indexOf(id);if(prior>=0){[next[slot],next[prior]]=[next[prior],next[slot]]}else next[slot]=id;update({...layout,tools:next});setSlot(null)};
 const move=(id:Section,dir:number)=>update({...layout,order:moveBlock(layout.order,layout.visible,id,dir)});
 const reorder=(from:Section,to:Section)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const visible=layout.order.filter(id=>layout.visible.includes(id));
 const matching=query.trim().toLocaleLowerCase();
 const matchingBins=matching?bins.filter(bin=>[bin.name,bin.label,bin.species,bin.status].some(value=>value?.toLocaleLowerCase().includes(matching))).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)):[];
 const searchResults=matchingBins.slice(0,8);
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<Section>("manager",visible,reorder);
 const finishCanvas=()=>{stop();editAnchor.current=null;setCanvasEditing(false)};
 const resetToDefault=()=>{if(!confirmWorkspaceReset("manager"))return;stop();update({...initial,order:[...defaults],visible:[...initial.visible],tools:[...initial.tools]});setSlot(null)};
 const applyPreset=(preset:"compact"|"detailed")=>{const base=preset==="compact"?initial:detailed;update({...layout,order:[...base.order],visible:[...base.visible]});setSlot(null)};
 const sections:Record<Section,ReactNode>={
  hero:<>{hero}
  <section className={styles.managerPrimarySearch} role="search" aria-label="Search your colonies"><div className={styles.managerFinder}>
    <div className={styles.managerSearchField}><span aria-hidden="true"><PodscapeLineIcon name="search"/></span><input id="manager-collection-search" aria-label="Search your collection" type="search" enterKeyHint="search" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Escape"){setQuery("");event.currentTarget.blur()}else if(event.key==="Enter"&&searchResults.length){event.preventDefault();router.push("/keeper/"+searchResults[0].id)}}} placeholder="Find a species, bin or enclosure…" autoComplete="off"/>{query?<button type="button" onClick={()=>setQuery("")} aria-label="Clear collection search">×</button>:null}</div>
    {matching?<div className={styles.managerSearchResults} role="region" aria-live="polite" aria-label="Matching colonies">{searchResults.length?<p className={styles.managerSearchCount}>{matchingBins.length} matching {matchingBins.length===1?"colony":"colonies"}{matchingBins.length>8?" · Showing 8 most recently updated":""}</p>:null}{searchResults.length?searchResults.map(bin=><Link key={bin.id} href={`/keeper/${bin.id}`}><strong>{bin.species}</strong><span>{bin.name}{bin.label?" · "+bin.label:""} · {bin.quantity} recorded</span><b aria-hidden="true">→</b></Link>):<p>No colonies match “{query}”. <Link href="/keeper/collection">Browse all colonies →</Link></p>}</div>:null}
  </div></section>
  </>,
  stats,
  care:<ManagerCareOverview bins={bins}/>,
  activity:<ManagerActivityFeed events={events} available={activityAvailable}/>,
  insights:<ManagerInsights bins={bins} events={events}/>,
  enclosures,
  tools:<section className={styles.section} key="tools"><header><h2>Your shortcuts</h2></header>
    <ManagerQuickShortcuts ids={layout.tools} change={ids=>update({...layout,tools:ids})} primaryHref={primaryHref} canvasEditing={canvasEditing}/>
  </section>
 };
 return <HomeCanvasEditContext.Provider value={canvasEditing}><div className={`${styles.managerWorkspace} ${canvasEditing?homeStyles.homeCanvasEditing:""}`} data-workspace-root="manager" onPointerMove={event=>{if(canvasEditing)dragMove(event)}} onPointerUp={()=>{if(canvasEditing)stop()}} onPointerCancel={()=>{if(canvasEditing)stop()}}>
{!canvasEditing&&<button type="button" className={homeStyles.desktopDashboardEdit} onClick={()=>enterCanvas()} aria-label="Edit Manager dashboard"><PodscapeLineIcon name="edit"/> Edit Manager</button>}
  {canvasEditing?<WorkspaceEditToolbar title="Arrange your Manager" description="Drag sections to arrange your workspace. Quick Tools stay grouped." onAdd={()=>{finishCanvas();setEditing(true);setSlot(null)}} onReset={resetToDefault} onDone={finishCanvas}/>:null}
  {editing?<div className={homeStyles.homeEditorOverlay} onPointerDown={e=>{if(e.target===e.currentTarget){setEditing(false);setSlot(null)}}}>
   <div className={`${homeStyles.widgetEditor} ${homeStyles.widgetLibrary}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="manager-widget-title">
    <div className={homeStyles.homeEditorHead}><div><small>YOUR WORKSPACE, YOUR WAY</small><h2 id="manager-widget-title">Widget Library</h2></div><button type="button" onClick={()=>{setEditing(false);setSlot(null)}}>Done</button></div>
    <p>Keep the dashboard simple or bring your entire collection overview onto one screen. Every keeper tool remains available either way.</p>
    <div className={styles.managerPresets} role="group" aria-label="Dashboard starting layouts"><button type="button" onClick={()=>applyPreset("compact")}>Compact dashboard <small>Shortcuts, colonies and care</small></button><button type="button" onClick={()=>applyPreset("detailed")}>Detailed dashboard <small>All collection widgets</small></button></div>
    <div className={homeStyles.widgetLibraryActions}><span>{layout.visible.length} of {defaults.length} sections shown</span><button type="button" onClick={()=>{setEditing(false);setSlot(null);setCanvasEditing(true)}}>Arrange Manager</button></div>
    {slot!==null?<div className={styles.managerEditor}><div className={styles.managerPickerTitle}><h3>Replace Quick Tool {slot+1}</h3><button type="button" onClick={()=>setSlot(null)} aria-label="Close tool picker">×</button></div><div className={styles.managerToolLibrary}>{library.map(tool=><button type="button" key={tool.id} onClick={()=>swap(tool.id)}><PodscapeLineIcon name={tool.icon}/><span>{tool.label}</span>{layout.tools[slot]===tool.id?" ✓":""}</button>)}</div></div>:
    <div className={homeStyles.widgetLibraryGroups}><section><h3>Manager widgets</h3><div className={homeStyles.widgetGallery}>{defaults.map(id=><article key={id} className={homeStyles.widgetGalleryCard}><div className={homeStyles.widgetPreview}><span><PodscapeLineIcon name={id==="hero"?"jar":id==="stats"?"leaf":id==="tools"?"scan":id==="care"?"droplet":id==="activity"?"note":id==="insights"?"community":"jar"}/></span><div><strong>{labels[id]}</strong><small>{id==="hero"?"Your Manager introduction and always-available colony search":id==="stats"?"Species, bins and population":id==="care"?"Due misting and schedules":id==="tools"?"Your everyday keeper actions":id==="activity"?"Latest care records":id==="insights"?"Trends from your records":"Recently updated enclosures"}</small></div></div><div className={homeStyles.widgetGalleryCopy}><strong>{labels[id]}</strong><p>{id==="tools"?"Customize your six quick actions.":"Choose whether this section appears on your Manager."}</p><button type="button" className={layout.visible.includes(id)?homeStyles.widgetRemove:homeStyles.widgetAdd} disabled={required.includes(id)} onClick={()=>{if(!required.includes(id))update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(v=>v!==id):[...layout.visible,id]})}}>{required.includes(id)?"✓ Always included":layout.visible.includes(id)?"✓ Added · Remove":"+ Add to Manager"}</button>{id==="tools"?<div className={styles.managerToolLibrary} aria-label="Choose a Quick Tool slot to edit">{layout.tools.map((toolId,i)=><button type="button" key={i} onClick={()=>setSlot(i)} aria-label={`Replace ${library.find(tool=>tool.id===toolId)?.label||"Quick Tool"} in slot ${i+1}`}><span>{i+1}. {library.find(tool=>tool.id===toolId)?.label||"Quick Tool"}</span><span aria-hidden="true">✎</span></button>)}</div>:null}</div></article>)}</div></section></div>}
    <div className={homeStyles.widgetLibraryFooter}><small>{layout.visible.length} widget{layout.visible.length===1?"":"s"} on your Manager · All tools always accessible · Saved on this device</small><button type="button" onClick={resetToDefault}>Reset layout</button></div>
   </div>
  </div>:null}
  {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="manager" label={labels[id]} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={required.includes(id)} onMove={move} onRemove={id=>update({...layout,visible:layout.visible.filter(v=>v!==id)})} begin={begin} move={dragMove} stop={stop} interactiveChildren={id==="tools"} onLongPress={()=>enterCanvas(id)}>{sections[id]}</WorkspaceEditBlock>)}
  {ready&&layout.visible.length===0?<div className={styles.managerHint}>All Manager sections are hidden. <button type="button" className={styles.managerTextButton} onClick={()=>{setEditing(true);setSlot(null)}}>Open Widget Library</button></div>:null}
  <div className={styles.managerFooterNav}><button type="button" aria-expanded={showDirectory} aria-controls="manager-tool-directory" onClick={()=>setShowDirectory(value=>!value)}><PodscapeLineIcon name="menu"/><span>{showDirectory?"Hide all tools":"Explore all Manager tools"}</span><b aria-hidden="true">{showDirectory?"−":"+"}</b></button></div>
  {ready&&!canvasEditing?<div className={homeStyles.addWidgetFooter}><button type="button" className={homeStyles.addWidgetButton} onClick={()=>{setEditing(true);setSlot(null)}}><span aria-hidden="true">＋</span> Add Widget</button></div>:null}
  {showDirectory?<nav id="manager-tool-directory" className={styles.managerDirectory} aria-label="All Manager tools">{library.map(tool=><Link key={tool.id} href={tool.id==="care"?"/keeper/scan?manual=1":tool.id==="notes"?(primaryHref!=="/keeper/collection"?primaryHref+"#observation":"/keeper/collection"):tool.id==="history"?"/keeper/activity":tool.href}><PodscapeLineIcon name={tool.icon}/><span>{tool.label}</span><b aria-hidden="true">→</b></Link>)}</nav>:null}
 </div></HomeCanvasEditContext.Provider>;
}

"use client";

import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import {WorkspaceEditBlock,WorkspaceEditToolbar,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import {recordExperienceAction} from "./experience-achievements";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import {useWorkspaceEditorDialog} from "./useWorkspaceEditorDialog";
import {speciesStorageKey} from "@/lib/ui-preferences";
import {portalWidgetGroups,widgetAllowed,widgetGroup,widgetPurpose} from "./workspace-widget-policy";
import homeStyles from "./PodscapeHome.module.css";
import styles from "./SpeciesProfile.module.css";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";

// Keep stable IDs to preserve saved layouts across this visual redesign.
const speciesWidgetIcons: Record<string,PodscapeIconName> = {care:"jar",moisture:"droplet",about:"book",traits:"leaf",guides:"book",breeding:"grid",taxonomy:"search",nutrition:"leaf",behaviour:"community",habitatAdvanced:"jar",sources:"book",personal:"bookmark",navigation:"arrow-right"};
export const speciesWidgetIds=["care","moisture","about","traits","guides","breeding","taxonomy","nutrition","behaviour","habitatAdvanced","sources","personal","navigation"] as const;
export type SpeciesWidgetId=(typeof speciesWidgetIds)[number];
export const speciesWidgetLabels:Record<SpeciesWidgetId,string>={
 about:"Species overview",care:"At a Glance",moisture:"Moisture & Humidity",
 traits:"Notable Traits",guides:"Related Field Guides",
 breeding:"Breeding & Growth",taxonomy:"Origins & Identity",nutrition:"Feeding & Nutrition",habitatAdvanced:"Habitat & Setup",behaviour:"Species Characteristics",sources:"Research & Sources",personal:"My Species Tools",navigation:"Explore Species"
};
const descriptions:Record<SpeciesWidgetId,string>={
 about:"A short introduction to the species",care:"Quick beginner suitability, temperature, activity and colony growth",
 moisture:"Substrate gradient, approximate air humidity and moist-area coverage",
 traits:"Distinctive characteristics",guides:"Supporting species-specific guides",
 breeding:"Brood size, reproduction and development",taxonomy:"Distribution, scientific names, morph origins and identification",nutrition:"Staple diet, supplements and dietary cautions",behaviour:"Adult size, lifespan, defence and visibility",
 habitatAdvanced:"Ventilation, substrate, enclosure and natural microhabitat",sources:"Original references and research scope",personal:"Collection and pin-to-home shortcuts",navigation:"Related species guides and catalogue navigation"
};
const defaultOrder:SpeciesWidgetId[]=["care","moisture","behaviour","habitatAdvanced","nutrition","breeding","taxonomy","about","traits","guides","sources","personal","navigation"];
const defaultVisible:SpeciesWidgetId[]=["care","moisture","behaviour","habitatAdvanced","about","traits","personal","navigation"];
type Layout={order:SpeciesWidgetId[];visible:SpeciesWidgetId[]};
const defaultLayout=():Layout=>({order:[...defaultOrder],visible:[...defaultVisible]});
function normalize(value:unknown):Layout{
 if(!value||typeof value!=="object")return defaultLayout();
 const obj=value as Partial<Layout>;
 // Retired fallback panels merge into their canonical specialist widgets.
 // Preserve saved visibility and ordering; never add a duplicate to the library.
 const migrate=(id:unknown)=>id==="environment"?"moisture":id==="feeding"?"nutrition":id==="habitat"?"habitatAdvanced":id;
 const oldOrder:unknown[]=Array.isArray(obj.order)?obj.order:[];
 const oldVisible:unknown[]=Array.isArray(obj.visible)?obj.visible:defaultVisible;
 const ordered=oldOrder.map(migrate);
 const order=[...uniqueAllowed(ordered,defaultOrder),...defaultOrder].filter((id,i,all)=>all.indexOf(id)===i);
 const combined=oldVisible.map(migrate);
 const migrated=combined.includes("behaviour")&&!combined.includes("care")?[...combined,"care"]:combined;
 // Legacy profiles had personal/navigation actions outside the customizable canvas.
 const migratedFooter=oldOrder.includes("personal")||oldOrder.includes("navigation")?migrated:[...migrated,"personal","navigation"];
 const visible=uniqueAllowed(migratedFooter,defaultOrder);
 return {order,visible};
}

/** The storage scope never contains a species ID: one layout is shared by every species page. */
export function SpeciesDashboardWorkspace({widgets,scope,preview=false}:{widgets:Partial<Record<SpeciesWidgetId,ReactNode>>;scope:string;preview?:boolean}){
 const storageKey=speciesStorageKey(scope);
 const [layout,setLayout]=useState<Layout>(defaultLayout);
 const [hydrated,setHydrated]=useState(false);
 const [canvasEditing,setCanvasEditing]=useState(false);
 const [libraryOpen,setLibraryOpen]=useState(false);
 const dialogRef=useWorkspaceEditorDialog(libraryOpen,()=>setLibraryOpen(false));
 const editAnchor=useRef<{id:SpeciesWidgetId;top:number}|null>(null);
 useEffect(()=>{
  const load=()=>{try{const raw=localStorage.getItem(storageKey);if(raw)setLayout(normalize(JSON.parse(raw)))}catch{}};
  load();setHydrated(true);
  if(preview)return;
  const onWorkspace=(event:Event)=>{
   const detail=(event as CustomEvent<{area:string;userId:string}>).detail;
   if(detail?.area==="species"&&detail.userId===scope)load();
  };
  const onStorage=(event:StorageEvent)=>{if(event.key===storageKey)load()};
  window.addEventListener("podscape-workspace-layout-changed",onWorkspace);
  window.addEventListener("storage",onStorage);
  return ()=>{window.removeEventListener("podscape-workspace-layout-changed",onWorkspace);window.removeEventListener("storage",onStorage)};
 },[storageKey,scope,preview]);
 const update=(value:Layout)=>{setLayout(value);try{localStorage.setItem(storageKey,JSON.stringify(value));if(!preview&&scope!=="guest")window.dispatchEvent(new CustomEvent("podscape-workspace-layout-changed",{detail:{area:"species",userId:scope}}))}catch{}const base=defaultLayout();if(!preview&&hydrated&&JSON.stringify(value)!==JSON.stringify(layout)&&JSON.stringify(value)!==JSON.stringify(base))void recordExperienceAction("species_personalized",{order:value.order,visible:value.visible,changedOrder:value.order.join("|")!==base.order.join("|")});};
 const enterCanvas=(id?:SpeciesWidgetId)=>{
  if(id){
   const node=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="species"]')).find(el=>el.dataset.workspaceBlock===id);
   editAnchor.current=node?{id,top:node.getBoundingClientRect().top}:null;
  }else editAnchor.current=null;
  setCanvasEditing(true);
 };
 useLayoutEffect(()=>{
  if(!canvasEditing||!editAnchor.current)return;
  const {id,top}=editAnchor.current;editAnchor.current=null;
  const node=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="species"]')).find(el=>el.dataset.workspaceBlock===id);
  if(node){const delta=node.getBoundingClientRect().top-top;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:"instant"})}
 },[canvasEditing]);
 const available=speciesWidgetIds.filter(id=>widgets[id]!=null);
 const visible=layout.order.filter(id=>layout.visible.includes(id)&&available.includes(id));
 const move=(id:SpeciesWidgetId,delta:number)=>update({...layout,order:moveBlock(layout.order,visible,id,delta)});
 const reorder=(from:SpeciesWidgetId,to:SpeciesWidgetId)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<SpeciesWidgetId>("species",visible,reorder);
 const done=()=>{stop();setCanvasEditing(false);editAnchor.current=null};
 const reset=()=>{
  if(!confirmWorkspaceReset("species"))return;
  stop();update(defaultLayout());
 };
 const toggle=(id:SpeciesWidgetId)=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(v=>v!==id):[...layout.visible,id]});
 return <div className={`${styles.speciesWorkspace} ${canvasEditing?homeStyles.homeCanvasEditing:""}`} data-workspace-root="species" onPointerMove={event=>{if(canvasEditing)dragMove(event)}} onPointerUp={()=>{if(canvasEditing)stop()}} onPointerCancel={()=>{if(canvasEditing)stop()}}>
{!preview&&!canvasEditing&&<button type="button" className={homeStyles.desktopDashboardEdit} onClick={()=>enterCanvas()} aria-label="Edit species dashboard"><PodscapeLineIcon name="edit"/> Edit Species Dashboard</button>}
  {canvasEditing&&<WorkspaceEditToolbar title="Arrange species profiles" description="Drag blocks to move them. Changes apply to every species profile." onAdd={()=>{done();setLibraryOpen(true)}} onReset={reset} onDone={done}/>}
  {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="species" label={speciesWidgetLabels[id]} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={false} onMove={move} onRemove={item=>toggle(item)} begin={begin} move={dragMove} stop={stop} onLongPress={!preview?()=>enterCanvas(id):undefined}>{widgets[id]}</WorkspaceEditBlock>)}
  {!preview&&hydrated&&!canvasEditing&&<div className={homeStyles.addWidgetFooter}><button type="button" className={homeStyles.addWidgetButton} onClick={()=>setLibraryOpen(true)}><span aria-hidden="true">＋</span> Add Widget</button></div>}
  {available.length===0&&<p className={styles.empty}>Species information is being prepared.</p>}
  {libraryOpen&&!preview&&<div className={homeStyles.homeEditorOverlay} onPointerDown={event=>{if(event.target===event.currentTarget)setLibraryOpen(false)}}>
   <div className={homeStyles.widgetLibrary} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="species-widget-library">
    <div className={homeStyles.homeEditorHead}><div><small>YOUR HOBBY, YOUR SPACE</small><h2 id="species-widget-library">Species widgets</h2></div><button type="button" onClick={()=>setLibraryOpen(false)}>Done</button></div>
    <p>Pick the information you care about. Hold any dashboard block to rearrange or remove it. Your layout carries across all species; missing facts remain hidden until researched.</p>
    <div className={homeStyles.widgetLibraryActions}><span>{visible.length} active widgets</span><button type="button" onClick={()=>{setLibraryOpen(false);enterCanvas()}}>Arrange Dashboard</button></div>
    <div className={homeStyles.widgetLibraryGroups}>{portalWidgetGroups.species.map(group=><section key={group}><h3>{group}</h3><div className={homeStyles.widgetGallery}>{speciesWidgetIds.filter(id=>widgetAllowed("species",id)&&widgetGroup("species",id)===group).map(id=><article key={id} className={homeStyles.widgetGalleryCard}><div className={homeStyles.widgetPreview}><span aria-hidden="true"><PodscapeLineIcon name={speciesWidgetIcons[id]} /></span><div><strong>{speciesWidgetLabels[id]}</strong><small>{descriptions[id]}</small></div></div><div className={homeStyles.widgetGalleryCopy}><strong>{speciesWidgetLabels[id]}</strong><p>{available.includes(id)?"Available for this species":"No information for this species yet — your preference still applies to others."}</p><button type="button" className={layout.visible.includes(id)?homeStyles.widgetRemove:homeStyles.widgetAdd} onClick={()=>toggle(id)}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add to Dashboard"}</button></div></article>)}</div></section>)}</div>
    <div className={homeStyles.widgetLibraryFooter}><small>One layout for all species · Saved on this device</small><button type="button" onClick={reset}>Reset layout</button></div>
   </div>
  </div>}
 </div>;
}

"use client";

import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import {WorkspaceEditBlock,WorkspaceEditToolbar,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {moveBlock,dropBlock,uniqueAllowed} from "./workspace-layout";
import homeStyles from "./PodscapeHome.module.css";
import styles from "./SpeciesProfile.module.css";

export const speciesWidgetIds=["care","moisture","about","feeding","habitat","traits","guides","environment","breeding","taxonomy","nutrition","behaviour","habitatAdvanced","sources","personal","navigation"] as const;
export type SpeciesWidgetId=(typeof speciesWidgetIds)[number];
export const speciesWidgetLabels:Record<SpeciesWidgetId,string>={
 about:"Species overview",care:"Basic Care & Behaviour",moisture:"Moisture preference",
 feeding:"Feeding overview",habitat:"Habitat & substrate",traits:"Notable traits",guides:"Related Field Guides",
 environment:"Moisture & Humidity",breeding:"Breeding & Development",taxonomy:"Taxonomy & Origin",nutrition:"Feeding & Nutrition",habitatAdvanced:"Habitat & Setup",behaviour:"Behaviour & Ecology",sources:"Research & Sources",personal:"My Species Tools",navigation:"Explore Species"
};
const descriptions:Record<SpeciesWidgetId,string>={
 about:"A short introduction to the species",care:"Essential care, activity and breeding at a glance",
 moisture:"Its relative dry-to-moist tendency",feeding:"General feeding information",habitat:"Substrate and habitat notes",
 traits:"Distinctive characteristics",guides:"Supporting species-specific guides",
 environment:"Relative humidity, moist-zone coverage and moist-refuge substrate",breeding:"Brood measurements, reproduction and maturity",
 taxonomy:"Identification, scientific names, origins and morphology",nutrition:"Staple diet, supplements and dietary cautions",behaviour:"Defensive behaviour, activity and bioactive suitability",
 habitatAdvanced:"Enclosure setup and natural microhabitat",sources:"Reference links, evidence and review scope",personal:"Collection and pin-to-home shortcuts",navigation:"Related species guides and catalogue navigation"
};
const defaultOrder:SpeciesWidgetId[]=[...speciesWidgetIds];
const defaultVisible:SpeciesWidgetId[]=["care","moisture","about","personal","navigation"];
type Layout={order:SpeciesWidgetId[];visible:SpeciesWidgetId[]};
const defaultLayout=():Layout=>({order:[...defaultOrder],visible:[...defaultVisible]});
function normalize(value:unknown):Layout{
 if(!value||typeof value!=="object")return defaultLayout();
 const obj=value as Partial<Layout>;
 // Migrate layouts saved before Basic Care and Behaviour were combined.
 const oldOrder:unknown[]=Array.isArray(obj.order)?obj.order:[];
 // Behaviour is now a valid specialist widget; never drop it from persisted layouts.
 const ordered=oldOrder;
 const order=[...uniqueAllowed(ordered,defaultOrder),...defaultOrder].filter((v,i,a)=>a.indexOf(v)===i);
 const existing:unknown[]=Array.isArray(obj.visible)?obj.visible:defaultVisible;
 const migrated=existing.includes("behaviour")&&!existing.includes("care")?[...existing,"care"]:existing;
 // First run after the page-footer migration: preserve the original actions as widgets.
 // Later intentional removals are honored because the IDs already exist in saved order.
 const migratedFooter=oldOrder.includes("personal")||oldOrder.includes("navigation")?migrated:[...migrated,"personal","navigation"];
 const visible=uniqueAllowed(migratedFooter,defaultOrder);
 return {order,visible};
}

/** The storage scope never contains a species ID: one layout is shared by every species page. */
export function SpeciesDashboardWorkspace({widgets,scope,preview=false}:{widgets:Partial<Record<SpeciesWidgetId,ReactNode>>;scope:string;preview?:boolean}){
 const storageKey="podscape-species-dashboard-v1:"+scope;
 const [layout,setLayout]=useState<Layout>(defaultLayout);
 const [hydrated,setHydrated]=useState(false);
 const [canvasEditing,setCanvasEditing]=useState(false);
 const [libraryOpen,setLibraryOpen]=useState(false);
 const editAnchor=useRef<{id:SpeciesWidgetId;top:number}|null>(null);
 useEffect(()=>{
  try{const raw=localStorage.getItem(storageKey);if(raw)setLayout(normalize(JSON.parse(raw)))}catch{}
  setHydrated(true);
 },[storageKey]);
 const update=(value:Layout)=>{setLayout(value);try{localStorage.setItem(storageKey,JSON.stringify(value))}catch{}};
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
 const hidden=layout.order.filter(id=>!layout.visible.includes(id)&&available.includes(id));
 const move=(id:SpeciesWidgetId,delta:number)=>update({...layout,order:moveBlock(layout.order,visible,id,delta)});
 const reorder=(from:SpeciesWidgetId,to:SpeciesWidgetId)=>update({...layout,order:dropBlock(layout.order,from,to)});
 const {dragging,begin,move:dragMove,stop}=useWorkspaceDrag<SpeciesWidgetId>("species",visible,reorder);
 const done=()=>{stop();setCanvasEditing(false);editAnchor.current=null};
 const reset=()=>{
  if(!window.confirm("Reset your Species Dashboard across all species? No species information or collection records will be changed."))return;
  stop();update(defaultLayout());
 };
 const toggle=(id:SpeciesWidgetId)=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(v=>v!==id):[...layout.visible,id]});
 const reveal=(id:SpeciesWidgetId)=>{if(!layout.visible.includes(id))toggle(id);setLibraryOpen(false)};
 return <div className={`${styles.speciesWorkspace} ${canvasEditing?homeStyles.homeCanvasEditing:""}`} data-workspace-root="species" onPointerMove={event=>{if(canvasEditing)dragMove(event)}} onPointerUp={()=>{if(canvasEditing)stop()}} onPointerCancel={()=>{if(canvasEditing)stop()}}>
  {canvasEditing&&<WorkspaceEditToolbar title="Arrange your Species Dashboard" description="Drag blocks to move them. Changes apply to every species profile." onAdd={()=>{done();setLibraryOpen(true)}} onReset={reset} onDone={done}/>}
  {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="species" label={speciesWidgetLabels[id]} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={false} onMove={move} onRemove={item=>toggle(item)} begin={begin} move={dragMove} stop={stop} onLongPress={!preview?()=>enterCanvas(id):undefined}>{widgets[id]}</WorkspaceEditBlock>)}
  {!preview&&hydrated&&!canvasEditing&&<div className={homeStyles.addWidgetFooter}><button type="button" className={homeStyles.addWidgetButton} onClick={()=>setLibraryOpen(true)}><span aria-hidden="true">＋</span> Add Widget</button></div>}
  {available.length===0&&<p className={styles.empty}>Species information is being prepared.</p>}
  {libraryOpen&&!preview&&<div className={homeStyles.homeEditorOverlay} onPointerDown={event=>{if(event.target===event.currentTarget)setLibraryOpen(false)}}>
   <div className={homeStyles.widgetLibrary} role="dialog" aria-modal="true" aria-labelledby="species-widget-library">
    <div className={homeStyles.homeEditorHead}><div><small>YOUR HOBBY, YOUR SPACE</small><h2 id="species-widget-library">Species Widget Library</h2></div><button type="button" onClick={()=>setLibraryOpen(false)}>Done</button></div>
    <p>Pick the information you care about. Hold any dashboard block to rearrange or remove it. Your layout carries across all species; missing facts remain hidden until researched.</p>
    <div className={homeStyles.widgetLibraryActions}><span>{visible.length} active widgets</span><button type="button" onClick={()=>{setLibraryOpen(false);enterCanvas()}}>Arrange Dashboard</button></div>
    <div className={homeStyles.widgetLibraryGroups}><section><h3>Species information</h3><div className={homeStyles.widgetGallery}>{speciesWidgetIds.map(id=><article key={id} className={homeStyles.widgetGalleryCard}><div className={homeStyles.widgetPreview}><span aria-hidden="true">✧</span><div><strong>{speciesWidgetLabels[id]}</strong><small>{descriptions[id]}</small></div></div><div className={homeStyles.widgetGalleryCopy}><strong>{speciesWidgetLabels[id]}</strong><p>{available.includes(id)?"Available for this species":"No information for this species yet — your preference still applies to others."}</p><button type="button" className={layout.visible.includes(id)?homeStyles.widgetRemove:homeStyles.widgetAdd} onClick={()=>toggle(id)}>{layout.visible.includes(id)?"✓ Added · Remove":"+ Add to Dashboard"}</button></div></article>)}</div></section></div>
    <div className={homeStyles.widgetLibraryFooter}><small>One layout for all species · Saved on this device</small><button type="button" onClick={reset}>Reset layout</button></div>
   </div>
  </div>}
 </div>;
}

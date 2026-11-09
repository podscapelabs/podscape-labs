"use client";

import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import {pinKey,readHomePins,writeHomePins,type HomePin,type PinOption} from "./home-pins";
import styles from "./PodscapeHome.module.css";
import {moveBlock,dropBlock,visibleBlocks,uniqueAllowed} from "./workspace-layout";
import {WorkspaceEditToolbar,WorkspaceEditBlock,useWorkspaceDrag} from "./WorkspaceEditCanvas";
import {HomeCanvasEditContext} from "./HomeCanvasEditContext";
import {recordExperienceAction} from "./experience-achievements";

type Tile={title:string;label:string;description:string;href:string;image?:string|null;alt?:string};
export type HomeColony={id:string;name:string;quantity:number;speciesName:string}|null;
export type HomeProgress={level:number;exp:number}|null;
type CoreId="greeting"|"hero"|"shortcuts"|"spotlight";
type BlockId=CoreId|WidgetId;
const coreIds:CoreId[]=["greeting","hero","shortcuts","spotlight"];
const coreLabels:Record<CoreId,string>={greeting:"Welcome Greeting",hero:"Discovery Hero",shortcuts:"Quick Shortcuts",spotlight:"Podscape Spotlight"};
const isCore=(id:BlockId):id is CoreId=>coreIds.includes(id as CoreId);
type WidgetId="recent"|"colony"|"games"|"progress"|"schedule"|"guides"|"community"|"pins";
type WidgetGroup="Discovery"|"My Keeper Tools"|"Play & Community";
type WidgetDef={name:string;description:string;icon:PodscapeIconName;group:WidgetGroup;preview:string;size:"wide"|"compact"};
const definitions:Record<WidgetId,WidgetDef>={
  recent:{name:"Recent & Noteworthy",description:"The newest guide and ways to explore Podscape.",icon:"leaf",group:"Discovery",preview:"Fresh guides · Games · Community",size:"wide"},
  guides:{name:"Field Guide",description:"Jump into a recent care guide.",icon:"book",group:"Discovery",preview:"Continue discovering husbandry",size:"compact"},
  colony:{name:"My Colony",description:"Quick access to your most recently updated enclosure.",icon:"jar",group:"My Keeper Tools",preview:"Colony · Species · Recorded count",size:"compact"},
  progress:{name:"My Progress",description:"View your level and earned EXP at a glance.",icon:"leaf",group:"My Keeper Tools",preview:"Keeper level · Earned EXP",size:"compact"},
  schedule:{name:"Care Schedule",description:"One-tap access to the existing Manager care schedule.",icon:"calendar",group:"My Keeper Tools",preview:"Open your care schedule",size:"compact"},
  games:{name:"Play a Little",description:"Get straight into your Fun Zone activities.",icon:"creative",group:"Play & Community",preview:"Puzzles · Quizzes · Word games",size:"compact"},
  community:{name:"Community",description:"Find your way back to the keeper community.",icon:"community",group:"Play & Community",preview:"Keepers · Creators · Updates",size:"compact"},
  pins:{name:"My Favorites",description:"Your pinned species, games and personal colonies in one place.",icon:"leaf",group:"Discovery",preview:"Pinned species · Games · Colonies",size:"wide"}
};
const available=Object.keys(definitions) as WidgetId[];
const groups:WidgetGroup[]=["Discovery","My Keeper Tools","Play & Community"];
const storageKey="podscape-home-widgets-v2";
const legacyKey="podscape-home-widgets-v1";
const defaultOrder:BlockId[]=["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins"];
const defaultVisible:WidgetId[]=["recent"];
type Layout={order:BlockId[];visible:WidgetId[]};

function readLayout():Layout{
 try{
  const saved=localStorage.getItem(storageKey),legacy=saved?null:localStorage.getItem(legacyKey);
  const value=JSON.parse(saved||legacy||"null");
  if(!value||!Array.isArray(value.order)||!Array.isArray(value.visible))throw Error("No saved layout");
  const oldOrder=uniqueAllowed(value.order as unknown[],defaultOrder);
  const order=legacy?[...coreIds,...new Set(oldOrder),...available.filter(id=>!oldOrder.includes(id))]:[...new Set(oldOrder),...defaultOrder.filter(id=>!oldOrder.includes(id))];
  const visible=uniqueAllowed(value.visible as unknown[],available);
  return {order,visible};
 }catch{return {order:[...defaultOrder],visible:[...defaultVisible]}}
}

export function HomeWidgets({recent,colony,progress,pinOptions,userId,greeting,hero,shortcuts,spotlight}:{recent:Tile[];colony:HomeColony;progress:HomeProgress;pinOptions:PinOption[];userId:string|null;greeting:ReactNode;hero:ReactNode;shortcuts:ReactNode;spotlight:ReactNode}){
  const [layout,setLayout]=useState<Layout>({order:defaultOrder,visible:defaultVisible});
  const [editing,setEditing]=useState(false);
  const [canvasEditing,setCanvasEditing]=useState(false);
  const [pins,setPins]=useState<HomePin[]>([]);
  const [hydrated,setHydrated]=useState(false);
  const dialogRef=useRef<HTMLDivElement>(null);
  const returnFocus=useRef<HTMLElement|null>(null);
  // The editor inserts a toolbar and block handles above the held block.
  // Keep that exact block at its original viewport position when the layout expands.
  const editAnchor=useRef<{id:BlockId;top:number}|null>(null);
  const enterCanvas=(id?:BlockId)=>{
    if(id){
      const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="home"]')).find(node=>node.dataset.workspaceBlock===id);
      editAnchor.current=block?{id,top:block.getBoundingClientRect().top}:null;
    }else editAnchor.current=null;
    setCanvasEditing(true);
    setEditing(false);
  };
  useLayoutEffect(()=>{
    if(!canvasEditing||!editAnchor.current)return;
    const {id,top}=editAnchor.current;
    editAnchor.current=null;
    const block=Array.from(document.querySelectorAll<HTMLElement>('[data-workspace-scope="home"]')).find(node=>node.dataset.workspaceBlock===id);
    if(!block)return;
    const difference=block.getBoundingClientRect().top-top;
    if(Math.abs(difference)>1)window.scrollBy({top:difference,behavior:"instant"});
  },[canvasEditing]);
  useEffect(()=>{
    const refresh=()=>setPins(readHomePins(userId));
    refresh();
    window.addEventListener("storage",refresh);
    window.addEventListener("podscape-home-pins-changed",refresh);
    return ()=>{window.removeEventListener("storage",refresh);window.removeEventListener("podscape-home-pins-changed",refresh)};
  },[userId]);
  useEffect(()=>{
    const refresh=()=>setLayout(readLayout());
    refresh();setHydrated(true);
    window.addEventListener("podscape-home-widgets-changed",refresh);
    return ()=>window.removeEventListener("podscape-home-widgets-changed",refresh);
  },[]);
  useEffect(()=>{
    const open=()=>enterCanvas();
    window.addEventListener("podscape-edit-home",open);
    return ()=>window.removeEventListener("podscape-edit-home",open);
  },[]);
  const close=()=>{setEditing(false);requestAnimationFrame(()=>returnFocus.current?.focus())};
  const finishCanvas=()=>{stopDrag();editAnchor.current=null;setCanvasEditing(false)};
  const resetToDefault=()=>{if(!window.confirm("Reset your homepage to the default layout? This will remove optional widgets from Home and restore the original block order. Your account, colonies and favorites will not be deleted."))return false;stopDrag();update({order:[...defaultOrder],visible:[...defaultVisible]});return true};
  useEffect(()=>{
    if(!editing)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const dialog=dialogRef.current;
    const focusable=dialog?.querySelector<HTMLElement>("button");
    focusable?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();close()}
      if(event.key==="Tab"&&dialog){
        const nodes=Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled])"));
        if(!nodes.length)return;
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }
    };
    window.addEventListener("keydown",onKey);
    return ()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)};
  },[editing]);
  const update=(next:Layout)=>{
    setLayout(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}
    if(userId&&JSON.stringify(next)!==JSON.stringify(layout))void recordExperienceAction("home_personalized",{order:next.order,visible:next.visible});
  };
  const add=(id:WidgetId)=>update({...layout,order:layout.order.includes(id)?layout.order:[...layout.order,id],visible:[...layout.visible.filter(item=>item!==id),id]});
  const remove=(id:WidgetId)=>update({...layout,visible:layout.visible.filter(item=>item!==id)});
  const move=(id:BlockId,direction:number)=>update({...layout,order:moveBlock(layout.order,layout.visible,id,direction,coreIds)});
  const reorder=(from:BlockId,to:BlockId)=>update({...layout,order:dropBlock(layout.order,from,to)});
  const visible=visibleBlocks(layout.order,layout.visible,coreIds);
  const {dragging,begin:beginDrag,move:moveDrag,stop:stopDrag}=useWorkspaceDrag<BlockId>("home",visible,reorder);
  const optionsByKey=new Map(pinOptions.map(item=>[pinKey(item),item]));
  const activePins=pins.flatMap(p=>{const option=optionsByKey.get(pinKey(p));return option?[option]:[]});
  const removePin=(pin:HomePin)=>{const next=pins.filter(p=>pinKey(p)!==pinKey(pin));writeHomePins(userId,next);setPins(next)};
  const guide=recent.find(item=>item.label==="GUIDE");
  const compact=(id:WidgetId,icon:PodscapeIconName,eyebrow:string,title:string,description:string,href:string,cta:string)=>(
    <section className={styles.widgetCard} key={id} aria-label={definitions[id].name}>
      <span className={styles.widgetSymbol}><PodscapeLineIcon name={icon}/></span>
      <div><small>{eyebrow}</small><h3>{title}</h3><p>{description}</p></div>
      <Link href={href}>{cta} →</Link>
    </section>
  );
  return <HomeCanvasEditContext.Provider value={canvasEditing}><section className={`${styles.widgetArea} ${canvasEditing?styles.homeCanvasEditing:""}`} aria-label="Your customizable homepage" data-workspace-root="home" onPointerMove={event=>{if(canvasEditing)moveDrag(event)}} onPointerUp={()=>{if(canvasEditing)stopDrag()}} onPointerCancel={()=>{if(canvasEditing)stopDrag()}}>
{!canvasEditing&&<button type="button" className={styles.desktopDashboardEdit} onClick={()=>enterCanvas()} aria-label="Edit Home dashboard">✎ Edit Home</button>}
    {canvasEditing?<WorkspaceEditToolbar title="Arrange your Home" description="Drag blocks to move them. Shortcuts stay together." onAdd={()=>{finishCanvas();returnFocus.current=document.activeElement as HTMLElement;setEditing(true)}} onReset={resetToDefault} onDone={finishCanvas}/>:null}
    {editing&&<div className={styles.homeEditorOverlay} onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
      <div className={`${styles.widgetEditor} ${styles.widgetLibrary}`} id="podscape-home-widget-editor" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="widget-library-title">
        <div className={styles.homeEditorHead}>
          <div><small>YOUR LITTLE WORLD, YOUR WAY</small><h2 id="widget-library-title">Widget Library</h2></div>
          <button type="button" onClick={close}>Done</button>
        </div>
        <p>Add the widgets you love, remove the ones you don&apos;t. Changes are saved on this device.</p>
        <div className={styles.widgetLibraryActions}><span>{layout.visible.length} of {available.length} widgets added</span><button type="button" onClick={()=>{close();setCanvasEditing(true)}}>Arrange Home</button></div>
          <div className={styles.widgetLibraryGroups}>
            {groups.map(group=><section key={group}>
              <h3>{group}</h3>
              <div className={styles.widgetGallery}>
                {available.filter(id=>definitions[id].group===group).map(id=>{
                  const widget=definitions[id],added=layout.visible.includes(id);
                  return <article key={id} className={styles.widgetGalleryCard}>
                    <div className={styles.widgetPreview} aria-hidden="true">
                      <span><PodscapeLineIcon name={widget.icon}/></span>
                      <div><strong>{widget.name}</strong><small>{widget.preview}</small></div>
                      <i>{widget.size==="wide"?"Wide":"Compact"}</i>
                    </div>
                    <div className={styles.widgetGalleryCopy}>
                      <strong>{widget.name}</strong><p>{widget.description}</p>
                      <button type="button" className={added?styles.widgetRemove:styles.widgetAdd} onClick={()=>added?remove(id):add(id)} aria-label={added?`Remove ${widget.name} from Home`:`Add ${widget.name} to Home`}>{added?"✓ Added · Remove":"+ Add to Home"}</button>
                    </div>
                  </article>;
                })}
              </div>
            </section>)}
          </div>
        <div className={styles.widgetLibraryFooter}>
          <small>{visible.length} blocks on your homepage · {coreIds.length} always included · Saved on this device</small>
          <button type="button" onClick={()=>{resetToDefault()}}>Reset layout</button>
        </div>
      </div>
    </div>}
    {visible.map((id,index)=><WorkspaceEditBlock key={id} id={id} scope="home" label={isCore(id)?coreLabels[id]:definitions[id].name} index={index} count={visible.length} editing={canvasEditing} dragging={dragging===id} required={isCore(id)} onMove={move} onRemove={id=>{if(!isCore(id))remove(id)}} begin={beginDrag} move={moveDrag} stop={stopDrag} interactiveChildren={id==="shortcuts"} onLongPress={()=>enterCanvas(id)}>
      {(()=>{
      if(id==="greeting")return <div key={id} className={styles.homeBlock}>{greeting}</div>;
      if(id==="hero")return <div key={id} className={styles.homeBlock}>{hero}</div>;
      if(id==="shortcuts")return <div key={id} className={styles.homeBlock}>{shortcuts}</div>;
      if(id==="spotlight")return spotlight ? <div key={id} className={styles.homeBlock}>{spotlight}</div> : null;
      if(id==="pins")return <section className={styles.section} key={id} aria-label="My Favorites">
        <div className={styles.heading}><h2>My Favorites</h2><Link href="/menu">Discover →</Link></div>
        {activePins.length?<div className={styles.pinnedGrid}>{activePins.map(item=><article key={pinKey(item)} className={styles.pinnedCard}>
          <span className={styles.pinnedIcon}><PodscapeLineIcon name={item.kind==="colony"?"jar":item.kind==="game"?"creative":"leaf"}/></span>
          <div><small>{item.kind==="colony"?"MY COLONY":item.kind==="game"?"FAVORITE GAME":"SPECIES"}</small><strong>{item.title}</strong><p>{item.description}</p></div>
          <Link href={item.href} aria-label={`Open ${item.title}`}>Open ↗</Link>
          <button type="button" onClick={()=>removePin(item)} aria-label={`Remove ${item.title} from favorites`}>×</button>
        </article>)}</div>:
        <div className={styles.widgetPinEmpty}><p>{pins.length?"Some pinned items are no longer available to this account.":"Nothing pinned yet. Open a species, colony or game and tap Add to Home."}</p><Link href="/menu">Explore Podscape →</Link></div>}
      </section>;

      if(id==="recent")return <section className={styles.section} key={id} aria-label="Recent and noteworthy">
        <div className={styles.heading}><h2>Recent &amp; Noteworthy</h2>{recent.length>1?<span className={styles.spotlightHint}>Swipe to explore <span aria-hidden="true">↔</span></span>:null}</div>
        {recent.length?<div className={styles.recentRail} role="region" aria-roledescription="carousel" aria-label="Recently updated PodScape content" tabIndex={0}>{recent.map(item=><Link href={item.href} className={styles.tile} key={item.href}>
          <div className={styles.widgetRecentIcon}><PodscapeLineIcon name={item.label==="FIELD GUIDE"?"book":item.label==="SHOP"?"shop":"leaf"}/><small>{item.label}</small></div>
          <div className={styles.tileCopy}><strong>{item.title}</strong><small>{item.description}</small><span className={styles.tileArrow} aria-hidden="true">→</span></div>
        </Link>)}</div>:<div className={styles.widgetEmpty}>New and recently updated content will appear here once it is published.</div>}
      </section>;
      if(id==="colony")return compact(id,"jar","MY COLONY",colony?colony.name:"Your colonies, close at hand",colony?`${colony.speciesName} · ${colony.quantity} recorded`:"Add a colony in Manager to get a quick link here.",colony?"/keeper/"+colony.id:"/keeper/collection",colony?"Open colony":"Open Manager");
      if(id==="games")return compact(id,"creative","FUN ZONE","A little playtime?","Word games, puzzles and quizzes whenever you need a break.","/fun-zone","Play now");
      if(id==="progress")return compact(id,"leaf","MY PROGRESS",progress?`Level ${progress.level} Keeper`:"Your keeper journey",progress?`${progress.exp.toLocaleString("en-CA")} EXP earned so far.`:"Sign in to start tracking milestones.",progress?"/account/progress":"/account","View progress");
      if(id==="schedule")return compact(id,"calendar","CARE SCHEDULE","Keep your colonies on track","Open your existing Manager care schedule to see and organize care activities.","/keeper/schedule","View schedule");
      if(id==="guides")return compact(id,"book","FIELD GUIDE",guide?.title||"Explore field guides",guide?.description||"Care, husbandry and habitat resources.",guide?.href||"/field-guide",guide?"Read guide":"Browse guides");
      return compact(id,"community","COMMUNITY","Your community corner","Discover keepers, creators and what's growing around Podscape.","/community","Explore community");
    })()}
    </WorkspaceEditBlock>)}
    {hydrated&&!canvasEditing?<div className={styles.addWidgetFooter}><button type="button" className={styles.addWidgetButton} onClick={()=>{returnFocus.current=document.activeElement as HTMLElement;setEditing(true)}}><span aria-hidden="true">＋</span> Add Widget</button></div>:null}
  </section></HomeCanvasEditContext.Provider>;
}

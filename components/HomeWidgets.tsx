"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import {pinKey,readHomePins,writeHomePins,type HomePin,type PinOption} from "./home-pins";
import styles from "./PodscapeHome.module.css";

type Tile={title:string;label:string;description:string;href:string;image?:string|null;alt?:string};
export type HomeColony={id:string;name:string;quantity:number;speciesName:string}|null;
export type HomeProgress={level:number;exp:number}|null;
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
const storageKey="podscape-home-widgets-v1";
const defaultOrder:WidgetId[]=["recent","colony","games","progress","schedule","guides","community","pins"];
const defaultVisible:WidgetId[]=["recent"];
type Layout={order:WidgetId[];visible:WidgetId[]};

function readLayout():Layout{
  try{
    const value=JSON.parse(localStorage.getItem(storageKey)||"null");
    if(!value||!Array.isArray(value.order)||!Array.isArray(value.visible))throw Error("No saved layout");
    const oldOrder=(value.order as unknown[]).filter((id):id is WidgetId=>typeof id==="string"&&available.includes(id as WidgetId));
    const order=[...new Set(oldOrder),...available.filter(id=>!oldOrder.includes(id))];
    const visible=[...new Set((value.visible as unknown[]).filter((id):id is WidgetId=>typeof id==="string"&&available.includes(id as WidgetId)))];
    return {order,visible};
  }catch{return {order:[...defaultOrder],visible:[...defaultVisible]}}
}

export function HomeWidgets({recent,colony,progress,pinOptions,userId}:{recent:Tile[];colony:HomeColony;progress:HomeProgress;pinOptions:PinOption[];userId:string|null}){
  const [layout,setLayout]=useState<Layout>({order:defaultOrder,visible:defaultVisible});
  const [editing,setEditing]=useState(false);
  const [pins,setPins]=useState<HomePin[]>([]);
  const [tab,setTab]=useState<"library"|"arrange">("library");
  const [hydrated,setHydrated]=useState(false);
  const dragged=useRef<WidgetId|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const returnFocus=useRef<HTMLElement|null>(null);
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
    const open=()=>{returnFocus.current=document.activeElement as HTMLElement;setTab("library");setEditing(true)};
    window.addEventListener("podscape-edit-home",open);
    return ()=>window.removeEventListener("podscape-edit-home",open);
  },[]);
  const close=()=>{setEditing(false);requestAnimationFrame(()=>returnFocus.current?.focus())};
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
  };
  const add=(id:WidgetId)=>update({...layout,order:[...layout.order.filter(item=>item!==id),id],visible:[...layout.visible.filter(item=>item!==id),id]});
  const remove=(id:WidgetId)=>update({...layout,visible:layout.visible.filter(item=>item!==id)});
  const move=(id:WidgetId,direction:number)=>{
    const active=layout.order.filter(item=>layout.visible.includes(item));
    const index=active.indexOf(id),nextIndex=index+direction;
    if(index<0||nextIndex<0||nextIndex>=active.length)return;
    const target=active[nextIndex];const order=[...layout.order];
    const a=order.indexOf(id),b=order.indexOf(target);
    [order[a],order[b]]=[order[b],order[a]];
    update({...layout,order});
  };
  const reorder=(from:WidgetId,to:WidgetId)=>{
    if(from===to)return;
    const order=[...layout.order];order.splice(order.indexOf(from),1);order.splice(order.indexOf(to),0,from);
    update({...layout,order});
  };
  const visible=layout.order.filter(id=>layout.visible.includes(id));
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
  return <section className={styles.widgetArea} aria-label="Your chosen homepage widgets">
    {editing&&<div className={styles.homeEditorOverlay} onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
      <div className={`${styles.widgetEditor} ${styles.widgetLibrary}`} id="podscape-home-widget-editor" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="widget-library-title">
        <div className={styles.homeEditorHead}>
          <div><small>YOUR LITTLE WORLD, YOUR WAY</small><h2 id="widget-library-title">Widget Library</h2></div>
          <button type="button" onClick={close}>Done</button>
        </div>
        <p>Choose the little tools you want to see. Your welcome, shortcuts and Podscape Spotlight stay protected. Pin individual species, games and colonies from their pages.</p>
        <div className={styles.widgetTabs} role="group" aria-label="Widget library views">
          <button type="button" className={tab==="library"?styles.widgetTabActive:""} aria-pressed={tab==="library"} onClick={()=>setTab("library")}>Explore widgets</button>
          <button type="button" className={tab==="arrange"?styles.widgetTabActive:""} aria-pressed={tab==="arrange"} onClick={()=>setTab("arrange")}>On My Home <span>({visible.length})</span></button>
        </div>
        {tab==="library"?
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
          </div>:
          <div className={styles.widgetArrange}>
            <p>Drag on desktop, or use the arrows to arrange your widgets. Their order updates instantly.</p>
            {visible.length===0?<div className={styles.widgetArrangeEmpty}>No optional widgets yet. <button type="button" onClick={()=>setTab("library")}>Explore the library</button></div>:null}
            {visible.map((id,index)=><div className={styles.widgetArrangeRow} key={id} data-widget-id={id} draggable
              onDragStart={event=>{dragged.current=id;event.dataTransfer.effectAllowed="move"}}
              onDragOver={event=>event.preventDefault()}
              onDrop={event=>{event.preventDefault();if(dragged.current)reorder(dragged.current,id);dragged.current=null}}
              onDragEnd={()=>{dragged.current=null}}>
              <span className={styles.widgetGrip} role="button" tabIndex={0} aria-label={`Drag ${definitions[id].name} to reorder`}
                onPointerDown={event=>{if(event.pointerType==="mouse"&&event.button!==0)return;dragged.current=id;event.currentTarget.setPointerCapture(event.pointerId)}}
                onPointerMove={event=>{if(!dragged.current||!(event.buttons&1)&&event.pointerType==="mouse")return;const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-widget-id]");const target=hit?.getAttribute("data-widget-id") as WidgetId|null;if(target&&target!==dragged.current&&visible.includes(target)){reorder(dragged.current,target)}}}
                onPointerUp={()=>{dragged.current=null}}
                onPointerCancel={()=>{dragged.current=null}}
                onKeyDown={event=>{if(event.key==="ArrowUp"){event.preventDefault();move(id,-1)}else if(event.key==="ArrowDown"){event.preventDefault();move(id,1)}}}>⠿</span>
              <span className={styles.widgetArrangeIcon}><PodscapeLineIcon name={definitions[id].icon}/></span>
              <strong>{definitions[id].name}</strong>
              <button type="button" aria-label={`Move ${definitions[id].name} up`} disabled={index===0} onClick={()=>move(id,-1)}>↑</button>
              <button type="button" aria-label={`Move ${definitions[id].name} down`} disabled={index===visible.length-1} onClick={()=>move(id,1)}>↓</button>
              <button type="button" aria-label={`Remove ${definitions[id].name}`} onClick={()=>remove(id)}>×</button>
            </div>)}
          </div>}
        <div className={styles.widgetLibraryFooter}>
          <small>{visible.length} widget{visible.length===1?"":"s"} on your homepage · Saved on this device</small>
          <button type="button" onClick={()=>{update({order:[...defaultOrder],visible:[...defaultVisible]});setTab("library")}}>Reset layout</button>
        </div>
      </div>
    </div>}
    {visible.map(id=>{
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
        <div className={styles.heading}><h2>Recent &amp; Noteworthy</h2><Link href="/menu">Explore →</Link></div>
        <div className={styles.tiles}>{recent.map(item=><Link href={item.href} className={styles.tile} key={item.href}>
          <div className={styles.widgetRecentIcon}><PodscapeLineIcon name={item.label==="GUIDE"?"book":item.label==="FUN ZONE"?"creative":"community"}/><small>{item.label}</small></div>
          <div className={styles.tileCopy}><strong>{item.title}</strong><small>{item.description}</small><span className={styles.tileArrow} aria-hidden="true">→</span></div>
        </Link>)}</div>
      </section>;
      if(id==="colony")return compact(id,"jar","MY COLONY",colony?colony.name:"Your colonies, close at hand",colony?`${colony.speciesName} · ${colony.quantity} recorded`:"Add a colony in Manager to get a quick link here.",colony?"/keeper/"+colony.id:"/keeper/collection",colony?"Open colony":"Open Manager");
      if(id==="games")return compact(id,"creative","FUN ZONE","A little playtime?","Word games, puzzles and quizzes whenever you need a break.","/fun-zone","Play now");
      if(id==="progress")return compact(id,"leaf","MY PROGRESS",progress?`Level ${progress.level} Keeper`:"Your keeper journey",progress?`${progress.exp.toLocaleString("en-CA")} EXP earned so far.`:"Sign in to start tracking milestones.",progress?"/account/progress":"/account","View progress");
      if(id==="schedule")return compact(id,"calendar","CARE SCHEDULE","Keep your colonies on track","Open your existing Manager care schedule to see and organize care activities.","/keeper/schedule","View schedule");
      if(id==="guides")return compact(id,"book","FIELD GUIDE",guide?.title||"Explore field guides",guide?.description||"Care, husbandry and habitat resources.",guide?.href||"/field-guide",guide?"Read guide":"Browse guides");
      return compact(id,"community","COMMUNITY","Your community corner","Discover keepers, creators and what's growing around Podscape.","/community","Explore community");
    })}
    {hydrated&&visible.length===0?<p className={styles.widgetEmpty}>No optional widgets are showing. Tap Edit Home above to explore the Widget Library.</p>:null}
  </section>;
}

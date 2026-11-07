"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./PodscapeHome.module.css";

type Tile={title:string;label:string;description:string;href:string;image?:string|null;alt?:string};
export type HomeColony={id:string;name:string;quantity:number;speciesName:string}|null;
export type HomeProgress={level:number;exp:number}|null;
type WidgetId="recent"|"colony"|"games"|"progress";
const definitions:Record<WidgetId,{name:string;description:string}>={
  recent:{name:"Recent & Noteworthy",description:"Fresh things to discover across Podscape."},
  colony:{name:"My Colony",description:"A quick link to a colony in Manager."},
  games:{name:"Play a Little",description:"Your Fun Zone starting point."},
  progress:{name:"My Progress",description:"A glance at your level and EXP."}
};
const available:WidgetId[]=["recent","colony","games","progress"];
const storageKey="podscape-home-widgets-v1";
const defaultOrder:WidgetId[]=["recent","colony","games","progress"];
const defaultVisible:WidgetId[]=["recent"];

function readLayout():{order:WidgetId[];visible:WidgetId[]}{
  try{
    const value=JSON.parse(localStorage.getItem(storageKey)||"null");
    if(!value||!Array.isArray(value.order)||!Array.isArray(value.visible))throw Error("No saved layout");
    const order=[...new Set((value.order as string[]).filter((id):id is WidgetId=>available.includes(id as WidgetId))),...available.filter(id=>!value.order.includes(id))];
    const visible=[...new Set((value.visible as string[]).filter((id):id is WidgetId=>available.includes(id as WidgetId)))];
    return {order,visible};
  }catch{return {order:[...defaultOrder],visible:[...defaultVisible]}}
}

export function HomeWidgets({recent,colony,progress}:{recent:Tile[];colony:HomeColony;progress:HomeProgress}){
  const [layout,setLayout]=useState<{order:WidgetId[];visible:WidgetId[]}>({order:defaultOrder,visible:defaultVisible});
  const [editing,setEditing]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const dragged=useRef<WidgetId|null>(null);
  useEffect(()=>{setLayout(readLayout());setHydrated(true)},[]);
  const update=(next:{order:WidgetId[];visible:WidgetId[]})=>{
    setLayout(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{}
  };
  const move=(id:WidgetId,direction:number)=>{
    const order=[...layout.order];const a=order.indexOf(id),b=a+direction;
    if(b<0||b>=order.length)return;
    [order[a],order[b]]=[order[b],order[a]];
    update({...layout,order});
  };
  const toggle=(id:WidgetId)=>update({...layout,visible:layout.visible.includes(id)?layout.visible.filter(x=>x!==id):[...layout.visible,id]});
  const reorder=(from:WidgetId,to:WidgetId)=>{
    if(from===to)return;
    const order=[...layout.order];order.splice(order.indexOf(from),1);order.splice(order.indexOf(to),0,from);update({...layout,order});
  };
  return <section className={styles.widgetArea} aria-label="Personalize your Podscape homepage">
    <div className={styles.widgetControls}>
      <div><small>YOUR CORNER OF PODSCAPE</small><h2>Your homepage</h2></div>
      <button type="button" onClick={()=>setEditing(!editing)} aria-expanded={editing} aria-controls="podscape-home-widget-editor">{editing?"Done":"Customize home"}</button>
    </div>
    {editing&&<div className={styles.widgetEditor} id="podscape-home-widget-editor">
      <strong>Make it yours</strong>
      <p>Add, hide or arrange the optional sections below. Your welcome, shortcuts and Podscape Spotlight stay in place so you never lose the essentials.</p>
      <div className={styles.widgetEditorList}>
        {layout.order.map((id,index)=><div className={styles.widgetEditorRow} key={id} draggable
          onDragStart={event=>{dragged.current=id;event.dataTransfer.effectAllowed="move"}}
          onDragOver={event=>event.preventDefault()}
          onDrop={event=>{event.preventDefault();if(dragged.current)reorder(dragged.current,id);dragged.current=null}}
          onDragEnd={()=>{dragged.current=null}}>
          <span className={styles.widgetGrip} aria-hidden="true">⠿</span>
          <div><strong>{definitions[id].name}</strong><small>{definitions[id].description}</small></div>
          <label className={styles.widgetVisibility}><input type="checkbox" checked={layout.visible.includes(id)} onChange={()=>toggle(id)}/><span className={styles.srOnly}>Show {definitions[id].name}</span></label>
          <button type="button" title="Move up" aria-label={"Move "+definitions[id].name+" up"} disabled={index===0} onClick={()=>move(id,-1)}>↑</button>
          <button type="button" title="Move down" aria-label={"Move "+definitions[id].name+" down"} disabled={index===layout.order.length-1} onClick={()=>move(id,1)}>↓</button>
        </div>)}
      </div>
      <div className={styles.widgetEditorFooter}><small>Saved on this device. Drag on desktop or use arrows on mobile.</small><button type="button" onClick={()=>update({order:[...defaultOrder],visible:[...defaultVisible]})}>Reset layout</button></div>
    </div>}
    {layout.order.filter(id=>layout.visible.includes(id)).map(id=>{
      if(id==="recent")return <section className={styles.section} key={id} aria-label="Recent and noteworthy"><div className={styles.heading}><h2>Recent &amp; Noteworthy</h2><Link href="/menu">Explore →</Link></div><div className={styles.tiles}>{recent.map(item=><Link href={item.href} className={styles.tile} key={item.href}><div className={styles.widgetRecentIcon}><PodscapeLineIcon name={item.label==="GUIDE"?"book":item.label==="FUN ZONE"?"creative":"community"}/><small>{item.label}</small></div><div className={styles.tileCopy}><strong>{item.title}</strong><small>{item.description}</small><span className={styles.tileArrow} aria-hidden="true">→</span></div></Link>)}</div></section>;
      if(id==="colony")return <section className={styles.widgetCard} key={id}><span className={styles.widgetSymbol}><PodscapeLineIcon name="jar"/></span><div><small>MY COLONY</small><h3>{colony?colony.name:"Your colonies, close at hand"}</h3><p>{colony?`${colony.speciesName} · ${colony.quantity} recorded`:"Add a colony in Manager, then return here for a quick link."}</p></div><Link href={colony?"/keeper/"+colony.id:"/keeper/collection"}>{colony?"Open colony":"Open Manager"} →</Link></section>;
      if(id==="games")return <section className={styles.widgetCard} key={id}><span className={styles.widgetSymbol}><PodscapeLineIcon name="creative"/></span><div><small>FUN ZONE</small><h3>A little playtime?</h3><p>Word games, puzzles and quizzes whenever you need a break.</p></div><Link href="/fun-zone">Play now →</Link></section>;
      return <section className={styles.widgetCard} key={id}><span className={styles.widgetSymbol}>✦</span><div><small>MY PROGRESS</small><h3>{progress?`Level ${progress.level} Keeper`:"Your keeper journey"}</h3><p>{progress?`${progress.exp.toLocaleString("en-CA")} EXP earned so far.`:"Sign in and explore Podscape to start tracking milestones."}</p></div><Link href={progress?"/account/progress":"/account"}>View progress →</Link></section>;
    })}
    {hydrated&&!editing&&layout.visible.length===0?<p className={styles.widgetEmpty}>Your optional widgets are hidden. Tap Customize home to bring some back.</p>:null}
  </section>;
}

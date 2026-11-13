"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import {useShortcutEditor} from "./useShortcutEditor";
import {moveNavigationSlot} from "./navigation-customization";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import styles from "./PortalShortcutDock.module.css";

export type PortalShortcut={id:string;label:string;icon:PodscapeIconName;href?:string;onClick?:()=>void;description?:string};
const limit=6;
function normalized(value:unknown,available:string[],defaults:string[]):string[]{
 const seen=new Set<string>();
 const saved=Array.isArray(value)?value.filter((id):id is string=>typeof id==="string"):defaults;
 const selected:string[]=[];
 for(const id of saved){if(available.includes(id)&&!seen.has(id)&&selected.length<limit){seen.add(id);selected.push(id)}}
 // Never turn a saved user's custom set into the latest defaults after an update.
 return selected.length?selected:defaults.filter(id=>available.includes(id)).slice(0,limit);
}
/** Available features stay in the library; only chosen shortcuts occupy portal space.
 * All regular actions stay one click; press-and-hold enters the existing jiggle editor.
 */
export function PortalShortcutDock({portal,label,features,defaults,scope="device",className=""}:{
 portal:string;label:string;features:PortalShortcut[];defaults:string[];scope?:string;className?:string
}){
 const router=useRouter();
 const available=features.map(item=>item.id);
 const storageKey="podscape-portal-shortcuts-v1:"+portal+":"+scope;
 const [ids,setIds]=useState(()=>normalized(defaults,available,defaults));
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  try{const saved=localStorage.getItem(storageKey);setIds(normalized(saved?JSON.parse(saved):defaults,available,defaults))}catch{setIds(normalized(defaults,available,defaults))}
  setReady(true);
 // Storage scope changes must reload that portal's own choices, not another user's.
 },[storageKey]);
 const update=(next:string[])=>{const valid=normalized(next,available,defaults);setIds(valid);try{localStorage.setItem(storageKey,JSON.stringify(valid))}catch{}};
 const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,update);
 const current=features.find(item=>item.id===ids[selected])||features[0];
 const replace=(id:string)=>{
  const next=[...ids],found=next.indexOf(id);
  if(found>=0){[next[selected],next[found]]=[next[found],next[selected]]}
  else next[selected]=id;
  update(next);
 };
 return <section className={[styles.dock,className].filter(Boolean).join(" ")} aria-label={label} data-portal-shortcuts={portal} data-ready={ready}>
  {editing?<div className={styles.editor} role="region" aria-label={"Customize "+label}>
   <div className={styles.editorHead}><strong>Arrange your shortcuts</strong><button type="button" onClick={done}>Done</button></div>
   <p>Hold and drag to reorder. Tap a shortcut and choose what goes there.</p>
   <label>Replace {current?.label||"shortcut"}
    <select value={current?.id||""} onChange={e=>replace(e.target.value)}>
     {features.map(item=><option key={item.id} value={item.id}>{item.label}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}
    </select>
   </label>
   <div className={styles.move} role="group" aria-label="Move selected shortcut">
    <button type="button" disabled={selected===0} onClick={()=>{update(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}}>← Left</button>
    <button type="button" disabled={selected>=ids.length-1} onClick={()=>{update(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}}>Right →</button>
    <button type="button" onClick={()=>{if(confirmWorkspaceReset("portal-shortcuts")){update(defaults);setSelected(0)}}}>Reset</button>
   </div>
  </div>:null}
  <nav className={styles.grid} aria-label={label}>
   {ids.map((id,index)=>{
    const item=features.find(entry=>entry.id===id);if(!item)return null;
    const gesture=handlers(index);
    return <button type="button" key={id} data-shortcut-index={index} className={[styles.shortcut,editing?styles.jiggling:"",editing&&selected===index?styles.selected:""].filter(Boolean).join(" ")}
     aria-label={editing?"Choose or drag "+item.label:item.label}
     {...gesture} onClick={e=>{gesture.onClick(e);if(!e.defaultPrevented&&!editing){if(item.onClick)item.onClick();else if(item.href)router.push(item.href)}}}>
     <PodscapeLineIcon name={item.icon}/><span>{item.label}</span>
    </button>
   })}
  </nav>
 </section>;
}

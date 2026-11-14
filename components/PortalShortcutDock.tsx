"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {PodscapeLineIcon,type PodscapeIconName} from "./PodscapeLineIcon";
import {useShortcutEditor} from "./useShortcutEditor";
import {moveNavigationSlot} from "./navigation-customization";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import styles from "./PortalShortcutDock.module.css";
import homeStyles from "./PodscapeHome.module.css";

export type PortalShortcut={id:string;label:string;icon:PodscapeIconName;href?:string;onClick?:()=>void;description?:string};
const limit=10;
const minimum=4;
function normalized(value:unknown,available:string[],defaults:string[]):string[]{
 const seen=new Set<string>();
 const saved=Array.isArray(value)?value.filter((id):id is string=>typeof id==="string"):defaults;
 const selected:string[]=[];
 for(const id of saved){if(available.includes(id)&&!seen.has(id)&&selected.length<limit){seen.add(id);selected.push(id)}}
 // Preserve an intentionally shorter or larger personal dock. Only repair invalid or legacy layouts.
 const target=Array.isArray(value)?Math.max(minimum,Math.min(limit,saved.length)):Math.min(limit,defaults.length);
 for(const id of [...defaults,...available]){
  if(selected.length>=target)break;
  if(available.includes(id)&&!seen.has(id)){seen.add(id);selected.push(id)}
 }
 return selected;
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
 const [addChoice,setAddChoice]=useState("");
 useEffect(()=>{
  try{const saved=localStorage.getItem(storageKey);setIds(normalized(saved?JSON.parse(saved):defaults,available,defaults))}catch{setIds(normalized(defaults,available,defaults))}
  setReady(true);
 // Storage scope changes must reload that portal's own choices, not another user's.
 },[storageKey]);
 const update=(next:string[])=>{const valid=normalized(next,available,defaults);setIds(valid);try{localStorage.setItem(storageKey,JSON.stringify(valid))}catch{}};
 const {editing,setEditing,selected,setSelected,handlers,done}=useShortcutEditor(ids,update);
 const current=features.find(item=>item.id===ids[selected])||features[0];
 const extras=features.filter(item=>!ids.includes(item.id));
 const add=(id:string)=>{if(id&&!ids.includes(id)&&ids.length<limit){update([...ids,id]);setSelected(ids.length);setAddChoice("");}};
 const remove=()=>{if(ids.length<=minimum)return;update(ids.filter((_,index)=>index!==selected));setSelected(Math.max(0,selected-1));};
 const replace=(id:string)=>{
  const next=[...ids],found=next.indexOf(id);
  if(found>=0){[next[selected],next[found]]=[next[found],next[selected]]}
  else next[selected]=id;
  update(next);
 };
 return <section className={[styles.dock,className].filter(Boolean).join(" ")} aria-label={label} data-portal-shortcuts={portal} data-ready={ready}>
  {!editing?<div className={styles.dockTools}><button type="button" onClick={()=>{setSelected(0);setEditing(true)}}>Customize shortcuts</button></div>:null}
  {editing?<div className={styles.editor} role="region" aria-label={"Customize "+label}>
   <div className={styles.editorHead}><strong>Arrange your shortcuts</strong><button type="button" onClick={done}>Done</button></div>
   <p>Hold and drag to reorder. Choose from the portal library, or add a second row (up to 10 shortcuts).</p>
   <div className={styles.library}><strong>Shortcut library · {features.length} options</strong><label>Add another shortcut<select value={addChoice} disabled={ids.length>=limit||extras.length===0} onChange={e=>setAddChoice(e.target.value)}><option value="">Choose an action…</option>{extras.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button type="button" disabled={!addChoice||ids.length>=limit} onClick={()=>add(addChoice)}>Add shortcut</button></div>
   <label>Replace {current?.label||"shortcut"}
    <select value={current?.id||""} onChange={e=>replace(e.target.value)}>
     {features.map(item=><option key={item.id} value={item.id}>{item.label}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}
    </select>
   </label>
   <div className={styles.move} role="group" aria-label="Move selected shortcut">
    <button type="button" disabled={ids.length<=minimum} onClick={remove}>Remove selected</button>
    <button type="button" disabled={selected===0} onClick={()=>{update(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}}>← Left</button>
    <button type="button" disabled={selected>=ids.length-1} onClick={()=>{update(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}}>Right →</button>
    <button type="button" onClick={()=>{if(confirmWorkspaceReset("portal-shortcuts")){update(defaults);setSelected(0)}}}>Reset</button>
   </div>
  </div>:null}
  <nav className={`${homeStyles.shortcuts} ${styles.grid}`} data-count={ids.length} aria-label={label}>
   {ids.map((id,index)=>{
    const item=features.find(entry=>entry.id===id);if(!item)return null;
    const gesture=handlers(index);
    return <button type="button" key={id} data-shortcut-index={index} className={[homeStyles.shortcut,styles.shortcut,editing?styles.jiggling:"",editing&&selected===index?styles.selected:""].filter(Boolean).join(" ")}
     aria-label={editing?"Choose or drag "+item.label:item.label}
     aria-description="Press and hold to rearrange or replace. Keyboard: F2."
     {...gesture} onKeyDown={e=>{if(e.key==="F2"){e.preventDefault();setSelected(index);setEditing(true)}}}
     onClick={e=>{gesture.onClick(e);if(!e.defaultPrevented&&!editing){if(item.onClick)item.onClick();else if(item.href)router.push(item.href)}}}>
     <span className={homeStyles.shortcutIcon}><PodscapeLineIcon name={item.icon}/></span><span className={styles.shortcutLabel}>{item.label}</span>
    </button>
   })}
  </nav>
 </section>;
}

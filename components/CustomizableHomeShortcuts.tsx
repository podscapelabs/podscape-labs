"use client";
import {useRouter} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {choiceById,availableNavigationChoices,navigationGroups,moveNavigationSlot,swapNavigationSlot} from "./navigation-customization";
import {useNavigationPreferences} from "./useNavigationPreferences";
import {useShortcutEditor} from "./useShortcutEditor";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import {useHomeCanvasEditing} from "./HomeCanvasEditContext";
import styles from "./PodscapeHome.module.css";

export function CustomizableHomeShortcuts({isOwner=false}:{isOwner?:boolean}){
  const router=useRouter();
  const {ids,change,reset}=useNavigationPreferences("home",isOwner);
  const canvasEditing=useHomeCanvasEditing();
  const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change,canvasEditing);
  const accessibleChoices=availableNavigationChoices(isOwner);
  const choices=ids.map(id=>choiceById.get(id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const current=choices[selected]||choices[0];
  return <section aria-label="Your Podscape shortcuts">
    {editing&&!canvasEditing&&<div className={styles.jiggleToolbar} role="region" aria-label="Customize homepage shortcuts">
      <span className={styles.jiggleHint}><PodscapeLineIcon name="grip" /> <strong>Arrange your shortcuts</strong><small>Drag icons or use the move buttons. Tap one to replace it.</small></span>
      <button type="button" className={styles.jiggleDone} onClick={done}>Done</button>
      <label className={styles.jigglePicker}>Replace {current?.label||"shortcut"}
        <select value={current?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationGroups.filter(group=>accessibleChoices.some(item=>item.group===group)).map(group=><optgroup label={group} key={group}>{accessibleChoices.filter(item=>item.group===group).map(item=><option value={item.id} key={item.id}>{item.label}{item.planned?" (coming later)":""}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}</optgroup>)}
        </select>
      </label>
      <div className={styles.shortcutMoveControls} role="group" aria-label="Move selected Home shortcut">
        <button type="button" disabled={selected<=0} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}} aria-label={`Move ${current?.label||"shortcut"} left`}>← Left</button>
        <button type="button" disabled={selected>=ids.length-1} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}} aria-label={`Move ${current?.label||"shortcut"} right`}>Right →</button>
      </div>
      <button type="button" className={styles.jiggleReset} onClick={()=>{if(confirmWorkspaceReset("home-shortcuts")){reset();setSelected(0)}}}>Reset shortcuts</button>
    </div>}
    {canvasEditing&&<div className={styles.inlineShortcutPicker}>
      <span>Drag shortcuts to reorder · Tap one to replace</span>
      <label>Replace {current?.label||"shortcut"}
        <select value={current?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationGroups.filter(group=>accessibleChoices.some(item=>item.group===group)).map(group=><optgroup label={group} key={group}>{accessibleChoices.filter(item=>item.group===group).map(item=><option value={item.id} key={item.id}>{item.label}{item.planned?" (coming later)":""}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}</optgroup>)}
        </select>
      </label>
      <div className={styles.shortcutMoveControls} role="group" aria-label="Move selected Home shortcut">
        <button type="button" disabled={selected<=0} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}} aria-label={`Move ${current?.label||"shortcut"} left`}>← Left</button>
        <button type="button" disabled={selected>=ids.length-1} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}} aria-label={`Move ${current?.label||"shortcut"} right`}>Right →</button>
      </div>
      <button type="button" onClick={()=>{reset();setSelected(0)}}>Reset shortcuts</button>
    </div>}
    <nav className={`${styles.shortcuts} ${editing?styles.shortcutEditing:""}`} aria-label="Explore Podscape">
      {choices.map((item,index)=><button type="button" data-shortcut-index={index}
        className={`${styles.shortcut} ${styles[item.tone]} ${editing?styles.jiggling:""} ${editing&&selected===index?styles.shortcutSelected:""}`}
        aria-label={editing?`Choose or drag ${item.label}`:item.label}
        key={item.id} style={editing?{animationDelay:`${index*-75}ms`}:undefined} {...handlers(index)} onClick={event=>{handlers(index).onClick(event);if(!event.defaultPrevented)router.push(item.href)}}>
        <span className={styles.shortcutIcon}><PodscapeLineIcon name={item.icon}/></span><span>{item.label}</span>
      </button>)}
    </nav>
  </section>;
}

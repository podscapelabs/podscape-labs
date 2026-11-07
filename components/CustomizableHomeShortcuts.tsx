"use client";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {choiceById,navigationChoices,moveNavigationSlot,swapNavigationSlot} from "./navigation-customization";
import {useNavigationPreferences} from "./useNavigationPreferences";
import {useShortcutEditor} from "./useShortcutEditor";
import styles from "./PodscapeHome.module.css";

export function CustomizableHomeShortcuts(){
  const {ids,change,reset}=useNavigationPreferences("home");
  const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change);
  const choices=ids.map(id=>choiceById.get(id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const current=choices[selected]||choices[0];
  return <section aria-label="Your Podscape shortcuts">
    {editing&&<div className={styles.shortcutEditor} role="region" aria-label="Customize homepage shortcuts">
      <div className={styles.shortcutEditHead}><div><strong>Make Podscape yours</strong><small>Drag icons to arrange them, or swap a shortcut.</small></div><button type="button" onClick={done}>Done</button></div>
      <label>Replace {current?.label||"shortcut"}
        <select value={current?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationChoices.map(item=><option key={item.id} value={item.id}>{item.label}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}
        </select>
      </label>
      <div className={styles.shortcutEditActions}>
        <button type="button" disabled={selected===0} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}}>← Move left</button>
        <button type="button" disabled={selected===choices.length-1} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}}>Move right →</button>
        <button type="button" onClick={()=>{reset();setSelected(0)}}>Reset</button>
      </div>
      <small>Changes are saved on this device.</small>
    </div>}
    <nav className={`${styles.shortcuts} ${editing?styles.shortcutEditing:""}`} aria-label="Explore Podscape">
      {choices.map((item,index)=><Link href={item.href} data-shortcut-index={index}
        className={`${styles.shortcut} ${styles[item.tone]} ${editing&&selected===index?styles.shortcutSelected:""}`}
        aria-label={editing?`Choose ${item.label} to customize`:item.label}
        key={item.id} {...handlers(index)}>
        <span className={styles.shortcutIcon}><PodscapeLineIcon name={item.icon}/></span><span>{item.label}</span>
      </Link>)}
    </nav>
  </section>;
}

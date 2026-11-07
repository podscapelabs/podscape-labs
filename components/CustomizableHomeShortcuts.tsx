"use client";
import {useRouter} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {choiceById,navigationChoices,swapNavigationSlot} from "./navigation-customization";
import {useNavigationPreferences} from "./useNavigationPreferences";
import {useShortcutEditor} from "./useShortcutEditor";
import styles from "./PodscapeHome.module.css";

export function CustomizableHomeShortcuts(){
  const router=useRouter();
  const {ids,change,reset}=useNavigationPreferences("home");
  const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change);
  const choices=ids.map(id=>choiceById.get(id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const current=choices[selected]||choices[0];
  return <section aria-label="Your Podscape shortcuts">
    {editing&&<div className={styles.jiggleToolbar} role="region" aria-label="Customize homepage shortcuts">
      <span className={styles.jiggleHint}>✧ <strong>Arrange your shortcuts</strong><small>Drag icons to move them. Tap one to replace it.</small></span>
      <button type="button" className={styles.jiggleDone} onClick={done}>Done</button>
      <label className={styles.jigglePicker}>Replace {current?.label||"shortcut"}
        <select value={current?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationChoices.map(item=><option key={item.id} value={item.id}>{item.label}{ids.includes(item.id)&&item.id!==current?.id?" (swap)":""}</option>)}
        </select>
      </label>
      <button type="button" className={styles.jiggleReset} onClick={()=>{reset();setSelected(0)}}>Reset shortcuts</button>
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

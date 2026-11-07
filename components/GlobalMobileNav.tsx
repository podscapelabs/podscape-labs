"use client";
import {usePathname,useRouter} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {choiceById,navigationChoices,swapNavigationSlot} from "./navigation-customization";
import {useNavigationPreferences} from "./useNavigationPreferences";
import {useShortcutEditor} from "./useShortcutEditor";
import styles from "./KeeperMobileNav.module.css";

export function GlobalMobileNav(){
  const pathname=usePathname();
  const router=useRouter();
  const {ids,change,reset}=useNavigationPreferences("bottom");
  const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change);
  const excluded=pathname==="/"||pathname==="/admin"||pathname.startsWith("/admin/")&&pathname!=="/admin/preview"||pathname.startsWith("/account/login")||pathname.startsWith("/account/register")||pathname.startsWith("/account/reset")||pathname.startsWith("/auth/");
  if(excluded)return null;
  const items=ids.map(id=>choiceById.get(id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const selectedItem=items[selected]||items[0];
  const activeFor=(href:string)=>href==="/app"?pathname==="/app":href==="/menu"?pathname==="/menu":pathname===href||pathname.startsWith(href+"/");
  return <>
    {editing&&<div className={styles.editor} role="region" aria-label="Customize bottom navigation">
      <div className={styles.editorHeading}>
        <div><strong>Arrange your toolbar</strong><small>Drag icons to move them. Tap one to replace it.</small></div>
        <button type="button" onClick={done}>Done</button>
      </div>
      <label className={styles.replace}>Replace {selectedItem?.label||"shortcut"}
        <select value={selectedItem?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationChoices.map(item=><option value={item.id} key={item.id}>{item.label}{ids.includes(item.id)&&item.id!==selectedItem?.id?" (swap)":""}</option>)}
        </select>
      </label>
      <button type="button" className={styles.resetLink} onClick={()=>{reset();setSelected(0)}}>Reset toolbar</button>
    </div>}
    <nav className={`${styles.nav} ${editing?styles.editing:""}`} aria-label="PodScape mobile navigation">
      {items.map((item,index)=><button type="button" data-shortcut-index={index} key={item.id} style={editing?{animationDelay:`${index*-70}ms`}:undefined}
        aria-current={!editing&&activeFor(item.href)?"page":undefined}
        aria-label={editing?`Choose ${item.label} to customize`:item.label}
        className={`${styles.item} ${index===Math.floor(items.length/2)?styles.primary:""} ${!editing&&activeFor(item.href)?styles.active:""} ${editing?styles.jiggling:""} ${editing&&selected===index?styles.selected:""}`}
        {...handlers(index)} onClick={event=>{handlers(index).onClick(event);if(!event.defaultPrevented)router.push(item.href)}}>
        <span><PodscapeLineIcon name={item.icon}/></span><small>{item.label}</small>
      </button>)}
    </nav>
  </>;
}

"use client";
import {isStandaloneAccessRoute} from "@/lib/interface-route-policy";
import {usePathname,useRouter} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {choiceById,availableNavigationChoices,navigationGroups,moveNavigationSlot,swapNavigationSlot} from "./navigation-customization";
import {useNavigationPreferences} from "./useNavigationPreferences";
import {useShortcutEditor} from "./useShortcutEditor";
import {confirmWorkspaceReset} from "./workspace-edit-standards";
import styles from "./KeeperMobileNav.module.css";

export function GlobalMobileNav({isOwner=false}:{isOwner?:boolean}){
  const pathname=usePathname();
  const router=useRouter();
  const {ids,change,reset}=useNavigationPreferences("bottom",isOwner);
  const {editing,selected,setSelected,handlers,done}=useShortcutEditor(ids,change);
  const excluded=isStandaloneAccessRoute(pathname);
  // On Ledger, prefer normal browser navigation so a stalled App Router transition
  // cannot leave the keeper trapped on this portal in iOS standalone mode.
  const useNativeNavigation=pathname==="/ledger"||pathname.startsWith("/ledger/");
  if(excluded)return null;
  const accessibleChoices=availableNavigationChoices(isOwner);
  const items=ids.map(id=>choiceById.get(id)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const selectedItem=items[selected]||items[0];
  const activeFor=(href:string)=>href==="/app"?pathname==="/app":href==="/menu"?pathname==="/menu":pathname===href||pathname.startsWith(href+"/");
  return <>
    {editing&&<div className={styles.editor} role="region" aria-label="Customize bottom navigation">
      <div className={styles.editorHeading}>
        <div><strong>Arrange your toolbar</strong><small>Drag icons, or use the move buttons below. Tap an icon to replace it.</small></div>
        <button type="button" onClick={done}>Done</button>
      </div>
      <label className={styles.replace}>Replace {selectedItem?.label||"shortcut"}
        <select value={selectedItem?.id||""} onChange={event=>change(swapNavigationSlot(ids,selected,event.target.value))}>
          {navigationGroups.filter(group=>accessibleChoices.some(item=>item.group===group)).map(group=><optgroup label={group} key={group}>{accessibleChoices.filter(item=>item.group===group).map(item=><option value={item.id} key={item.id}>{item.label}{item.planned?" (coming later)":""}{ids.includes(item.id)&&item.id!==selectedItem?.id?" (swap)":""}</option>)}</optgroup>)}
        </select>
      </label>
      <div className={styles.editorActions} role="group" aria-label="Move selected navigation shortcut">
        <button type="button" disabled={selected<=0} aria-label={`Move ${selectedItem?.label||"shortcut"} left`} onClick={()=>{change(moveNavigationSlot(ids,selected,selected-1));setSelected(selected-1)}}>← Move left</button>
        <button type="button" disabled={selected>=items.length-1} aria-label={`Move ${selectedItem?.label||"shortcut"} right`} onClick={()=>{change(moveNavigationSlot(ids,selected,selected+1));setSelected(selected+1)}}>Move right →</button>
      </div>
      <button type="button" className={styles.resetLink} onClick={()=>{if(confirmWorkspaceReset("bottom-navigation")){reset();setSelected(0)}}}>Reset toolbar</button>
    </div>}
    <nav className={`${styles.nav} ${editing?styles.editing:""}`} aria-label="PodScape mobile navigation">
      {items.map((item,index)=>{
        const gesture=handlers(index);
        const classes=`${styles.item} ${index===Math.floor(items.length/2)?styles.primary:""} ${!editing&&activeFor(item.href)?styles.active:""} ${editing?styles.jiggling:""} ${editing&&selected===index?styles.selected:""}`;
        const title=editing?`Choose ${item.label} to customize`:item.label;
        const contents=<><span><PodscapeLineIcon name={item.icon}/></span><small>{item.label}</small></>;
        return useNativeNavigation
         ? <a href={item.href} key={item.id} data-shortcut-index={index}
             aria-current={!editing&&activeFor(item.href)?"page":undefined}
             aria-label={title} className={classes}
             style={editing?{animationDelay:`${index*-70}ms`}:undefined}
             {...gesture} onClick={event=>{gesture.onClick(event);if(editing)event.preventDefault();}}>
             {contents}
           </a>
         : <button type="button" data-shortcut-index={index} key={item.id} style={editing?{animationDelay:`${index*-70}ms`}:undefined}
             aria-current={!editing&&activeFor(item.href)?"page":undefined}
             aria-label={title} className={classes}
             {...gesture} onClick={event=>{gesture.onClick(event);if(!event.defaultPrevented)router.push(item.href);}}>
             {contents}
           </button>;
      })}
    </nav>
  </>;
}

"use client";
import styles from "./PodscapeHome.module.css";

export type WidgetLibraryView="all"|"available"|"added";
export function widgetMatchesView(added:boolean,view:WidgetLibraryView){
 return view==="all"||(view==="added"?added:!added);
}
/** Same controls and language in every editable portal. */
export function WidgetLibraryFilter({view,onChange,added,total}:{view:WidgetLibraryView;onChange:(v:WidgetLibraryView)=>void;added:number;total:number}){
 const options:[WidgetLibraryView,string,number][]=[
  ["all","All",total],["available","Available",Math.max(0,total-added)],["added","Added",added]
 ];
 return <div className={styles.widgetLibraryFilter} role="group" aria-label="Filter widget library">
  {options.map(([id,label,count])=><button key={id} type="button" aria-pressed={view===id} onClick={()=>onChange(id)}>{label}<span>{count}</span></button>)}
 </div>;
}

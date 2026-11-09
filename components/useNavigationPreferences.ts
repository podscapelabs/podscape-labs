"use client";
import {useEffect,useState} from "react";
import {cleanPreference,initialBottom,initialHome,readPreference,writePreference,type PreferenceArea} from "./navigation-customization";
import {recordExperienceAction} from "./experience-achievements";

export function useNavigationPreferences(area:PreferenceArea,isOwner=false){
  const [ids,setIds]=useState<string[]>(area==="bottom"?[...initialBottom]:[...initialHome]);
  useEffect(()=>{
    const refresh=()=>setIds(readPreference(area,isOwner));
    refresh();
    const update=(event:Event)=>{const detail=(event as CustomEvent<{area:string}>).detail;if(!detail||detail.area===area)refresh()};
    window.addEventListener("storage",refresh);
    window.addEventListener("podscape-nav-updated",update);
    return ()=>{window.removeEventListener("storage",refresh);window.removeEventListener("podscape-nav-updated",update)}
  },[area,isOwner]);
  const change=(values:string[])=>{const clean=cleanPreference(values,area,isOwner);setIds(clean);writePreference(area,clean,isOwner);const defaults=area==="bottom"?initialBottom:initialHome;if(clean.join("|")!==ids.join("|")&&clean.join("|")!==defaults.join("|"))void recordExperienceAction("nav_personalized",{area,ids:clean});};
  const reset=()=>change(area==="bottom"?initialBottom:initialHome);
  return {ids,change,reset};
}

"use client";
import {useEffect,useState} from "react";
import {cleanPreference,initialBottom,initialHome,readPreference,writePreference,type PreferenceArea} from "./navigation-customization";

export function useNavigationPreferences(area:PreferenceArea){
  const [ids,setIds]=useState<string[]>(area==="bottom"?[...initialBottom]:[...initialHome]);
  useEffect(()=>{
    const refresh=()=>setIds(readPreference(area));
    refresh();
    const update=(event:Event)=>{const detail=(event as CustomEvent<{area:string}>).detail;if(!detail||detail.area===area)refresh()};
    window.addEventListener("storage",refresh);
    window.addEventListener("podscape-nav-updated",update);
    return ()=>{window.removeEventListener("storage",refresh);window.removeEventListener("podscape-nav-updated",update)}
  },[area]);
  const change=(values:string[])=>{const clean=cleanPreference(values,area);setIds(clean);writePreference(area,clean)};
  const reset=()=>change(area==="bottom"?initialBottom:initialHome);
  return {ids,change,reset};
}

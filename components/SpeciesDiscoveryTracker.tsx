"use client";
import { useEffect } from "react";
import { announceAchievement } from "@/components/AchievementToast";

export function SpeciesDiscoveryTracker({speciesId}:{speciesId:string}) {
 useEffect(()=>{
   const controller = new AbortController();
   fetch("/api/progress/species-view",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({speciesId}),signal:controller.signal})
    .then(r=>r.ok?r.json():null)
    .then(result=>{if(result?.unlocked)announceAchievement({id:"field-observer",title:"Field Observer",description:"You've discovered 5 unique species!",exp:50,coins:25});})
    .catch(()=>{});
   return ()=>controller.abort();
 },[speciesId]);
 return null;
}

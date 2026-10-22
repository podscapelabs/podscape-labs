"use client";
import { useEffect, useState } from "react";

export function SpeciesDiscoveryTracker({speciesId}:{speciesId:string}) {
 const [message,setMessage] = useState("");
 useEffect(()=>{
   const controller = new AbortController();
   fetch("/api/progress/species-view",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({speciesId}),signal:controller.signal})
    .then(r=>r.ok?r.json():null)
    .then(result=>{if(result?.unlocked)setMessage("Achievement unlocked: Field Observer! +50 EXP · +25 Pod Coins");})
    .catch(()=>{});
   return ()=>controller.abort();
 },[speciesId]);
 return message ? <p role="status" style={{padding:"12px 16px",background:"#e4eddd",borderRadius:12,color:"#234b30",fontWeight:600}}>{message}</p> : null;
}

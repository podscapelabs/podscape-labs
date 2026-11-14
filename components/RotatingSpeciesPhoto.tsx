"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import type {ApprovedSpeciesPhoto} from "@/lib/approved-species-photos";

export function RotatingSpeciesPhoto({
 official,officialAlt="",approved=[],className="",positionX=50,positionY=50,zoom=1,mode="card"
}:{
 official?:string|null;officialAlt?:string;approved?:ApprovedSpeciesPhoto[];
 className?:string;positionX?:number;positionY?:number;zoom?:number;
 mode?:"card"|"hero";
}){
 const [index,setIndex]=useState(0);
 const available=approved.length+(official?1:0);
 useEffect(()=>{
  if(available<2)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(reduced.matches)return;
  const tick=()=>{if(document.visibilityState==="visible")setIndex(value=>(value+1)%available)};
  const timer=window.setInterval(tick,9000);
  return ()=>window.clearInterval(timer);
 },[available]);
 const active=index%Math.max(available,1);
 const isOfficial=Boolean(official)&&active===0;
 const community=approved[official?active-1:active];
 const sharedStyle:React.CSSProperties={
  objectFit:mode==="hero"?(isOfficial?"contain":"cover"):"cover",
  objectPosition:isOfficial?`${positionX}% ${positionY}%`:"center",
  transform:isOfficial?`scale(${zoom})`:"none",
 };
 if(!official&&!community)return null;
 return <>
  {isOfficial&&official?
   <Image className={className} src={official} alt={officialAlt} fill sizes={mode==="hero"?"(max-width: 720px) 65vw, 540px":"(max-width: 600px) 45vw, (max-width: 1100px) 28vw, 220px"} loading={mode==="hero"?"eager":"lazy"} decoding="async" style={sharedStyle}/>:
   community?<img className={className} src={community.url} alt={`Community species photo by ${community.credit}`} loading="lazy" decoding="async" style={{position:"absolute",inset:0,width:"100%",height:"100%",...sharedStyle}}/>:null}
  {community&&mode==="hero"?<span aria-label={`Community photo by ${community.credit}`} style={{position:"absolute",right:12,bottom:12,zIndex:2,padding:"5px 9px",borderRadius:9,fontSize:10,background:"rgba(10,21,15,.78)",color:"#fff",pointerEvents:"none"}}>Photo: {community.credit}</span>:null}
 </>;
}

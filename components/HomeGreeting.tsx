"use client";
import { useEffect, useState } from "react";

function greetingFor(hour:number){
 return hour<12?"Good Morning":hour<17?"Good Afternoon":"Good Evening";
}

function TimeIcon({day}:{day:boolean}){
 const common={width:"0.8em",height:"0.8em",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,style:{display:"inline-block",verticalAlign:"-.08em",marginLeft:".25em"},"aria-hidden":true as const};
 return day
  ?<svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  :<svg {...common}><path d="M20.7 14.1A9 9 0 0 1 9.9 3.3 9 9 0 1 0 20.7 14.1Z"/></svg>;
}

export function HomeGreeting({name}:{name?:string}){
 const [hour,setHour]=useState<number|null>(null);
 useEffect(()=>{
  const refresh=()=>setHour(new Date().getHours());
  refresh();
  const interval=window.setInterval(refresh,60_000);
  return ()=>window.clearInterval(interval);
 },[]);
 return <div><h1>{hour===null?"Hello":greetingFor(hour)}{name?", "+name:""}{hour!==null?<TimeIcon day={hour>=6&&hour<18}/>:null}</h1><p>A little world of discovery awaits.</p></div>;
}

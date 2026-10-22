"use client";
import { useEffect, useState } from "react";
export function HomeGreeting({name}:{name?:string}){
 const [part,setPart]=useState("Hello");
 useEffect(()=>{const hour=new Date().getHours();setPart(hour<12?"Good morning":hour<17?"Good afternoon":"Good evening")},[]);
 return <div><h1>{part}{name?", "+name:""}<span aria-hidden="true"> ✦</span></h1><p>A little world of discovery awaits.</p></div>;
}

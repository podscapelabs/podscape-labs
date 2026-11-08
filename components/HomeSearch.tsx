"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./HomeSearch.module.css";

type Result={title:string;subtitle:string;category:string;href:string};

export function HomeSearch(){
 const router=useRouter();
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 const [status,setStatus]=useState<"idle"|"loading"|"ready"|"error">("idle");
 const [focused,setFocused]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const submitted=query.trim();

 useEffect(()=>{
  if(!focused||submitted.length<2){setResults([]);setStatus("idle");return}
  const controller=new AbortController();
  setStatus("loading");
  const timer=window.setTimeout(async()=>{
   try{
    const response=await fetch("/api/search/suggest?q="+encodeURIComponent(submitted),{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("Search unavailable");
    const data=await response.json() as {results:Result[]};
    if(!controller.signal.aborted){setResults(data.results);setStatus("ready")}
   }catch{if(!controller.signal.aborted){setResults([]);setStatus("error")}}
  },220);
  return ()=>{window.clearTimeout(timer);controller.abort()};
 },[submitted,focused]);

 useEffect(()=>{
  if(!focused)return;
  const onDown=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setFocused(false)};
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setFocused(false);root.current?.querySelector("input")?.blur()}};
  document.addEventListener("pointerdown",onDown);
  document.addEventListener("keydown",onKey);
  return ()=>{document.removeEventListener("pointerdown",onDown);document.removeEventListener("keydown",onKey)};
 },[focused]);

 return <div className={styles.root} ref={root}>
  <form className={styles.form} action="/search" onSubmit={event=>{
   event.preventDefault();
   if(submitted){setFocused(false);router.push("/search?q="+encodeURIComponent(submitted))}
  }} role="search" aria-label="Search PodScape">
   <span className={styles.icon}><PodscapeLineIcon name="search"/></span>
   <input type="search" name="q" aria-label="Search PodScape" placeholder="Search species, products, guides…" autoComplete="off" value={query} onChange={event=>setQuery(event.target.value)} onFocus={()=>setFocused(true)}/>
   <button type="submit" className={styles.go} aria-label="Show search results"><span aria-hidden="true">→</span></button>
  </form>
  {focused&&submitted.length>0?<div className={styles.suggestions} aria-live="polite">
   {submitted.length===1?<p>Type one more character to search.</p>:null}
   {submitted.length>=2&&status==="loading"?<p>Finding matches…</p>:null}
   {submitted.length>=2&&status==="error"?<p>Suggestions unavailable. Press Search to see all results.</p>:null}
   {submitted.length>=2&&status==="ready"&&results.length===0?<p>No matches yet. Try another term.</p>:null}
   {submitted.length>=2&&status==="ready"&&results.length>0?<div className={styles.list}>{results.slice(0,6).map(item=><Link key={item.href} href={item.href} onClick={()=>setFocused(false)} className={styles.result}><small>{item.category}</small><strong>{item.title}</strong></Link>)}</div>:null}
   {submitted.length>=2?<Link href={"/search?q="+encodeURIComponent(submitted)} onClick={()=>setFocused(false)} className={styles.more}>View all search results →</Link>:null}
  </div>:null}
 </div>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "./PlatformIcons";
import styles from "./HeaderSearch.module.css";

type Result={title:string;subtitle:string;category:string;href:string};
export function HeaderSearch(){
  const router=useRouter();
  const pathname=usePathname();
  const root=useRef<HTMLDivElement>(null);
  const field=useRef<HTMLInputElement>(null);
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<Result[]>([]);
  const [status,setStatus]=useState<"idle"|"loading"|"ready"|"error">("idle");
  useEffect(()=>{setOpen(false);setQuery("");setResults([])},[pathname]);
  useEffect(()=>{
    if(!open)return;
    const onClick=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);field.current?.blur()}};
    document.addEventListener("pointerdown",onClick);
    document.addEventListener("keydown",onKey);
    return ()=>{document.removeEventListener("pointerdown",onClick);document.removeEventListener("keydown",onKey)};
  },[open]);
  useEffect(()=>{
    const trimmed=query.trim();
    if(!open||trimmed.length<2){setResults([]);setStatus("idle");return}
    const controller=new AbortController();
    setStatus("loading");
    const timer=window.setTimeout(async()=>{
      try{
        const response=await fetch("/api/search/suggest?q="+encodeURIComponent(trimmed),{signal:controller.signal,cache:"no-store"});
        if(!response.ok)throw new Error("Search unavailable");
        const data=await response.json() as {results:Result[]};
        setResults(data.results);
        setStatus("ready");
      }catch(err){if(!controller.signal.aborted){setResults([]);setStatus("error")}}
    },220);
    return ()=>{window.clearTimeout(timer);controller.abort()};
  },[query,open]);
  const submitted=query.trim();
  return <div className={styles.root} ref={root}>
    <button type="button" className="v2-icon-button v2-search-button" aria-label={open?"Close search":"Search Podscape"} aria-expanded={open} aria-controls="podscape-header-search" onClick={()=>{
      if(open){setOpen(false)}else{setOpen(true);window.requestAnimationFrame(()=>field.current?.focus())}
    }}><SearchIcon/></button>
    {open&&<div className={styles.popover} id="podscape-header-search">
      <form action="/search" className={styles.form} onSubmit={event=>{event.preventDefault();if(submitted){setOpen(false);router.push("/search?q="+encodeURIComponent(submitted))}}}>
        <SearchIcon/>
        <input ref={field} type="search" name="q" aria-label="Search Podscape" autoComplete="off" placeholder="Search Podscape…" value={query} onChange={e=>setQuery(e.target.value)}/>
        <button type="button" onClick={()=>{setOpen(false);setQuery("")}} aria-label="Close search" className={styles.close}>×</button>
      </form>
      <div className={styles.results} aria-live="polite">
        {!submitted&&<p className={styles.hint}>Find species, guides, products, PodBound cards and more.</p>}
        {submitted.length===1&&<p className={styles.hint}>Type one more character to search.</p>}
        {submitted.length>=2&&status==="loading"&&<p className={styles.hint}>Finding matches…</p>}
        {submitted.length>=2&&status==="error"&&<p className={styles.hint}>Search is unavailable right now. Try the full search page.</p>}
        {submitted.length>=2&&status==="ready"&&results.length===0&&<p className={styles.hint}>No results for “{submitted}”. Try another term.</p>}
        {submitted.length>=2&&status==="ready"&&results.length>0&&
          <div className={styles.list} role="list" aria-label="Search suggestions">{results.map((item)=>(
            <Link role="listitem" key={item.href} href={item.href} className={styles.result} onClick={()=>setOpen(false)}>
              <span className={styles.category}>{item.category}</span><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </Link>
          ))}</div>}
      </div>
      <Link className={styles.fullSearch} href={submitted?"/search?q="+encodeURIComponent(submitted):"/search"} onClick={()=>setOpen(false)}>Open full search <span aria-hidden="true">→</span></Link>
    </div>}
  </div>;
}

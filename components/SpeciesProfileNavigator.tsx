"use client";

import {useEffect,useMemo,useRef,useState,type ReactNode,type TouchEvent} from "react";
import {useRouter} from "next/navigation";
import {LEDGER_BROWSE_ORDER_KEY,type LedgerBrowseOrder} from "@/lib/ledger-navigation";
import styles from "./SpeciesProfile.module.css";

type SpeciesNavItem={slug:string;name:string};
/** Keep a single profile on screen while browsing adjacent records.
 * Swipe is restricted to the hero, never the widget canvas or scrollable detail sheets.
 */
export function SpeciesProfileNavigator({currentSlug,catalogue,children}:{
 currentSlug:string;catalogue:SpeciesNavItem[];children:ReactNode;
}){
 const router=useRouter();
 const [browseSlugs,setBrowseSlugs]=useState<string[]>(()=>catalogue.map(item=>item.slug));
 const gesture=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{
  const fallback=catalogue.map(item=>item.slug);
  try{
   const raw=sessionStorage.getItem(LEDGER_BROWSE_ORDER_KEY);
   if(!raw){setBrowseSlugs(fallback);return;}
   const parsed=JSON.parse(raw) as Partial<LedgerBrowseOrder>;
   if(!Array.isArray(parsed.slugs)||!parsed.slugs.includes(currentSlug)){setBrowseSlugs(fallback);return;}
   const valid=new Set(catalogue.map(item=>item.slug));
   const matched=[...new Set(parsed.slugs)].filter((slug):slug is string=>typeof slug==="string"&&valid.has(slug));
   setBrowseSlugs(matched.includes(currentSlug)&&matched.length>0?matched:fallback);
  }catch{setBrowseSlugs(fallback)}
 },[currentSlug,catalogue]);
 const bySlug=useMemo(()=>new Map(catalogue.map(item=>[item.slug,item])),[catalogue]);
 const index=browseSlugs.indexOf(currentSlug);
 const prev=index>0?bySlug.get(browseSlugs[index-1]):null;
 const next=index>=0&&index<browseSlugs.length-1?bySlug.get(browseSlugs[index+1]):null;
 // Warm only the adjacent routes, never the entire species catalogue.
 useEffect(()=>{
  if(prev)router.prefetch("/ledger/"+encodeURIComponent(prev.slug));
  if(next)router.prefetch("/ledger/"+encodeURIComponent(next.slug));
 },[prev?.slug,next?.slug,router]);
 const navigate=(item:SpeciesNavItem|null|undefined)=>{
  if(!item||item.slug===currentSlug)return;
  router.push("/ledger/"+encodeURIComponent(item.slug),{scroll:true});
 };
 const start=(event:TouchEvent<HTMLDivElement>)=>{
  if(event.touches.length!==1||((event.target as HTMLElement).closest("a,button,input,select,textarea,[role=dialog]"))){gesture.current=null;return;}
  const x=event.touches[0].clientX;
  // Preserve iOS Safari's native edge-swipe Back gesture.
  if(x<30||x>window.innerWidth-30){gesture.current=null;return;}
  gesture.current={x,y:event.touches[0].clientY};
 };
 const end=(event:TouchEvent<HTMLDivElement>)=>{
  const first=gesture.current;gesture.current=null;
  if(!first||event.changedTouches.length!==1)return;
  const dx=event.changedTouches[0].clientX-first.x;
  const dy=event.changedTouches[0].clientY-first.y;
  // Directional threshold avoids hijacking regular vertical page scrolling.
  if(Math.abs(dx)<75||Math.abs(dx)<Math.abs(dy)*1.5)return;
  navigate(dx<0?next:prev);
 };
 return <div className={styles.profileBrowse}>
  <div data-swipe-navigation="local" className={styles.profileSwipeRegion} onTouchStart={start} onTouchEnd={end} onTouchCancel={()=>{gesture.current=null}}>
   {children}
  </div>
  {catalogue.length>1?<nav className={styles.profileBrowseBar} aria-label="Browse Leaf Ledger species">
   <button type="button" onClick={()=>navigate(prev)} disabled={!prev} aria-label={prev?"Previous species: "+prev.name:"No previous species"} className={styles.profileBrowseArrow}>←</button>
   <div className={styles.profileBrowseProgress}>
    <strong>{index>=0?index+1:1} of {browseSlugs.length}</strong>
    <span>Swipe the species header to explore</span>
   </div>
   <button type="button" onClick={()=>navigate(next)} disabled={!next} aria-label={next?"Next species: "+next.name:"No next species"} className={styles.profileBrowseArrow}>→</button>
  </nav>:null}
 </div>;
}

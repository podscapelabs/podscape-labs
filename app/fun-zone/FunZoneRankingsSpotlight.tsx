"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "@/components/PodscapeLineIcon";
import styles from "./fun-zone-portal.module.css";

type Player={name:string;position:number;mine:boolean;points?:number;exp?:number;level?:number;value?:number;returnPct?:number;weeklyPct?:number|null};
type Arcade={rows:Player[];mine:Player|null;participating:boolean};
type Lifetime={rows:Player[];mine:Player|null;participating:boolean};
type MarketBoard={rows:Player[];mine:Player|null;count:number};
type Market={wealth:MarketBoard;return:MarketBoard;weekly:MarketBoard;participating:boolean;weeklyReady:boolean};
type Kind="arcade"|"lifetime"|"wealth"|"returns"|"movers";
type Slide={id:Kind;title:string;eyebrow:string;description:string;href:string;icon:PodscapeIconName};
const tabNames:Record<Kind,string>={arcade:"Arcade",lifetime:"EXP",wealth:"Rich List",returns:"Investors",movers:"Movers"};
const slides:Slide[]=[
 {id:"arcade",title:"Arcade Leaders",eyebrow:"WEEKLY · VERIFIED PUZZLES",description:"The top puzzle solvers this week",href:"/fun-zone/leaderboard",icon:"trophy"},
 {id:"lifetime",title:"Lifetime EXP",eyebrow:"ALL-TIME · KEEPER LEVELS",description:"PodScape's most experienced keepers",href:"/account/progress/rankings",icon:"achievement"},
 {id:"wealth",title:"The Rich List",eyebrow:"POD EXCHANGE · PORTFOLIO VALUE",description:"Fictional market wealth",href:"/fun-zone/pod-exchange/rankings",icon:"gamepad"},
 {id:"returns",title:"Top Investors",eyebrow:"POD EXCHANGE · TOTAL RETURN",description:"Investors with the best percentage growth",href:"/fun-zone/pod-exchange/rankings",icon:"trophy"},
 {id:"movers",title:"Market Movers",eyebrow:"POD EXCHANGE · THIS WEEK",description:"Performance since the Monday UTC snapshot",href:"/fun-zone/pod-exchange/rankings",icon:"gamepad"}
];
type State={arcade?:Arcade;lifetime?:Lifetime;market?:Market;attempted:boolean};
const readable=(value:number)=>value.toLocaleString("en-CA",{maximumFractionDigits:0});
const bucks=(value:number)=>value.toLocaleString("en-CA",{maximumFractionDigits:0})+" DB";
const percentage=(value:number)=>(value>0?"+":"")+value.toFixed(1)+"%";
function sliceFor(state:State,kind:Kind):{rows:Player[];mine:Player|null;participating:boolean;available:boolean;waiting:boolean}{
 if(kind==="arcade")return {rows:state.arcade?.rows||[],mine:state.arcade?.mine||null,participating:!!state.arcade?.participating,available:!!state.arcade,waiting:false};
 if(kind==="lifetime")return {rows:state.lifetime?.rows||[],mine:state.lifetime?.mine||null,participating:!!state.lifetime?.participating,available:!!state.lifetime,waiting:false};
 const name=kind==="wealth"?"wealth":kind==="returns"?"return":"weekly";
 return {rows:state.market?.[name]?.rows||[],mine:state.market?.[name]?.mine||null,
  participating:!!state.market?.participating,available:!!state.market,
  waiting:kind==="movers"&&!!state.market&&!state.market.weeklyReady};
}
function amount(row:Player,kind:Kind){
 switch(kind){
  case "arcade":return readable(row.points||0)+" pts";
  case "lifetime":return readable(row.exp||0)+" EXP";
  case "wealth":return bucks(row.value||0);
  case "returns":return percentage(row.returnPct||0);
  case "movers":return percentage(row.weeklyPct||0);
 }
}
async function fetchBoard<T>(url:string,signal:AbortSignal):Promise<T|undefined>{
 try{const response=await fetch(url,{cache:"no-store",signal});if(!response.ok)return undefined;return await response.json() as T;}
 catch{return undefined;}
}
export function FunZoneRankingsSpotlight(){
 const [active,setActive]=useState(0);
 const [data,setData]=useState<State>({attempted:false});
 const track=useRef<HTMLDivElement>(null);
 const tabs=useRef<HTMLDivElement>(null);
 const activeRef=useRef(0);
 useEffect(()=>{
  let live=true;
  const controller=new AbortController();
  const refresh=async()=>{
   const [arcade,lifetime,market]=await Promise.all([
    fetchBoard<Arcade>("/api/fun-zone/rankings?period=weekly&game=all",controller.signal),
    fetchBoard<Lifetime>("/api/progress/rankings",controller.signal),
    fetchBoard<Market>("/api/fun-zone/pod-exchange/rankings",controller.signal)
   ]);
   if(live)setData({arcade,lifetime,market,attempted:true});
  };
  void refresh();
  const timer=window.setInterval(()=>{if(!document.hidden)void refresh()},60_000);
  return()=>{live=false;controller.abort();window.clearInterval(timer)};
 },[]);
 const navigate=(index:number)=>{
  const next=Math.max(0,Math.min(slides.length-1,index));
  activeRef.current=next;setActive(next);
  const node=track.current;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth";
  if(node)node.scrollTo({left:next*node.clientWidth,behavior:motion});
  const strip=tabs.current;
  const tab=strip?.children.item(next) as HTMLElement|null;
  if(strip&&tab){
   const left=strip.scrollLeft+tab.getBoundingClientRect().left-strip.getBoundingClientRect().left-(strip.clientWidth-tab.clientWidth)/2;
   strip.scrollTo({left,behavior:motion});
  }
 };
 const onScroll=()=>{
  const node=track.current;if(!node||node.clientWidth===0)return;
  const index=Math.max(0,Math.min(slides.length-1,Math.round(node.scrollLeft/node.clientWidth)));
  if(index!==activeRef.current){activeRef.current=index;setActive(index);}
 };
 return <section className={styles.rankingsSpotlight} aria-label="Rankings Spotlight, swipe to see different leaderboards">
  <div className={styles.rankingsSpotlightHead}>
   <div><span className={styles.eyebrow}>THE COMMUNITY · AT A GLANCE</span><h2>Rankings Spotlight</h2><p>Five standings, one swipe. See who's leading across PodScape.</p></div>
   <span className={styles.rankingsIndex}>{active+1} / {slides.length}</span>
  </div>
  <div className={styles.rankingsViewport} ref={track} onScroll={onScroll} tabIndex={0} aria-label="Swipeable ranking cards" onKeyDown={event=>{if(event.key==="ArrowRight"){event.preventDefault();navigate(active+1)}else if(event.key==="ArrowLeft"){event.preventDefault();navigate(active-1)}}}>
   {slides.map(slide=>{
    const board=sliceFor(data,slide.id);
    const top=board.rows.slice(0,3);
    const detail=slide.id==="lifetime"?"Your level":slide.id==="arcade"?"Your puzzle score":"Your market score";
    return <article key={slide.id} className={styles.rankingsSlide} aria-label={slide.title}>
     <div className={styles.rankingsSlideTitle}>
      <span className={styles.rankingsSlideIcon}><PodscapeLineIcon name={slide.icon}/></span>
      <div><small>{slide.eyebrow}</small><h3>{slide.title}</h3><p>{slide.description}</p></div>
      <Link href={slide.href} aria-label={"Open full "+slide.title+" leaderboard"}>Full board <span aria-hidden="true">→</span></Link>
     </div>
     {board.available&&top.length?
      <div className={styles.rankingsTopThree}>{top.map((person,i)=><div key={i} className={styles.rankingPlace}>
       <span className={styles.rankingPlaceNumber}>#{person.position}</span>
       <span className={styles.rankingPlaceName}>{person.name}{person.mine?" · You":""}{slide.id==="lifetime"?<small>Level {readable(person.level||1)}</small>:null}</span>
       <strong>{amount(person,slide.id)}</strong>
      </div>)}</div>:
      <div className={styles.rankingsEmpty}>
       {!data.attempted?"Checking standings…":!board.available?"Standings temporarily unavailable":board.waiting?"Market Movers begins with the next weekly snapshot":"The podium is waiting for its first ranked players."}
      </div>}
     <div className={styles.rankingsSlideFoot}>
      <span>{board.participating&&board.mine?
       <><strong>Your rank #{board.mine.position}</strong> · {detail}: {amount(board.mine,slide.id)}</>:
       board.participating?"You're participating — keep playing!":"Want to appear? Join the full leaderboard."}</span>
      <Link href={slide.href}>{board.participating?"View standings":"Explore & join"} <span aria-hidden="true">→</span></Link>
     </div>
    </article>;
   })}
  </div>
  <div className={styles.rankingsPager}>
   <button type="button" aria-label="Previous rankings" disabled={active===0} onClick={()=>navigate(active-1)}><span className={styles.rankingsBackIcon}><PodscapeLineIcon name="arrow-right"/></span></button>
   <div className={styles.rankingsPagerTabs} ref={tabs} role="group" aria-label="Choose rankings">
    {slides.map((slide,i)=><button key={slide.id} type="button" onClick={()=>navigate(i)}
     aria-label={"Show "+slide.title} aria-current={active===i?"true":undefined}>{tabNames[slide.id]}</button>)}
   </div>
   <button type="button" aria-label="Next rankings" disabled={active===slides.length-1} onClick={()=>navigate(active+1)}><PodscapeLineIcon name="arrow-right"/></button>
  </div>
 </section>;
}

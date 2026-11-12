"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {DuckBuckIcon} from "./DuckBucks";
import {arcadeCycleAt,headlineAt,newsImpactAt,STOCKS} from "@/lib/pod-exchange";
import styles from "./HomeMarketNews.module.css";

export function HomeMarketNews(){
 const [cycle,setCycle]=useState<number|null>(null);
 const [feed,setFeed]=useState<{mode:"legacy";cycle:number}|{mode:"v3";cycle:number;cutoverCycle:number;bulletin:{symbol:string;headline:string;detail:string;publishedMinute:number};quotes:Record<string,number>;previous:Record<string,number>}|null>(null);
 const [feedError,setFeedError]=useState(false);
 useEffect(()=>{
  let alive=true;
  const refresh=async()=>{
   setCycle(arcadeCycleAt(Date.now()));
   try{
    const response=await fetch("/api/fun-zone/pod-exchange/market?range=10m",{cache:"no-store"});
    if(!response.ok)throw Error("Market unavailable");
    const data=await response.json();
    if(alive){setFeed(data);setFeedError(false);}
   }catch{if(alive)setFeedError(true);}
  };
  void refresh();
  const timer=window.setInterval(()=>void refresh(),15_000);
  return()=>{alive=false;window.clearInterval(timer)};
 },[]);
 const v3=feed?.mode==="v3"?feed:null;
 const story=cycle===null?null:v3?{story:v3.bulletin,publishedCycle:v3.cutoverCycle+v3.bulletin.publishedMinute}:headlineAt(cycle);
 const company=story?STOCKS.find(stock=>stock.symbol===story.story.symbol):null;
 const impact=story&&cycle!==null?v3?((v3.quotes[story.story.symbol]||1)/(v3.previous[story.story.symbol]||1)-1):newsImpactAt(story.story.symbol,cycle):0;
 const storyAge=story&&cycle!==null?cycle-story.publishedCycle:0;
 return <section className={styles.card} aria-label="The Pod Exchange market news">
  <div className={styles.head}>
   <span className={styles.headlineIcon}><PodscapeLineIcon name="news"/></span>
   <div><small>THE LEAF STREET JOURNAL</small><h3>Market News</h3></div>
   <span className={styles.beta}>BETA</span>
  </div>
  <Link className={styles.storyLink} href="/fun-zone/pod-exchange" aria-label={story?`Open The Pod Exchange: ${story.story.headline}`:"Open The Pod Exchange"}>
   <span className={styles.storyLabel}><DuckBuckIcon size={16}/> {company?.symbol||"PODX"} · {cycle===null?"Opening market…":"Latest bulletin"}</span>
   <strong>{feedError?"Market headlines temporarily unavailable":story?.story.headline||"Tiny markets, big news."}</strong>
   <p>{story?.story.detail||"See what&apos;s happening at The Pod Exchange."}</p>
   {story&&!feedError?<span className={styles.marketInfluence}>{impact>=0?"+":""}{(impact*100).toFixed(1)}% {v3?"market move":"news impact"} · {storyAge===0?"Breaking":storyAge===1?"Cooling":"Fading"}</span>:null}
   <span className={styles.cta}>Visit The Pod Exchange <PodscapeLineIcon name="arrow-right"/></span>
  </Link>
  <small className={styles.foot}>Fictional headlines refresh every five minutes · No real money</small>
 </section>;
}

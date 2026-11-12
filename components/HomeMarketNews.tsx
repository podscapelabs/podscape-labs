"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {DuckBuckIcon} from "./DuckBucks";
import {arcadeCycleAt,headlineAt,newsImpactAt,STOCKS} from "@/lib/pod-exchange";
import styles from "./HomeMarketNews.module.css";

export function HomeMarketNews(){
 const [cycle,setCycle]=useState<number|null>(null);
 useEffect(()=>{
  const refresh=()=>setCycle(arcadeCycleAt(Date.now()));
  refresh();
  const timer=window.setInterval(refresh,15_000);
  return()=>window.clearInterval(timer);
 },[]);
 const story=cycle===null?null:headlineAt(cycle);
 const company=story?STOCKS.find(stock=>stock.symbol===story.story.symbol):null;
 const impact=story&&cycle!==null?newsImpactAt(story.story.symbol,cycle):0;
 const storyAge=story&&cycle!==null?cycle-story.publishedCycle:0;
 return <section className={styles.card} aria-label="The Pod Exchange market news">
  <div className={styles.head}>
   <span className={styles.headlineIcon}><PodscapeLineIcon name="news"/></span>
   <div><small>THE LEAF STREET JOURNAL</small><h3>Market News</h3></div>
   <span className={styles.beta}>BETA</span>
  </div>
  <Link className={styles.storyLink} href="/fun-zone/pod-exchange" aria-label={story?`Open The Pod Exchange: ${story.story.headline}`:"Open The Pod Exchange"}>
   <span className={styles.storyLabel}><DuckBuckIcon size={16}/> {company?.symbol||"PODX"} · {cycle===null?"Opening market…":"Latest bulletin"}</span>
   <strong>{story?.story.headline||"Tiny markets, big news."}</strong>
   <p>{story?.story.detail||"See what&apos;s happening at The Pod Exchange."}</p>
   {story?<span className={styles.marketInfluence}>{impact>=0?"+":""}{(impact*100).toFixed(1)}% impact · {storyAge===0?"Breaking":storyAge===1?"Cooling":"Fading"}</span>:null}
   <span className={styles.cta}>Visit The Pod Exchange <PodscapeLineIcon name="arrow-right"/></span>
  </Link>
  <small className={styles.foot}>Fictional headlines refresh every 15 minutes · No real money</small>
 </section>;
}

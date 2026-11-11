"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {DuckBuckIcon} from "./DuckBucks";
import {MARKET_INTERVAL_MS,cycleAt,newsAt,STOCKS,type MarketNews} from "@/lib/pod-exchange";
import styles from "./HomeMarketNews.module.css";

/** The latest simulated story remains visible until the next 15-minute bulletin.
 * The price catalyst itself still only affects the five-minute announcement tick.
 */
function latestMarketStory(cycle:number):{news:MarketNews;cycle:number}|null{
 const lastAnnouncement=cycle-((cycle%3+3)%3);
 const story=newsAt(lastAnnouncement);
 return story?{news:story,cycle:lastAnnouncement}:null;
}
export function HomeMarketNews(){
 const [cycle,setCycle]=useState<number|null>(null);
 useEffect(()=>{
  const refresh=()=>setCycle(cycleAt(Date.now()));
  refresh();
  const timer=window.setInterval(refresh,15_000);
  return()=>window.clearInterval(timer);
 },[]);
 const story=cycle===null?null:latestMarketStory(cycle);
 const company=story?STOCKS.find(stock=>stock.symbol===story.news.symbol):null;
 return <section className={styles.card} aria-label="The Pod Exchange market news">
  <div className={styles.head}>
   <span className={styles.headlineIcon}><PodscapeLineIcon name="news"/></span>
   <div><small>THE LEAF STREET JOURNAL</small><h3>Market News</h3></div>
   <span className={styles.beta}>BETA</span>
  </div>
  <Link className={styles.storyLink} href="/fun-zone/pod-exchange" aria-label={story?`Open The Pod Exchange: ${story.news.headline}`:"Open The Pod Exchange"}>
   <span className={styles.storyLabel}><DuckBuckIcon size={16}/> {company?.symbol||"PODX"} · {cycle===null?"Opening market…":"Latest bulletin"}</span>
   <strong>{story?.news.headline||"Tiny markets, big news."}</strong>
   <p>{story?.news.detail||"See what's happening at The Pod Exchange."}</p>
   <span className={styles.cta}>Visit The Pod Exchange <PodscapeLineIcon name="arrow-right"/></span>
  </Link>
  <small className={styles.foot}>Fictional headlines refresh every 15 minutes · No real money</small>
 </section>;
}

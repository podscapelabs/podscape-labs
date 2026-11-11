"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {cycleAt,defaultPortfolio,priceAt,sanitizePortfolio,STOCKS,STORAGE_KEY,totalValue,type Portfolio} from "@/lib/pod-exchange";
import styles from "./fun-zone-portal.module.css";
import {DuckBucks,DuckBuckIcon} from "@/components/DuckBucks";
export function PodExchangeWatchlist(){
 const [time,setTime]=useState<number|null>(null);
 const [portfolio,setPortfolio]=useState<Portfolio>(defaultPortfolio);
 useEffect(()=>{
  const read=()=>{try{const saved=localStorage.getItem(STORAGE_KEY);setPortfolio(saved?sanitizePortfolio(JSON.parse(saved)):defaultPortfolio());}catch{setPortfolio(defaultPortfolio());}};
  read();setTime(Date.now());
  const t=window.setInterval(()=>{setTime(Date.now());read();},30_000);
  window.addEventListener("storage",read);
  return()=>{window.clearInterval(t);window.removeEventListener("storage",read)};
 },[]);
 const cycle=cycleAt(time??0);
 const price=priceAt("DUCK",cycle);
 const gain=(price/priceAt("DUCK",cycle-1)-1)*100;
 return <section className={styles.exchangeWidget} aria-label="Duck Bucks watchlist">
  <span className={styles.eyebrow}>POD EXCHANGE · BETA</span><h2><DuckBuckIcon size={27}/> Duck Bucks Watchlist</h2>
  <div className={styles.watchlistStats}>
   <span><small>Portfolio value</small><strong>{time===null?"Loading…":<DuckBucks amount={totalValue(portfolio,cycle)}/>}</strong></span>
   <span><small>DUCK · Rubber Ducky Inc.</small><strong>{time===null?"Loading…":<DuckBucks amount={price}/>}</strong><small>{time===null?"5-minute market":(gain>=0?"+":"")+gain.toFixed(2)+"% this tick"}</small></span>
  </div>
  <div><span>{STOCKS.length} fictional companies</span><Link href="/fun-zone/pod-exchange">Open the Exchange →</Link></div>
 </section>;
}

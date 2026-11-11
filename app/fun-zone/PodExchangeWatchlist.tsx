"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {cycleAt,decodeSavedPortfolio,defaultPortfolio,priceAt,sanitizePortfolio,STOCKS,STORAGE_KEY,totalValue,type Portfolio} from "@/lib/pod-exchange";
import styles from "./fun-zone-portal.module.css";
import {DuckBucks,DuckBuckIcon} from "@/components/DuckBucks";
import {ExchangeCompanyIcon} from "@/components/ExchangeCompanyIcon";
export function PodExchangeWatchlist(){
 const [time,setTime]=useState<number|null>(null);
 const [portfolio,setPortfolio]=useState<Portfolio>(defaultPortfolio);
 const [portfolioAvailable,setPortfolioAvailable]=useState(false);
 useEffect(()=>{
  let mounted=true;
  const read=async()=>{
   try{
    const response=await fetch("/api/fun-zone/pod-exchange",{cache:"no-store"});
    if(response.ok){
     const data=await response.json() as {exists:boolean;portfolio:Portfolio|null;userId?:string};
     if(!mounted)return;
     if(data.exists&&data.portfolio){
      setPortfolio(sanitizePortfolio(data.portfolio));setPortfolioAvailable(true);return;
     }
     // Do not show another account's cached wallet while initializing.
     const owner=localStorage.getItem(STORAGE_KEY+":cloud-owner");
     if(owner&&owner!==data.userId){setPortfolioAvailable(false);return;}
     // A brand-new account may have an unclaimed beta wallet.
    }else if(response.status!==401){
     // Unknown server status must never be presented as a new 10,000 wallet.
     if(mounted)setPortfolioAvailable(false);return;
    }
    const key=response.status===401&&localStorage.getItem(STORAGE_KEY+":cloud-owner")?STORAGE_KEY+":guest":STORAGE_KEY;
    const saved=decodeSavedPortfolio(localStorage.getItem(key));
    if(mounted){setPortfolio(saved.portfolio);setPortfolioAvailable(true)}
   }catch{if(mounted)setPortfolioAvailable(false)}
  };
  void read();setTime(Date.now());
  const timer=window.setInterval(()=>{setTime(Date.now());void read()},30_000);
  const update=()=>void read();
  window.addEventListener("storage",update);
  window.addEventListener("podscape-exchange-wallet-updated",update);
  return()=>{mounted=false;window.clearInterval(timer);window.removeEventListener("storage",update);window.removeEventListener("podscape-exchange-wallet-updated",update)}
 },[]);
 const cycle=cycleAt(time??0);
 const price=priceAt("DUCK",cycle);
 const gain=(price/priceAt("DUCK",cycle-1)-1)*100;
 return <section className={styles.exchangeWidget} aria-label="Duck Bucks watchlist">
  <span className={styles.eyebrow}>POD EXCHANGE · BETA</span><h2><DuckBuckIcon size={27}/> Duck Bucks Watchlist</h2>
  <div className={styles.watchlistStats}>
   <span><small>Portfolio value</small><strong>{time===null||!portfolioAvailable?"Syncing…":<DuckBucks amount={totalValue(portfolio,cycle)}/>}</strong></span>
   <span><small style={{display:"flex",alignItems:"center",gap:6}}><ExchangeCompanyIcon symbol="DUCK" size={17}/> DUCK · Rubber Ducky Inc.</small><strong>{time===null?"Loading…":<DuckBucks amount={price}/>}</strong><small>{time===null?"5-minute market":(gain>=0?"+":"")+gain.toFixed(2)+"% this tick"}</small></span>
  </div>
  <div><span>{STOCKS.length} fictional companies</span><Link href="/fun-zone/pod-exchange">Open the Exchange →</Link></div>
 </section>;
}

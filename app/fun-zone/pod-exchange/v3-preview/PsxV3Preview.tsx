"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ExchangeCompanyIcon} from "@/components/ExchangeCompanyIcon";
import {DuckBucks} from "@/components/DuckBucks";
import styles from "./preview.module.css";

type Range="10m"|"30m"|"1h"|"24h";
type Quote={minute:number;price:number};
type Frame={minute:number;prices:Record<string,number>;
 major:{symbol:string;headline:string;detail:string};
 bulletin:{symbol:string;headline:string;detail:string};
 rumour:{symbol:string;headline:string;detail:string}|null;
 rumourResolution:{resolution:string;publishedHeadline:string;confirmedSymbol:string}|null;};
type Preview={available:true;cycle:number;frame:Frame;history:Record<string,Quote[]>;
 simulated:boolean;tradable:false;range:Range;disclaimer:string};
const companies=[
 {symbol:"MOO",name:"Dairy Cow Industries",tag:"Steady giant"},
 {symbol:"PANDA",name:"Panda King Holdings",tag:"Leaf estates"},
 {symbol:"BLUE",name:"Powder Blue Logistics",tag:"Fast movement"},
 {symbol:"TITAN",name:"Titan Heavy Industries",tag:"Major projects"},
 {symbol:"CLOWN",name:"Clown Capital",tag:"Hype and chaos"},
 {symbol:"DUCK",name:"Rubber Ducky Inc.",tag:"Luxury scandals"}
];
function MiniChart({data}:{data:Quote[]}){
 const p=data.map(item=>item.price);
 const min=Math.min(...p),max=Math.max(...p),spread=Math.max(.01,max-min);
 const points=p.map((v,i)=>[Math.round(i*290/Math.max(1,p.length-1)),Math.round(70-(v-min)/spread*58)].join(",")).join(" ");
 const rising=p.length<2||p[p.length-1]>=p[0];
 return <svg viewBox="0 0 290 80" preserveAspectRatio="none" role="img" aria-label={"Historical shared market quotes, "+(rising?"rising":"falling")} className={styles.chart}><path d="M0 70H290" fill="none" stroke="currentColor" strokeOpacity=".15"/><polyline points={points} stroke={rising?"var(--game-correct,#438b5c)":"var(--game-incorrect,#c5685e)"} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
}
export function PsxV3Preview(){
 const [range,setRange]=useState<Range>("30m");
 const [symbol,setSymbol]=useState("DUCK");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(true);
 useEffect(()=>{
  let alive=true;
  const load=async()=>{
   try{
    const response=await fetch("/api/fun-zone/pod-exchange/v3-preview?range="+encodeURIComponent(range),{cache:"no-store"});
    if(!response.ok)throw Error(response.status===403?"Owner access is required.":"Preview service unavailable.");
    const data=await response.json();
    if(!alive)return;
    if(!data.available){setError(data.reason||"Preview is disabled.");setPreview(null);}
    else{setError("");setPreview(data);}
   }catch(e){if(alive){setError(e instanceof Error?e.message:"Preview unavailable.");setPreview(null);}}
   finally{if(alive)setBusy(false);}
  };
  setBusy(true);void load();const timer=window.setInterval(()=>void load(),30_000);
  return()=>{alive=false;window.clearInterval(timer)};
 },[range]);
 const stock=companies.find(item=>item.symbol===symbol)||companies[0];
 const samples=useMemo(()=>preview?.history[symbol]||[],[preview,symbol]);
 const current=preview?.frame.prices[symbol]||0;
 const first=samples[0]?.price||current;
 const change=first?100*(current/first-1):0;
 return <main className={styles.page}>
  <nav className={styles.breadcrumb}><Link href="/fun-zone/pod-exchange">The Pod Exchange</Link><span aria-hidden="true">/</span><span>Owner preview</span></nav>
  <header className={styles.hero}><div><small>OWNER STUDIO · PSX 2.0</small><h1>The Leaf Street Lab</h1><p>Six companies. One fictional market. Endless financial misconduct.</p></div><span className={styles.previewTag}>SIMULATION · NO TRADES</span></header>
  <div className={styles.notice}><strong>Safe testing environment</strong><span>The prices below do not affect live Duck Bucks, investor portfolios, rankings, or achievements. No trades can be placed here.</span></div>
  {error?<div role="alert" className={styles.error}>{error}</div>:busy&&!preview?<p className={styles.loading}>Loading the market simulation…</p>:null}
  {preview?<><section className={styles.market} aria-label="Six fictional market companies">
    <div className={styles.sectionHeader}><div><small>THE TRADING FLOOR</small><h2>Live simulation</h2></div><span>1-minute cycles · 24/7 model</span></div>
    <div className={styles.grid}>{companies.map(item=>{
     const history=preview.history[item.symbol]||[],now=preview.frame.prices[item.symbol];
     const prior=history.length>1?history[history.length-2].price:now;
     const pct=prior?(now/prior-1)*100:0;
     return <button key={item.symbol} type="button" className={styles.stock} aria-pressed={item.symbol===symbol} onClick={()=>setSymbol(item.symbol)}>
       <div className={styles.stockTop}><ExchangeCompanyIcon symbol={item.symbol} size={25}/><div><strong>{item.name}</strong><small>{item.symbol} · {item.tag}</small></div></div>
       <div className={styles.quote}><DuckBucks amount={now}/><span className={pct>=0?styles.up:styles.down}>{pct>=0?"+":""}{pct.toFixed(2)}% this tick</span></div>
     </button>;
    })}</div>
   </section>
   <section className={styles.detail} aria-label="Selected company chart">
    <div className={styles.sectionHeader}><div><small>{symbol} / MARKET HISTORY</small><h2>{stock.name}</h2></div><strong><DuckBucks amount={current}/></strong></div>
    <div className={styles.chartControls} role="group" aria-label="Chart range">{(["10m","30m","1h","24h"] as const).map(option=><button key={option} type="button" aria-pressed={range===option} onClick={()=>setRange(option)}>{option}</button>)}</div>
    <MiniChart data={samples}/>
    <p className={styles.chartCaption}>{change>=0?"+":""}{change.toFixed(2)}% over the selected range. Historical quotes are produced by the same server-private prototype.</p>
   </section>
   <section className={styles.stories}>
    <div className={styles.sectionHeader}><div><small>MARKET MAYHEM</small><h2>The Leaf Street Journal</h2></div></div>
    <article><small>MAJOR CORPORATE EVENT · {preview.frame.major.symbol}</small><h3>{preview.frame.major.headline}</h3><p>{preview.frame.major.detail}</p></article>
    <article><small>FIVE-MINUTE BULLETIN · {preview.frame.bulletin.symbol}</small><h3>{preview.frame.bulletin.headline}</h3><p>{preview.frame.bulletin.detail}</p></article>
    {preview.frame.rumour?<article><small>THE RUMOUR MILL · UNVERIFIED</small><h3>{preview.frame.rumour.headline}</h3><p>{preview.frame.rumour.detail}</p></article>:null}
    {preview.frame.rumourResolution?<article><small>RUMOUR RESOLVED · {preview.frame.rumourResolution.resolution.toUpperCase()}</small><h3>{preview.frame.rumourResolution.confirmedSymbol}</h3><p>{preview.frame.rumourResolution.publishedHeadline}</p></article>:null}
   </section>
   <p className={styles.footnote}>This owner-only simulation follows a disposable UTC-day test anchor. It is not a production execution price or investment recommendation.</p>
  </>:null}
 </main>;
}

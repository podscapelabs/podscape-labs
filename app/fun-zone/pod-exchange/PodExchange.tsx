"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {announceAchievement,type AchievementNotice} from "@/components/AchievementToast";
import Link from "next/link";
import {createPortal} from "react-dom";
import {PodscapeInfoDialog} from "@/components/PodscapeInfoDialog";
import styles from "./exchange.module.css";
import {DuckBucks,DuckBuckIcon,duckBucksNumber} from "@/components/DuckBucks";
import {ExchangeCompanyIcon} from "@/components/ExchangeCompanyIcon";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {STOCKS,STORAGE_KEY,MARKET_INTERVAL_MS,ARCADE_INTERVAL_MS,STARTING_BUCKS,arcadeCycleAt,isArcadeCycle,tickIntervalFor,marketSessionAt,sessionImpactAt,defaultPortfolio,decodeSavedPortfolio,executeOrder,money,headlineAt,newsImpactAt,priceAt,tradeFee,tradeSubtotal,tradeTotal,maxAffordableShares,sanitizePortfolio,totalValue,type Portfolio} from "@/lib/pod-exchange";

function CompanyMark({symbol}:{symbol:string}){return <ExchangeCompanyIcon symbol={symbol}/>;}
const change=(n:number)=>(n>=0?"+":"")+n.toFixed(2)+"%";
const countdown=(ms:number)=>String(Math.floor(ms/60000)).padStart(2,"0")+":"+String(Math.floor((ms%60000)/1000)).padStart(2,"0");
type ChartRange="10m"|"30m"|"1h"|"24h";
type MarketFeed={mode:"legacy";cycle:number}|{
 mode:"v3";cycle:number;quotes:Record<string,number>;previous:Record<string,number>;
 history:Record<string,Array<{cycle:number;price:number}>>;range:string;minute:number;cutoverCycle:number;
 major:{headline:string;detail:string;symbol:string;publishedMinute:number};
 bulletin:{headline:string;detail:string;symbol:string;publishedMinute:number};
 rumour:{headline:string;detail:string;symbol:string}|null;
 rumourResolution:{resolution:string;confirmedSymbol:string;publishedHeadline:string}|null;
};
function Sparkline({symbol,cycle,range,series}:{symbol:string;cycle:number;range:ChartRange;series?:number[]}){
 // Sample only completed, authoritative deterministic cycles. The V3 history API
 // will replace this reconstruction once versioned persisted quotes are enabled.
 const minutes=range==="10m"?10:range==="30m"?30:range==="1h"?60:1440;
 const spacing=isArcadeCycle(cycle)?minutes===1440?15:1:minutes===1440?3:1;
 const samples=Math.ceil(minutes/(isArcadeCycle(cycle)?spacing:5*spacing));
 const prices=useMemo(()=>series&&series.length>1?series:Array.from({length:samples+1},(_,i)=>priceAt(symbol,cycle-(samples-i)*spacing)),[symbol,cycle,spacing,samples,series]);
 const low=Math.min(...prices)*.985,high=Math.max(...prices)*1.015;
 const path=prices.map((p,i)=>`${Math.round(i*300/(prices.length-1))},${Math.round(79-68*(p-low)/(high-low))}`).join(" ");
 const rising=prices[prices.length-1]>=prices[0];
 return <svg className={styles.chart} viewBox="0 0 300 88" preserveAspectRatio="none" role="img" aria-label={`${symbol} historical market quotes, last ${range}, ${rising?"rising":"falling"}`}><line x1="0" x2="300" y1="79" y2="79" stroke="currentColor" strokeOpacity=".17"/><polyline points={path} fill="none" stroke={rising?"var(--game-correct)":"var(--game-incorrect)"} strokeWidth="2.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
type StorageMode="loading"|"cloud"|"local"|"error";
type CloudState={exists:boolean;portfolio:Portfolio|null;userId?:string;unlocked?:AchievementNotice[];duplicate?:boolean};
const BACKUP_KEY=STORAGE_KEY+":backup";
const OWNER_KEY=STORAGE_KEY+":cloud-owner";
const GUEST_KEY=STORAGE_KEY+":guest";
function guestStorageKey(){return localStorage.getItem(OWNER_KEY)?GUEST_KEY:STORAGE_KEY}
function localWalletForAccount(userId:string):{portfolio:Portfolio;isNew:boolean}{
 const owner=localStorage.getItem(OWNER_KEY);
 if(owner&&owner!==userId)return decodeSavedPortfolio(localStorage.getItem(GUEST_KEY));
 return decodeSavedPortfolio(localStorage.getItem(STORAGE_KEY));
}
function saveLocalSnapshot(portfolio:Portfolio,key=STORAGE_KEY):boolean{
 try{
  const previous=localStorage.getItem(key);
  localStorage.setItem(key,JSON.stringify(portfolio));
  if(previous!==null)try{localStorage.setItem(key===STORAGE_KEY?BACKUP_KEY:key+":backup",previous)}catch{/* Preserve active wallet even when backup storage is full. */}
  return true;
 }catch{return false}
}
export function PodExchange(){
 const [now,setNow]=useState<number|null>(null);
 const [marketFeed,setMarketFeed]=useState<MarketFeed|null>(null);
 const [marketWarning,setMarketWarning]=useState("");
 const [performance,setPerformance]=useState<{available:boolean;realized?:number;unrealized?:number;holdingsValue?:number;investedCost?:number;reason?:string;cycle?:number}|null>(null);
 const [portfolio,setPortfolio]=useState<Portfolio>(defaultPortfolio);
 const [ready,setReady]=useState(false);
 const [storageMode,setStorageMode]=useState<StorageMode>("loading");
 const [storageMessage,setStorageMessage]=useState("");
 const [pending,setPending]=useState(false);
 const modeRef=useRef<StorageMode>("loading");
 const tradingRef=useRef(false);
 const [symbol,setSymbol]=useState("DUCK");
 const [side,setSide]=useState<"buy"|"sell">("buy");
 const [quantity,setQuantity]=useState("1");
 const [message,setMessage]=useState("");
 const [view,setView]=useState<"market"|"wallet">("market");
 const [chartRange,setChartRange]=useState<ChartRange>("30m");
 const [rulesOpen,setRulesOpen]=useState(false);
 const rulesTrigger=useRef<HTMLButtonElement>(null);
 const closeRules=()=>{setRulesOpen(false);requestAnimationFrame(()=>rulesTrigger.current?.focus());};
 const tradeRef=useRef<HTMLElement|null>(null);
 const applyMode=(mode:StorageMode)=>{modeRef.current=mode;setStorageMode(mode)};
 useEffect(()=>{
  let live=true;
  const update=(next:Portfolio)=>{if(!live)return;setPortfolio(next);};
  const syncFromServer=async()=>{
   if(tradingRef.current)return;
   try{
    const response=await fetch("/api/fun-zone/pod-exchange",{cache:"no-store"});
    if(response.ok){
     const state=await response.json() as CloudState;
     if(!state.exists||!state.portfolio||!state.userId)return;
     update(sanitizePortfolio(state.portfolio));
     if(state.userId){saveLocalSnapshot(state.portfolio);localStorage.setItem(OWNER_KEY,state.userId)}
    }
   }catch{/* Never overwrite the currently loaded wallet on a failed refresh. */}
  };
  const load=async()=>{
   try{
    const response=await fetch("/api/fun-zone/pod-exchange",{cache:"no-store"});
    if(!live)return;
    if(response.status===401){
     // Guests retain the old local-only beta experience without account sync.
     const saved=decodeSavedPortfolio(localStorage.getItem(guestStorageKey()));
     if(saved.isNew && !saveLocalSnapshot(saved.portfolio,guestStorageKey()))throw new Error("Local storage is blocked, so trading cannot be saved safely.");
     update(saved.portfolio);applyMode("local");setStorageMessage("Saved on this device · Sign in for cloud sync");
    }else if(response.ok){
     let state=await response.json() as CloudState;
     if(!state.userId)throw new Error("Account identity could not be verified. No wallet was changed.");
     if(!state.exists){
      const saved=localWalletForAccount(state.userId);
      const initialize=await fetch("/api/fun-zone/pod-exchange",{
       method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({action:"initialize",legacy:saved.isNew?null:saved.portfolio})
      });
      if(!initialize.ok)throw new Error((await initialize.json() as {error?:string}).error||"Unable to initialize your saved market wallet.");
      state=await initialize.json() as CloudState;
     }
     if(!state.exists||!state.portfolio)throw new Error("Your saved portfolio was not returned by the server.");
     if(!state.userId)throw new Error("Cloud wallet ownership was not confirmed.");
     update(sanitizePortfolio(state.portfolio));saveLocalSnapshot(state.portfolio);
     localStorage.setItem(OWNER_KEY,state.userId);
     applyMode("cloud");setStorageMessage("Saved to your PodScape account");
    }else{
     const data=await response.json().catch(()=>({})) as {error?:string};
     throw new Error(data.error||"Unable to check your existing portfolio.");
    }
    if(live)setReady(true);
   }catch(error){
    if(!live)return;
    applyMode("error");setReady(false);
    setStorageMessage(error instanceof Error?error.message:"Unable to verify saved Duck Bucks. No balance was reset.");
   }
  };
  void load();setNow(Date.now());
  const interval=window.setInterval(()=>setNow(Date.now()),1000);
  const refresh=()=>{if(modeRef.current==="cloud"&&document.visibilityState==="visible")void syncFromServer();};
  const onStorage=(event:StorageEvent)=>{
   if(event.key!==STORAGE_KEY&&event.key!==GUEST_KEY)return;
   if(modeRef.current==="local"&&event.key===guestStorageKey()){
    try{update(decodeSavedPortfolio(event.newValue).portfolio)}
    catch(error){setStorageMessage(error instanceof Error?error.message:"Saved wallet unavailable");setReady(false);applyMode("error")}
   }else refresh();
  };
  const onWalletEvent=()=>{if(modeRef.current==="cloud")void syncFromServer()};
  window.addEventListener("storage",onStorage);
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  window.addEventListener("podscape-exchange-wallet-updated",onWalletEvent);
  return()=>{
   live=false;window.clearInterval(interval);
   window.removeEventListener("storage",onStorage);
   window.removeEventListener("focus",refresh);
   document.removeEventListener("visibilitychange",refresh);
   window.removeEventListener("podscape-exchange-wallet-updated",onWalletEvent);
  };
 },[]);
 useEffect(()=>{
  let live=true;
  let loading=false;
  const refresh=async()=>{
   if(loading||document.visibilityState!=="visible")return;
   loading=true;
   try{
    const response=await fetch("/api/fun-zone/pod-exchange/market?range="+encodeURIComponent(chartRange),{cache:"no-store"});
    if(!response.ok)throw Error("The shared market quote is temporarily unavailable.");
    const data=await response.json() as MarketFeed;
    if(live){setMarketFeed(data);setMarketWarning("");}
   }catch{if(live)setMarketWarning("Quotes are temporarily unavailable. Trading pauses until the exchange reconnects.");}
   finally{loading=false;}
  };
  void refresh();
  const timer=window.setInterval(()=>void refresh(),10_000);
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  return()=>{live=false;window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh)};
 },[chartRange]);
 useEffect(()=>{
  if(storageMode!=="cloud"){setPerformance(null);return}
  let live=true,loading=false;
  const refresh=async()=>{
   if(loading||document.visibilityState!=="visible")return;
   loading=true;
   try{
    const response=await fetch("/api/fun-zone/pod-exchange/ledger",{cache:"no-store"});
    if(response.ok){const data=await response.json();if(live)setPerformance(data);}
    else if(live)setPerformance({available:false,reason:"Profit report temporarily unavailable"});
   }catch{if(live)setPerformance({available:false,reason:"Profit report temporarily unavailable"});}
   finally{loading=false}
  };
  void refresh();
  const timer=window.setInterval(()=>void refresh(),60_000);
  window.addEventListener("podscape-exchange-wallet-updated",refresh);
  return()=>{live=false;window.clearInterval(timer);window.removeEventListener("podscape-exchange-wallet-updated",refresh)};
 },[storageMode]);
 const cycle=arcadeCycleAt(now??0);
 const v3=marketFeed?.mode==="v3"?marketFeed:null;
 const feedFresh=marketFeed!==null&&marketWarning===""&&marketFeed.cycle===cycle;
 const quote=(key:string)=>v3?.quotes[key]??priceAt(key,cycle);
 const priorQuote=(key:string)=>v3?.previous[key]??priceAt(key,cycle-1);
 const price=quote(symbol);
 const previous=priorQuote(symbol);
 const movement=(price/previous-1)*100;
 const company=STOCKS.find(s=>s.symbol===symbol)||STOCKS[0];
 const owned=portfolio.holdings[symbol]||0;
 const count=Number(quantity);
 const validCount=/^[1-9]\d{0,5}$/.test(quantity)&&Number.isSafeInteger(count);
 const subtotal=validCount?tradeSubtotal(price,count):0;
 const fee=validCount?tradeFee(subtotal):0;
 const total=validCount?tradeTotal(price,count,side):0;
 const allowed=ready&&feedFresh&&!pending&&now!==null&&validCount&&(side==="buy"?total<=portfolio.cash:count<=owned);
 const worth=totalValue(portfolio,cycle,v3?.quotes);
 const gain=money(worth-STARTING_BUCKS);
 const news=now===null?null:v3?v3.bulletin:headlineAt(cycle).story;
 const newsImpact=now===null||!news?0:v3?(quote(news.symbol)/priorQuote(news.symbol)-1):newsImpactAt(news.symbol,cycle);
 const newsAge=cycle-(now===null?cycle:v3?v3.cutoverCycle+v3.bulletin.publishedMinute:headlineAt(cycle).publishedCycle);
 const tickDuration=tickIntervalFor(cycle);
 const timeLeft=now===null?0:tickDuration-(now%tickDuration);
 const session=v3?{title:v3.major.headline,detail:v3.major.detail,featured:v3.major.symbol,endCycle:v3.cutoverCycle+(Math.floor(v3.minute/360)+1)*360}:marketSessionAt(cycle);
 
 const nextSession=v3?null:marketSessionAt(session.endCycle);
 const sessionLeft=(session.endCycle-cycle)*tickDuration-(now===null?0:now%tickDuration);
 const bulletinLeft=isArcadeCycle(cycle)?(5-((cycle-1_000_000_000)%5))*ARCADE_INTERVAL_MS-(now===null?0:now%ARCADE_INTERVAL_MS):(3-((cycle%3+3)%3))*MARKET_INTERVAL_MS-(now===null?0:now%MARKET_INTERVAL_MS);
 const eventDelta=v3?(quote(session.featured)/priorQuote(session.featured)-1)*100:sessionImpactAt(session.featured,cycle)*100;
 
 const eventCountdown=(ms:number)=>ms>0?Math.floor(ms/3600000)+"h "+Math.floor(ms%3600000/60000)+"m":"Now";
 const maxShares=side==="buy"?maxAffordableShares(price,portfolio.cash):owned;
 async function order(){
  if(!ready||pending||tradingRef.current||now===null)return;
  const tick=arcadeCycleAt(Date.now());
  if(!feedFresh||!marketFeed||marketFeed.cycle!==tick){
   setMessage("The quote just moved. Check the updated price before trading.");return;
  }
  const result=executeOrder(portfolio,symbol,side,count,tick,marketFeed.mode==="v3"?marketFeed.quotes[symbol]:undefined);
  if(!result.ok){setMessage(result.error);return}
  const trade=result.portfolio.trades[0];
  if(!trade)return;
  tradingRef.current=true;setPending(true);setMessage("");
  try{
   if(storageMode==="cloud"){
    const response=await fetch("/api/fun-zone/pod-exchange",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({action:"trade",trade})
    });
    const data=await response.json() as CloudState&{error?:string};
    if(!response.ok||!data.exists||!data.portfolio){
     setMessage(data.error||"Trade not confirmed. Your portfolio was not changed.");
     return;
    }
    setPortfolio(sanitizePortfolio(data.portfolio));
    saveLocalSnapshot(data.portfolio);
    if(data.userId)localStorage.setItem(OWNER_KEY,data.userId);
    window.dispatchEvent(new Event("podscape-exchange-wallet-updated"));
    for(const notice of data.unlocked||[])announceAchievement(notice);
   }else if(storageMode==="local"){
    if(!saveLocalSnapshot(result.portfolio,guestStorageKey())){
     setMessage("Unable to save this trade. Your previous wallet has been preserved.");
     return;
    }
    setPortfolio(result.portfolio);
    window.dispatchEvent(new Event("podscape-exchange-wallet-updated"));
   }else{
    setMessage("Wallet is not connected. Try reloading your portfolio.");return;
   }
   setNow(Date.now());
   setMessage(`${side==="buy"?"Bought":"Sold"} ${count} ${symbol} share${count===1?"":"s"} at ${duckBucksNumber(trade.unitPrice)} each. Trading fee included.`);
  }catch{setMessage("Connection failed. Trade status is uncertain; reload your saved wallet before placing another order.");setReady(false)}
  finally{tradingRef.current=false;setPending(false)}
 }
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.header}>
   <div><p className={styles.eyebrow}><Link href="/fun-zone">Fun Zone</Link> / MARKET PARODY <span className={styles.beta}>BETA</span></p><h1>The Pod Exchange</h1><p>A little market. A lot of leaf drama.</p></div>
   <div className={styles.marketStatus}><span><i aria-hidden="true"/> MARKET OPEN</span><small>{now===null?"Loading market…":`Next tick ${countdown(timeLeft)}`}</small></div>
  </header>

  {marketWarning?<div className={styles.walletAlert} role="alert">{marketWarning}</div>:null}
  {storageMode==="error"?<div className={styles.walletAlert} role="alert"><div><strong>Saved wallet unavailable</strong><p>{storageMessage} Your existing Duck Bucks and shares have not been reset.</p></div><button type="button" onClick={()=>window.location.reload()}>Retry loading</button></div>:null}
  <section className={styles.balances} aria-label="Duck Bucks portfolio">
   <div><span>Portfolio value</span><strong>{ready&&now!==null?<DuckBucks amount={worth}/>:"Loading…"}</strong><small className={gain>=0?styles.up:styles.down}>{ready&&now!==null?<><DuckBucks amount={gain} showSign/> overall</>:"Saved on this device"}</small></div>
   <div><span>Duck Bucks available</span><strong>{ready?<DuckBucks amount={portfolio.cash}/>:"—"}</strong><small>Virtual currency only</small></div>
   <div><span>Companies owned</span><strong>{STOCKS.filter(s=>(portfolio.holdings[s.symbol]||0)>0).length}</strong><small>{portfolio.trades.length} recent trades</small></div>
  </section>
    <section className={styles.companyCarousel} aria-label="Swipe through market companies">
   <div className={styles.carouselTop}><span className={styles.carouselKicker}>THE TRADING FLOOR · LIVE QUOTES</span><span>Swipe to explore <span aria-hidden="true">→</span></span></div>
   <div className={styles.carouselRail}>
    {STOCKS.map(stock=>{
     const current=quote(stock.symbol),before=priorQuote(stock.symbol);
     const delta=(current/before-1)*100;
     const status=delta>3?"LEAF FRENZY":delta>1?"RALLYING":delta< -3?"PANIC SELLING":delta< -1?"DIPPING":"HOLDING STEADY";
     return <button type="button" key={stock.symbol} className={styles.carouselStock} aria-pressed={symbol===stock.symbol}
      onClick={()=>{setSymbol(stock.symbol);setView("market");setMessage("");requestAnimationFrame(()=>tradeRef.current?.scrollIntoView({behavior:"smooth",block:"center"}));}}>
      <span className={styles.carouselCompany}><span className={styles.carouselIcon}><CompanyMark symbol={stock.symbol}/></span><span><strong>{stock.name}</strong><small>{stock.symbol} · {stock.sector}</small></span></span>
      <span className={styles.carouselQuote}><strong><DuckBucks amount={current}/></strong><small className={delta>=0?styles.up:styles.down}>{change(delta)}</small></span>
      <Sparkline symbol={stock.symbol} cycle={cycle} range={chartRange} series={v3?.history[stock.symbol]?.map(point=>point.price)}/>
      <span className={styles.carouselBottom}><span>{status}</span><b>TRADE <span aria-hidden="true">→</span></b></span>
     </button>;
    })}
   </div>
  </section>
  <section className={styles.marketAgenda} aria-label="Market events">
   <div className={styles.agendaNow}>
    <div className={styles.agendaHeader}><small>MARKET MAYHEM · ACTIVE EVENT</small><span>Next story {countdown(bulletinLeft)}</span></div>
    <strong>{session.title}</strong>
    <p>{session.detail}</p>
    <div className={styles.agendaFoot}><span><b>{session.featured}</b> · {eventDelta>=0?"+":""}{eventDelta.toFixed(1)}% {v3?"this tick":"pressure"}</span><span>{eventCountdown(sessionLeft)} left{nextSession?" · Next: "+nextSession.title:" · Next story not yet released"}</span></div>
   </div>
  </section>
  <section className={styles.bulletin} aria-label="Market news"><span className={styles.newsLabel}>THE LEAF STREET JOURNAL</span><div><strong>{news?.headline||"Market bulletin loading…"}</strong><p>{news?.detail||"The next tiny market story is being prepared."}</p><small className={styles.newsEffect}>{news?`${news.symbol} · ${newsImpact>=0?"+":""}${(newsImpact*100).toFixed(1)}% ${v3?"market move":"news influence"} · ${newsAge===0?"Breaking":newsAge<=2?"Heating up":"Fading"}`:"New headline every 5 minutes"}</small></div><b style={{display:"inline-flex",alignItems:"center",gap:7}}>{news?<CompanyMark symbol={news.symbol}/>:null}{news?.symbol||"PODX"}</b></section>
  {v3?.rumour?<section className={styles.marketAgenda} aria-label="The Rumour Mill"><div className={styles.agendaNow}><div className={styles.agendaHeader}><small>THE RUMOUR MILL · UNVERIFIED</small><span>Market gossip</span></div><strong>{v3.rumour.headline}</strong><p>{v3.rumour.detail}</p></div></section>:null}
  {v3?.rumourResolution?<section className={styles.marketAgenda} aria-label="Rumour resolution"><div className={styles.agendaNow}><div className={styles.agendaHeader}><small>RUMOUR RESOLVED</small><span>{v3.rumourResolution.resolution}</span></div><strong>{v3.rumourResolution.confirmedSymbol} · {v3.rumourResolution.publishedHeadline}</strong></div></section>:null}
  <div className={styles.mobileSwitch}><button type="button" aria-pressed={view==="market"} onClick={()=>setView("market")}>Trade market</button><button type="button" aria-pressed={view==="wallet"} onClick={()=>setView("wallet")}>My holdings</button></div>
  <div className={`${styles.columns} ${view==="wallet"?styles.marketHiddenMobile:""}`}>
   <section aria-label="Fictional market listings">
    <div className={styles.panel}><div className={styles.panelHead}><div><h2>Market watch</h2><p>Six companies. Endless leaf drama.</p></div><small>1-minute ticks</small></div>
     <div className={styles.list}>{STOCKS.map(stock=>{
      const current=quote(stock.symbol),prior=priorQuote(stock.symbol),delta=(current/prior-1)*100;
      return <button type="button" key={stock.symbol} aria-pressed={symbol===stock.symbol} className={styles.stock} onClick={()=>{setSymbol(stock.symbol);setMessage("");setView("market");if(window.matchMedia("(max-width:720px)").matches)requestAnimationFrame(()=>tradeRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));}}>
       <span className={styles.stockIcon} aria-hidden="true"><CompanyMark symbol={stock.symbol}/></span><span className={styles.stockName}><strong>{stock.name}</strong><small>{stock.symbol} · {stock.sector}</small></span>
       <span className={styles.stockPrice}><strong><DuckBucks amount={current}/></strong><small className={delta>=0?styles.up:styles.down}>{change(delta)}</small></span>
      </button>;
     })}</div>
    </div>
   </section>
   <section ref={tradeRef} className={styles.tradeSection} aria-label="Trading desk">
    <div className={styles.panel}><div className={styles.tradeHeading}><span aria-hidden="true"><CompanyMark symbol={company.symbol}/></span><div><small>{company.symbol} / {company.sector}</small><h2>{company.name}</h2><p>{company.summary}</p></div></div>
     <div className={styles.quote}><strong><DuckBucks amount={price}/></strong><span className={movement>=0?styles.up:styles.down}>{change(movement)} this tick</span></div>
     <Sparkline cycle={cycle} symbol={symbol} range={chartRange} series={v3?.history[symbol]?.map(point=>point.price)}/>
     <div className={styles.chartToolbar}><p className={styles.chartHint}>Shared market history · Past {chartRange}</p>
      <div role="group" aria-label="Price chart range">{(["10m","30m","1h","24h"] as const).map(range=><button type="button" key={range} aria-pressed={chartRange===range} onClick={()=>setChartRange(range)}>{range}</button>)}</div>
     </div>
     <div className={styles.sideSwitch}><button type="button" aria-pressed={side==="buy"} onClick={()=>{setSide("buy");setMessage("");}}>Buy</button><button type="button" aria-pressed={side==="sell"} onClick={()=>{setSide("sell");setMessage("");}}>Sell</button></div>
     <label className={styles.quantity}>Number of shares<input type="number" inputMode="numeric" min={1} max={999999} step={1} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
     <div className={styles.quickTrade}><div className={styles.quickSizes}>{[1,5,10].map(q=><button type="button" key={q} aria-pressed={quantity===String(q)} disabled={!ready||maxShares<q} onClick={()=>setQuantity(String(q))}>{q}</button>)}</div><button type="button" disabled={!ready||maxShares<1} onClick={()=>setQuantity(String(Math.min(999999,maxShares)))}>{side==="buy"?"MAX":"ALL"}</button></div>
     <div className={styles.orderDetails}><span>You own {owned}</span><span>Trade fee (0.5%) {validCount?<DuckBucks amount={fee}/>:"—"}</span><strong>{side==="buy"?"Pay":"Receive"} {validCount?<DuckBucks amount={total}/>:"—"}</strong></div>
     <button className={styles.action} disabled={!allowed} onClick={order} type="button">{pending?"Saving trade…":!feedFresh?"Syncing market…":side==="buy"?"Buy":"Sell"} {company.symbol} shares</button>
     {message?<p className={styles.message} role="status">{message}</p>:null}

    </div>
   </section>
  </div>
  <section className={`${styles.portfolio} ${view==="market"?styles.holdingsHiddenMobile:""}`} aria-label="Your fictional holdings">
   <div className={styles.panelHead}><div><h2>My duck portfolio</h2><p>{storageMessage||"Loading your saved portfolio…"}</p></div></div>
   {STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).length===0?
   <div className={styles.empty}><DuckBuckIcon size={22}/> Your duck wallet is full, but you don&apos;t own any shares yet. Select a company and make your first trade!</div>:
   <div className={styles.holdings}>{STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).map(stock=><div key={stock.symbol}><span className={styles.holdingIdentity}><span className={styles.holdingIcon}><CompanyMark symbol={stock.symbol}/></span><strong>{stock.symbol}</strong> <small>× {portfolio.holdings[stock.symbol]}</small></span><strong><DuckBucks amount={(portfolio.holdings[stock.symbol]||0)*priceAt(stock.symbol,cycle)}/></strong></div>)}</div>}
   {storageMode==="cloud"&&performance?.available?<div className={styles.performance} aria-label="Verified market profit and loss">
    <div><small>Realized profit / loss</small><strong className={(performance.realized||0)>=0?styles.up:styles.down}><DuckBucks amount={performance.realized||0} showSign/></strong></div>
    <div><small>Unrealized profit / loss</small><strong className={(performance.unrealized||0)>=0?styles.up:styles.down}><DuckBucks amount={performance.unrealized||0} showSign/></strong></div>
    <div><small>Current invested value</small><strong><DuckBucks amount={performance.holdingsValue||0}/></strong></div>
    <p>Full-history FIFO accounting, including trading fees. Unrealized value excludes a future sale fee.</p>
   </div>:storageMode==="cloud"&&performance?.reason?<p className={styles.performanceUnavailable}>{performance.reason}</p>:null}
   {portfolio.trades.length>0?<details className={styles.history}><summary>Recent trades ({portfolio.trades.length})</summary>{portfolio.trades.slice(0,10).map(trade=><p key={trade.id}>{trade.side==="buy"?"Bought":"Sold"} {trade.shares} {trade.symbol} · <DuckBucks amount={trade.unitPrice}/> each</p>)}</details>:null}
  </section>
  <Link href="/fun-zone/pod-exchange/rankings" className={styles.marketLeadersLink}>
   <span className={styles.marketLeadersIcon}><PodscapeLineIcon name="trophy"/></span>
   <span><strong>Market Rankings</strong><small>Rich List · Top Investors · Market Movers</small></span>
   <span className={styles.marketLeadersArrow} aria-hidden="true">→</span>
  </Link>
  <div className={styles.rulesDock} aria-label="Market help">
   <button ref={rulesTrigger} type="button" className={styles.rulesShortcut}
    onClick={()=>setRulesOpen(true)}><PodscapeLineIcon name="book"/> How to Play <span aria-hidden="true">→</span></button>
  </div>
  {rulesOpen?createPortal(<PodscapeInfoDialog eyebrow="POD EXCHANGE · FIELD GUIDE" icon="gamepad" title="How to Play" description="A fictional, fast-paced parody stock market. No real money, prizes or purchases." onClose={closeRules}>
   <div className={styles.gameRules}>
    <div><strong>1. Start trading</strong><p>Every keeper begins with 10,000 Duck Bucks. Buy whole shares in any of the six companies.</p></div>
    <div><strong>2. Watch the chaos</strong><p>Prices change every minute. The Leaf Street Journal creates a new headline every five minutes, with bigger six-hour market events.</p></div>
    <div><strong>3. Buy low, sell high</strong><p>Choose 1, 5, 10 or MAX shares. Sell anything you own. Every trade has a 0.5% fee; no waiting or stamina.</p></div>
    <div><strong>4. Climb the rankings</strong><p>Your portfolio is your cash plus the current value of owned shares. Cloud wallets sync to your account; guest wallets stay on this device.</p></div>
   </div>
  </PodscapeInfoDialog>,document.body):null}
  <footer className={styles.footer}><DuckBuckIcon size={15}/> Fictional currency only · No real money or prizes. Signed-in wallets sync to PodScape; guest wallets stay on this device. <Link href="/fun-zone">Fun Zone →</Link></footer>
 </div></main>;
}

"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {announceAchievement,type AchievementNotice} from "@/components/AchievementToast";
import Link from "next/link";
import styles from "./exchange.module.css";
import {DuckBucks,DuckBuckIcon,duckBucksNumber} from "@/components/DuckBucks";
import {ExchangeCompanyIcon} from "@/components/ExchangeCompanyIcon";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {achievementCatalog} from "@/data/achievement-catalog";
import {STOCKS,STORAGE_KEY,MARKET_INTERVAL_MS,MARKET_V2_START_CYCLE,STARTING_BUCKS,cycleAt,marketSessionAt,sessionImpactAt,defaultPortfolio,decodeSavedPortfolio,executeOrder,money,headlineAt,newsImpactAt,priceAt,tradeFee,tradeSubtotal,tradeTotal,maxAffordableShares,sanitizePortfolio,totalValue,type Portfolio} from "@/lib/pod-exchange";

function CompanyMark({symbol}:{symbol:string}){return <ExchangeCompanyIcon symbol={symbol}/>;}
const change=(n:number)=>(n>=0?"+":"")+n.toFixed(2)+"%";
const countdown=(ms:number)=>String(Math.floor(ms/60000)).padStart(2,"0")+":"+String(Math.floor((ms%60000)/1000)).padStart(2,"0");
function Sparkline({symbol,cycle,hours}:{symbol:string;cycle:number;hours:2|24}){
 const spacing=hours===24?12:1;
 const prices=useMemo(()=>Array.from({length:25},(_,i)=>priceAt(symbol,cycle-(24-i)*spacing)),[symbol,cycle,spacing]);
 const low=Math.min(...prices)*.985,high=Math.max(...prices)*1.015;
 const path=prices.map((p,i)=>`${Math.round(i*300/24)},${Math.round(79-68*(p-low)/(high-low))}`).join(" ");
 const rising=prices[24]>=prices[0];
 return <svg className={styles.chart} viewBox="0 0 300 88" preserveAspectRatio="none" role="img" aria-label={`${symbol} price movement over the last two hours, ${rising?"up":"down"}`}><line x1="0" x2="300" y1="79" y2="79" stroke="currentColor" strokeOpacity=".17"/><polyline points={path} fill="none" stroke={rising?"var(--game-correct)":"var(--game-incorrect)"} strokeWidth="2.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg>;
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
 const [chartHours,setChartHours]=useState<2|24>(24);
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
 const cycle=cycleAt(now??0);
 const price=priceAt(symbol,cycle);
 const previous=priceAt(symbol,cycle-1);
 const movement=(price/previous-1)*100;
 const company=STOCKS.find(s=>s.symbol===symbol)||STOCKS[0];
 const owned=portfolio.holdings[symbol]||0;
 const count=Number(quantity);
 const validCount=/^[1-9]\d{0,5}$/.test(quantity)&&Number.isSafeInteger(count);
 const subtotal=validCount?tradeSubtotal(price,count):0;
 const fee=validCount?tradeFee(subtotal):0;
 const total=validCount?tradeTotal(price,count,side):0;
 const allowed=ready&&!pending&&now!==null&&validCount&&(side==="buy"?total<=portfolio.cash:count<=owned);
 const worth=totalValue(portfolio,cycle);
 const gain=money(worth-STARTING_BUCKS);
 const news=now===null?null:headlineAt(cycle).story;
 const newsImpact=now===null||!news?0:newsImpactAt(news.symbol,cycle);
 const newsAge=cycle-(now===null?cycle:headlineAt(cycle).publishedCycle);
 const timeLeft=now===null?0:MARKET_INTERVAL_MS-(now%MARKET_INTERVAL_MS);
 const session=marketSessionAt(cycle);
 const sessionLive=cycle>=MARKET_V2_START_CYCLE;
 const nextSession=marketSessionAt(session.endCycle);
 const sessionLeft=(session.endCycle-cycle)*MARKET_INTERVAL_MS-(now===null?0:now%MARKET_INTERVAL_MS);
 const bulletinLeft=(3-((cycle%3+3)%3))*MARKET_INTERVAL_MS-(now===null?0:now%MARKET_INTERVAL_MS);
 const eventDelta=sessionLive?sessionImpactAt(session.featured,cycle)*100:0;
 const nextMarketEvent=MARKET_V2_START_CYCLE*MARKET_INTERVAL_MS-(now??0);
 const eventCountdown=(ms:number)=>ms>0?Math.floor(ms/3600000)+"h "+Math.floor(ms%3600000/60000)+"m":"Now";
 const maxShares=side==="buy"?maxAffordableShares(price,portfolio.cash):owned;
 async function order(){
  if(!ready||pending||tradingRef.current||now===null)return;
  const tick=cycleAt(Date.now());
  const result=executeOrder(portfolio,symbol,side,count,tick);
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
  <p className={styles.disclaimer}><PodscapeLineIcon name="gamepad"/> Fictional trading · No real money or prizes.</p>
  {storageMode==="error"?<div className={styles.walletAlert} role="alert"><div><strong>Saved wallet unavailable</strong><p>{storageMessage} Your existing Duck Bucks and shares have not been reset.</p></div><button type="button" onClick={()=>window.location.reload()}>Retry loading</button></div>:null}
  <section className={styles.balances} aria-label="Duck Bucks portfolio">
   <div><span>Portfolio value</span><strong>{ready&&now!==null?<DuckBucks amount={worth}/>:"Loading…"}</strong><small className={gain>=0?styles.up:styles.down}>{ready&&now!==null?<><DuckBucks amount={gain} showSign/> overall</>:"Saved on this device"}</small></div>
   <div><span>Duck Bucks available</span><strong>{ready?<DuckBucks amount={portfolio.cash}/>:"—"}</strong><small>Virtual currency only</small></div>
   <div><span>Companies owned</span><strong>{STOCKS.filter(s=>(portfolio.holdings[s.symbol]||0)>0).length}</strong><small>{portfolio.trades.length} recent trades</small></div>
  </section>
  <section className={styles.marketAgenda} aria-label="Market events">
   <div className={styles.agendaNow}>
    <small>MARKET CATALYST · SIX-HOUR EVENT</small>
    <strong>{sessionLive?session.title:"Market 2.0 is approaching"}</strong>
    <p>{sessionLive?session.detail:"A livelier market with timed company shocks, stronger news and more to watch throughout the day."}</p>
    <span>{sessionLive?<><b>{session.featured}</b> · {eventDelta>=0?"+":""}{eventDelta.toFixed(1)}% current pressure · {eventCountdown(sessionLeft)} remaining</>:<>Starts Nov 20, 00:00 UTC · {eventCountdown(nextMarketEvent)} to launch</>}</span>
   </div>
   <div className={styles.agendaNext}>
    <small>UP NEXT</small>
    <strong>{sessionLive?nextSession.title:"Six-hour market events"}</strong>
    <p>{sessionLive?<>In {eventCountdown(sessionLeft)} · {nextSession.featured} in focus</>:"Every day, four distinct market sessions."}</p>
    <small>Next headline in {countdown(bulletinLeft)}</small>
   </div>
  </section>
  <section className={styles.bulletin} aria-label="Market news"><span className={styles.newsLabel}>THE LEAF STREET JOURNAL</span><div><strong>{news?.headline||"Market bulletin loading…"}</strong><p>{news?.detail||"The next tiny market story is being prepared."}</p><small className={styles.newsEffect}>{news?`${news.symbol} · ${newsImpact>=0?"+":""}${(newsImpact*100).toFixed(1)}% news influence · ${newsAge===0?"Breaking":newsAge===1?"Cooling":"Fading"}`:"New headlines every 15 minutes"}</small></div><b style={{display:"inline-flex",alignItems:"center",gap:7}}>{news?<CompanyMark symbol={news.symbol}/>:null}{news?.symbol||"PODX"}</b></section>
  <div className={styles.mobileSwitch}><button type="button" aria-pressed={view==="market"} onClick={()=>setView("market")}>Trade market</button><button type="button" aria-pressed={view==="wallet"} onClick={()=>setView("wallet")}>My holdings</button></div>
  <div className={`${styles.columns} ${view==="wallet"?styles.marketHiddenMobile:""}`}>
   <section aria-label="Fictional market listings">
    <div className={styles.panel}><div className={styles.panelHead}><div><h2>Market watch</h2><p>Six companies. Endless leaf drama.</p></div><small>5-minute ticks</small></div>
     <div className={styles.list}>{STOCKS.map(stock=>{
      const current=priceAt(stock.symbol,cycle),prior=priceAt(stock.symbol,cycle-1),delta=(current/prior-1)*100;
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
     <Sparkline cycle={cycle} symbol={symbol} hours={chartHours}/>
     <div className={styles.chartToolbar}><p className={styles.chartHint}>Simulated prices · Past {chartHours} hours</p>
      <div role="group" aria-label="Price chart range"><button type="button" aria-pressed={chartHours===2} onClick={()=>setChartHours(2)}>2h</button><button type="button" aria-pressed={chartHours===24} onClick={()=>setChartHours(24)}>24h</button></div>
     </div>
     <div className={styles.sideSwitch}><button type="button" aria-pressed={side==="buy"} onClick={()=>{setSide("buy");setMessage("");}}>Buy</button><button type="button" aria-pressed={side==="sell"} onClick={()=>{setSide("sell");setMessage("");}}>Sell</button></div>
     <label className={styles.quantity}>Number of shares<input type="number" inputMode="numeric" min={1} max={999999} step={1} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
     <div className={styles.quickTrade}><button type="button" disabled={!ready||maxShares<1} onClick={()=>setQuantity(String(Math.min(999999,maxShares)))}>{side==="buy"?"Max affordable":"Sell all"}</button><span>Quick fill · no trade until you confirm</span></div>
     <div className={styles.orderDetails}><span>You own {owned}</span><span>Trade fee (0.5%) {validCount?<DuckBucks amount={fee}/>:"—"}</span><strong>{side==="buy"?"Pay":"Receive"} {validCount?<DuckBucks amount={total}/>:"—"}</strong></div>
     <button className={styles.action} disabled={!allowed} onClick={order} type="button">{pending?"Saving trade…":side==="buy"?"Buy":"Sell"} {company.symbol} shares</button>
     {message?<p className={styles.message} role="status">{message}</p>:null}

    </div>
   </section>
  </div>
  <section className={`${styles.portfolio} ${view==="market"?styles.holdingsHiddenMobile:""}`} aria-label="Your fictional holdings">
   <div className={styles.panelHead}><div><h2>My duck portfolio</h2><p>{storageMessage||"Loading your saved portfolio…"}</p></div></div>
   {STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).length===0?
   <div className={styles.empty}><DuckBuckIcon size={22}/> Your duck wallet is full, but you don&apos;t own any shares yet. Select a company and make your first trade!</div>:
   <div className={styles.holdings}>{STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).map(stock=><div key={stock.symbol}><span className={styles.holdingIdentity}><span className={styles.holdingIcon}><CompanyMark symbol={stock.symbol}/></span><strong>{stock.symbol}</strong> <small>× {portfolio.holdings[stock.symbol]}</small></span><strong><DuckBucks amount={(portfolio.holdings[stock.symbol]||0)*priceAt(stock.symbol,cycle)}/></strong></div>)}</div>}
   {portfolio.trades.length>0?<details className={styles.history}><summary>Recent trades ({portfolio.trades.length})</summary>{portfolio.trades.slice(0,10).map(trade=><p key={trade.id}>{trade.side==="buy"?"Bought":"Sold"} {trade.shares} {trade.symbol} · <DuckBucks amount={trade.unitPrice}/> each</p>)}</details>:null}
  </section>
  <Link href="/fun-zone/pod-exchange/rankings" className={styles.marketLeadersLink}>
   <span className={styles.marketLeadersIcon}><PodscapeLineIcon name="trophy"/></span>
   <span><strong>Market Rankings</strong><small>Rich List · Top Investors · Market Movers</small></span>
   <span className={styles.marketLeadersArrow} aria-hidden="true">→</span>
  </Link>
  <div className={styles.rulesDock} aria-label="Market help and achievements">  <details className={styles.rules} id="exchange-rules">
   <summary><span><PodscapeLineIcon name="book"/> How to Play</span><span className={styles.rulesHint}>The basics <span aria-hidden="true">⌄</span></span></summary>
   <div className={styles.rulesBody}>
    <p><strong>Start with 10,000 Duck Bucks.</strong> They&apos;re fictional game currency, not Pod Coins.</p>
    <p><strong>Buy shares</strong> in any of the six companies. You can sell shares you own whenever you like.</p>
    <p><strong>Prices change every five minutes</strong> based on market moods, news and six-hour catalysts after the market update.</p>
    <p><strong>Grow your portfolio</strong> by trading wisely. Its value is your remaining Duck Bucks plus the current value of your shares.</p>
    <small>Beta rules: whole shares only, 0.5% fee per buy or sell. No real money or prizes. Signed-in wallets sync to your account.</small>
   </div>
  </details>
  <details className={styles.achievementGuide}>
   <summary><span><PodscapeLineIcon name="trophy"/> Trading Achievements</span><span>5 to discover <span aria-hidden="true">⌄</span></span></summary>
   <div className={styles.achievementGoals}>
    {achievementCatalog.filter(item=>["exchange_first_trade","exchange_first_sale","exchange_five_trades","exchange_three_companies","exchange_fifteen_trades"].includes(item.key)).map(item=><div key={item.key}>
     <span><strong>{item.title}</strong><small>{item.description}</small></span><b>+{item.exp} EXP</b>
    </div>)}
    <Link href="/account/progress">View your unlocked achievements →</Link>
   </div>
  </details>
  </div>
  <footer className={styles.footer}><DuckBuckIcon size={15}/> Duck Bucks are imaginary, non-transferable and cannot be purchased, exchanged or redeemed. The market runs continuously. Signed-in portfolios sync to PodScape; guest wallets stay on this device. <Link href="/fun-zone">Back to Fun Zone →</Link></footer>
 </div></main>;
}

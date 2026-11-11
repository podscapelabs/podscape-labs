"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import styles from "./exchange.module.css";
import {DuckBucks,DuckBuckIcon,duckBucksNumber} from "@/components/DuckBucks";
import {PodscapeLineIcon,type PodscapeIconName} from "@/components/PodscapeLineIcon";
import {STOCKS,STORAGE_KEY,MARKET_INTERVAL_MS,STARTING_BUCKS,cycleAt,defaultPortfolio,executeOrder,money,newsAt,priceAt,sanitizePortfolio,totalValue,type Portfolio} from "@/lib/pod-exchange";

const companyMarks:Record<string,PodscapeIconName>={MOO:"leaf",PANDA:"jar",BLUE:"arrow-right",TITAN:"bin",CLOWN:"creative"};
function CompanyMark({symbol}:{symbol:string}){return symbol==="DUCK"?<DuckBuckIcon size={25}/>:<PodscapeLineIcon name={companyMarks[symbol]||"gamepad"}/>;}
const change=(n:number)=>(n>=0?"+":"")+n.toFixed(2)+"%";
const countdown=(ms:number)=>String(Math.floor(ms/60000)).padStart(2,"0")+":"+String(Math.floor((ms%60000)/1000)).padStart(2,"0");
function Sparkline({symbol,cycle}:{symbol:string;cycle:number}){
 const prices=useMemo(()=>Array.from({length:25},(_,i)=>priceAt(symbol,cycle-24+i)),[symbol,cycle]);
 const low=Math.min(...prices)*.985,high=Math.max(...prices)*1.015;
 const path=prices.map((p,i)=>`${Math.round(i*300/24)},${Math.round(79-68*(p-low)/(high-low))}`).join(" ");
 const rising=prices[24]>=prices[0];
 return <svg className={styles.chart} viewBox="0 0 300 88" preserveAspectRatio="none" role="img" aria-label={`${symbol} price movement over the last two hours, ${rising?"up":"down"}`}><line x1="0" x2="300" y1="79" y2="79" stroke="currentColor" strokeOpacity=".17"/><polyline points={path} fill="none" stroke={rising?"var(--game-correct)":"var(--game-incorrect)"} strokeWidth="2.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function PodExchange(){
 const [now,setNow]=useState<number|null>(null);
 const [portfolio,setPortfolio]=useState<Portfolio>(defaultPortfolio);
 const [ready,setReady]=useState(false);
 const [symbol,setSymbol]=useState("DUCK");
 const [side,setSide]=useState<"buy"|"sell">("buy");
 const [quantity,setQuantity]=useState("1");
 const [message,setMessage]=useState("");
 const [view,setView]=useState<"market"|"wallet">("market");
 const tradeRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)setPortfolio(sanitizePortfolio(JSON.parse(saved)));}catch{/* Ignore invalid local storage */}
  setReady(true);setNow(Date.now());
  const interval=window.setInterval(()=>setNow(Date.now()),1000);
  const sync=(e:StorageEvent)=>{if(e.key===STORAGE_KEY){try{setPortfolio(e.newValue?sanitizePortfolio(JSON.parse(e.newValue)):defaultPortfolio());}catch{setPortfolio(defaultPortfolio());}}};
  window.addEventListener("storage",sync);
  return()=>{window.clearInterval(interval);window.removeEventListener("storage",sync)};
 },[]);
 // Fixed pre-hydration cycle avoids server/client mismatches.
 const cycle=cycleAt(now??0);
 const price=priceAt(symbol,cycle);
 const previous=priceAt(symbol,cycle-1);
 const movement=(price/previous-1)*100;
 const company=STOCKS.find(s=>s.symbol===symbol)||STOCKS[0];
 const owned=portfolio.holdings[symbol]||0;
 const count=Number(quantity);
 const validCount=/^[1-9]\d{0,5}$/.test(quantity)&&Number.isSafeInteger(count);
 const total=validCount?money(price*count):0;
 const allowed=ready&&now!==null&&validCount&&(side==="buy"?total<=portfolio.cash:count<=owned);
 const worth=totalValue(portfolio,cycle);
 const gain=money(worth-STARTING_BUCKS);
 const news=now===null?null:newsAt(cycle);
 const timeLeft=now===null?0:MARKET_INTERVAL_MS-(now%MARKET_INTERVAL_MS);
 function order(){
  if(!ready||now===null)return;
  const tick=cycleAt(Date.now());
  const result=executeOrder(portfolio,symbol,side,count,tick);
  if(!result.ok){setMessage(result.error);return;}
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(result.portfolio));}
  catch{setMessage("Your device couldn't save this trade. Check browser storage permissions.");return;}
  setPortfolio(result.portfolio);
  setNow(Date.now());
  setMessage(`${side==="buy"?"Bought":"Sold"} ${count} ${symbol} share${count===1?"":"s"} at ${duckBucksNumber(priceAt(symbol,tick))} Duck Bucks each.`);
 }
 function reset(){
  if(!window.confirm("Reset Duck Bucks and all fictional holdings on this device?"))return;
  const fresh=defaultPortfolio();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(fresh));setPortfolio(fresh);setMessage("Fresh start! Your duck wallet is full again.");}
  catch{setMessage("Unable to reset your saved game.");}
 }
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.header}>
   <div><p className={styles.eyebrow}><Link href="/fun-zone">Fun Zone</Link> / MARKET PARODY <span className={styles.beta}>BETA</span></p><h1>The Pod Exchange</h1><p>Where tiny creatures make big moves. 📈</p></div>
   <div className={styles.marketStatus}><span><i aria-hidden="true"/> MARKET OPEN</span><small>{now===null?"Loading market…":`Next tick ${countdown(timeLeft)}`}</small></div>
  </header>
  <p className={styles.disclaimer}><span aria-hidden="true">✳</span> A fictional market game · No real money, cash-out, Pod Coins or prizes.</p>
  <section className={styles.balances} aria-label="Duck Bucks portfolio">
   <div><span>Portfolio value</span><strong>{ready&&now!==null?<DuckBucks amount={worth}/>:"Loading…"}</strong><small className={gain>=0?styles.up:styles.down}>{ready&&now!==null?<><DuckBucks amount={gain} showSign/> overall</>:"Saved on this device"}</small></div>
   <div><span>Duck Bucks available</span><strong>{ready?<DuckBucks amount={portfolio.cash}/>:"—"}</strong><small>Virtual currency only</small></div>
   <div><span>Companies owned</span><strong>{STOCKS.filter(s=>(portfolio.holdings[s.symbol]||0)>0).length}</strong><small>{portfolio.trades.length} recent trades</small></div>
  </section>
  <section className={styles.bulletin} aria-label="Market news"><span className={styles.newsLabel}>THE LEAF STREET JOURNAL</span><div><strong>{news?.headline||"The tiny markets are buzzing"}</strong><p>{news?.detail||"Traders dig through the leaf litter looking for opportunity."}</p></div><b>{news?.symbol||"PODX"}</b></section>
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
     <Sparkline cycle={cycle} symbol={symbol}/><p className={styles.chartHint}>Simulated prices · Past 2 hours</p>
     <div className={styles.sideSwitch}><button type="button" aria-pressed={side==="buy"} onClick={()=>{setSide("buy");setMessage("");}}>Buy</button><button type="button" aria-pressed={side==="sell"} onClick={()=>{setSide("sell");setMessage("");}}>Sell</button></div>
     <label className={styles.quantity}>Number of shares<input type="number" inputMode="numeric" min={1} max={999999} step={1} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
     <div className={styles.orderDetails}><span>You own {owned}</span><span>Total {validCount?<DuckBucks amount={total}/>:"—"}</span></div>
     <button className={styles.action} disabled={!allowed} onClick={order} type="button">{side==="buy"?"Buy":"Sell"} {company.symbol} shares</button>
     {message?<p className={styles.message} role="status">{message}</p>:null}
    </div>
   </section>
  </div>
  <section className={`${styles.portfolio} ${view==="market"?styles.holdingsHiddenMobile:""}`} aria-label="Your fictional holdings">
   <div className={styles.panelHead}><div><h2>My duck portfolio</h2><p>All saved locally on this device during beta.</p></div><button className={styles.reset} onClick={reset} type="button">Reset game</button></div>
   {STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).length===0?
   <div className={styles.empty}><DuckBuckIcon size={22}/> Your duck wallet is full, but you don&apos;t own any shares yet. Select a company and make your first trade!</div>:
   <div className={styles.holdings}>{STOCKS.filter(stock=>(portfolio.holdings[stock.symbol]||0)>0).map(stock=><div key={stock.symbol}><span className={styles.holdingIdentity}><span className={styles.holdingIcon}><CompanyMark symbol={stock.symbol}/></span><strong>{stock.symbol}</strong> <small>× {portfolio.holdings[stock.symbol]}</small></span><strong><DuckBucks amount={(portfolio.holdings[stock.symbol]||0)*priceAt(stock.symbol,cycle)}/></strong></div>)}</div>}
   {portfolio.trades.length>0?<details className={styles.history}><summary>Recent trades ({portfolio.trades.length})</summary>{portfolio.trades.slice(0,10).map(trade=><p key={trade.id}>{trade.side==="buy"?"Bought":"Sold"} {trade.shares} {trade.symbol} · <DuckBucks amount={trade.unitPrice}/> each</p>)}</details>:null}
  </section>
  <footer className={styles.footer}><DuckBuckIcon size={15}/> Duck Bucks are imaginary, non-transferable and cannot be purchased, exchanged or redeemed. The beta market is shared mathematically, but portfolios are stored on each player&apos;s device. <Link href="/fun-zone">Back to Fun Zone →</Link></footer>
 </div></main>;
}

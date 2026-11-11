"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./market-rankings.module.css";
type Kind="wealth"|"return"|"weekly";
type Entry={name:string;value:number;profit:number;returnPct:number;weeklyPct:number|null;position:number;mine:boolean};
type BoardSlice={rows:Entry[];mine:Entry|null;count:number};
type Data={signedIn:boolean;participating:boolean;eligible:boolean;needsWallet:boolean;legacyReviewRequired:boolean;reviewStatus:string|null;reviewerNote:string|null;cycle:number;weekStart:string;weeklyReady:boolean;wealth:BoardSlice;return:BoardSlice;weekly:BoardSlice};
const tabs:{id:Kind;title:string;description:string}[]=[
 {id:"wealth",title:"The Rich List",description:"Cash + current share value"},
 {id:"return",title:"Top Investors",description:"Return on the original 10,000 Duck Bucks"},
 {id:"weekly",title:"Market Movers",description:"Growth since the Monday UTC snapshot"}
];
const money=(n:number)=>n.toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2});
const percent=(n:number)=>(n>0?"+":"")+n.toFixed(2)+"%";
function score(entry:Entry,kind:Kind){return kind==="wealth"?money(entry.value)+" DB":percent(kind==="return"?entry.returnPct:entry.weeklyPct||0)}
export default function MarketRankings(){
 const [kind,setKind]=useState<Kind>("wealth");
 const [data,setData]=useState<Data|null>(null);
 const [loading,setLoading]=useState(true);
 const [updating,setUpdating]=useState(false);
 const [error,setError]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");
  fetch("/api/fun-zone/pod-exchange/rankings",{cache:"no-store",signal:controller.signal})
   .then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||"Market rankings unavailable");return body as Data})
   .then(body=>{if(!controller.signal.aborted)setData(body)})
   .catch(e=>{if(!controller.signal.aborted){setData(null);setError(e instanceof Error?e.message:"Market rankings unavailable")}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[reload]);
 async function join(enabled:boolean){
  if(updating)return;setUpdating(true);setError("");
  try{
   const response=await fetch("/api/fun-zone/pod-exchange/rankings",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})
   });
   const body=await response.json();if(!response.ok)throw Error(body.error||"Preference not saved");
   setReload(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Unable to update rankings")}
  finally{setUpdating(false)}
 }
 async function requestReview(){
  if(updating)return;setUpdating(true);setError("");
  try{
   const response=await fetch("/api/fun-zone/pod-exchange/rankings",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"requestReview"})
   });
   const body=await response.json();if(!response.ok)throw Error(body.error||"Could not request verification");
   setReload(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Unable to request verification")}
  finally{setUpdating(false)}
 }
 const selected=tabs.find(t=>t.id===kind)!;
 const board=data?.[kind];
 const top=board?.rows.slice(0,3)||[];
 const others=board?.rows.slice(3)||[];
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/fun-zone/pod-exchange" className={styles.back}>← Pod Exchange</Link>
  <header className={styles.hero}>
   <div><small>POD EXCHANGE / MARKET LEADERS</small><h1>Market Rankings</h1>
    <p>Three ways to rise on the fictional market. No real money, prizes or cash-out.</p></div>
   <span aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
  </header>
  {error?<div className={styles.error} role="alert">{error}<button type="button" onClick={()=>setReload(v=>v+1)}>Retry</button></div>:null}
  <section className={styles.join} aria-label="Public market ranking participation">
   <div><small>YOUR MARKET PROFILE</small><h2>{data?.participating?"You're on the board":"Join Market Rankings"}</h2>
    <p>{data?.participating?"Your display name and market scores are visible. Leave anytime.":"Your cloud wallet stays private until you choose to join."}</p></div>
   {loading?<span className={styles.status}>Checking…</span>:
    !data?.signedIn?<Link className={styles.joinButton} href="/account">Sign in to join →</Link>:
    data.needsWallet?<Link className={styles.joinButton} href="/fun-zone/pod-exchange">Start trading →</Link>:
    !data.eligible?(data.reviewStatus==="pending"?<span className={styles.status}>Review pending</span>:<button type="button" className={styles.joinButton} disabled={updating} onClick={requestReview}>{updating?"Submitting…":"Request verification"}</button>):
    <button type="button" className={data.participating?styles.leaveButton:styles.joinButton}
     disabled={updating} aria-pressed={data.participating}
     onClick={()=>join(!data.participating)}>
     {updating?"Saving…":data.participating?"Leave rankings":"Join rankings"}</button>}
   {data?.needsWallet?<p className={styles.eligibility}>Open the Exchange to create your free, cloud-saved starting wallet. You can join after it is initialized.</p>:data?.legacyReviewRequired?<p className={styles.eligibility}>Existing beta wallets require owner verification before competing. Your holdings remain safe. {data.reviewStatus==="pending"?"Your request is in the owner review queue.":data.reviewStatus==="declined"?"A previous review was declined. You may request another review.":""} {data.reviewerNote?data.reviewerNote:""}</p>:
    <p className={styles.privacy}>Independent opt-in · Display name, fictional value and returns become public · No real currency</p>}
  </section>
  <section className={styles.rankings} aria-label="Market leaderboard">
   <div className={styles.tabBar} role="group" aria-label="Ranking type">
    {tabs.map(tab=><button key={tab.id} type="button" aria-pressed={kind===tab.id}
      onClick={()=>setKind(tab.id)}>{tab.title}</button>)}
   </div>
   <div className={styles.heading}>
    <div><small>{selected.description}</small><h2>{selected.title}</h2></div>
    <span>{loading?"Updating…":(board?.count||0)+" investors"}</span>
   </div>
   {data?.participating&&board?.mine?<div className={styles.myStanding}>
    <span><strong>#{board.mine.position}</strong><small>Your position</small></span>
    <span><strong>{score(board.mine,kind)}</strong><small>{kind==="wealth"?"Portfolio value":kind==="return"?"Total return":"Weekly growth"}</small></span>
   </div>:null}
   {loading?<div className={styles.empty}>Calculating fictional portfolio values…</div>:
    kind==="weekly"&&!data?.weeklyReady?<div className={styles.empty}><PodscapeLineIcon name="calendar"/><strong>Weekly trading begins with a snapshot.</strong><p>Market Movers starts after the next Monday UTC snapshot. No retroactive or user-submitted returns count.</p></div>:
    !top.length?<div className={styles.empty}><PodscapeLineIcon name="trophy"/><strong>The podium is waiting.</strong><p>Eligible investors who opt in will appear here. Everyone starts with the same 10,000 Duck Bucks.</p></div>:
    <>
     <div className={styles.podium}>{top.map((entry,index)=><article className={styles.podiumCard} key={index}>
      <span className={styles.position}>#{entry.position}</span><span className={styles.medal}><PodscapeLineIcon name="trophy"/></span>
      <strong>{entry.name}{entry.mine?" · You":""}</strong>
      <b>{score(entry,kind)}</b>
      <small>{kind==="wealth"?percent(entry.returnPct)+" total return":money(entry.value)+" DB portfolio"}</small>
     </article>)}</div>
     {others.length?<div className={styles.list}>{others.map((entry,index)=><div key={index} className={entry.mine?styles.myRow:styles.row}>
      <strong>#{entry.position}</strong><span><b>{entry.name}{entry.mine?" · You":""}</b><small>{money(entry.value)} DB portfolio</small></span>
      <strong>{score(entry,kind)}</strong>
     </div>)}</div>:null}
    </>}
  </section>
  <div className={styles.links}><Link href="/fun-zone/pod-exchange">Trade in the Exchange</Link><Link href="/fun-zone/leaderboard">Arcade Rankings</Link><Link href="/account/progress/rankings">Lifetime EXP Rankings</Link></div>
  <details className={styles.rules}><summary><span><PodscapeLineIcon name="book"/> How market rankings work</span><PodscapeLineIcon name="arrow-down"/></summary>
   <div><p><strong>The Rich List:</strong> Duck Bucks cash plus all share holdings, repriced at the current shared five-minute market tick.</p>
    <p><strong>Top Investors:</strong> (Current portfolio value − 10,000) ÷ 10,000, expressed as a percentage. A fair starting balance matters.</p>
    <p><strong>Market Movers:</strong> Change from an immutable server-recorded Monday UTC portfolio snapshot. Snapshots are not backdated; late entrants wait for the next period.</p>
    <p>Only eligible, opted-in cloud wallets appear. Imported beta balances require verification. No portfolio resets, no purchased currency, and no real-world rewards. Percentages may be negative.</p>
   </div>
  </details>
 </div></main>;
}

"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ARCADE_GAMES} from "@/lib/fun-zone-arcade";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./leaderboard.module.css";

type Period="daily"|"weekly"|"monthly"|"all-time";
type Standing={name:string;points:number;completions:number;position:number;mine:boolean};
type Board={rows:Standing[];mine:Standing|null;participating:boolean;signedIn:boolean;timezone:string};
const periods:{id:Period;label:string}[]=[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"},{id:"all-time",label:"All time"}];
const games=ARCADE_GAMES.filter(game=>game.key!=="pod-exchange");
const format=(n:number)=>n.toLocaleString("en-CA");
export default function Leaderboard(){
 const [period,setPeriod]=useState<Period>("weekly");
 const [game,setGame]=useState("all");
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("game");if(requested&&games.some(item=>item.key===requested))setGame(requested);},[]);
 const [board,setBoard]=useState<Board|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [updating,setUpdating]=useState(false);
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");
  fetch("/api/fun-zone/rankings?period="+encodeURIComponent(period)+"&game="+encodeURIComponent(game),{signal:controller.signal,cache:"no-store"})
   .then(async response=>{const json=await response.json();if(!response.ok)throw new Error(json.error||"Rankings are unavailable");return json as Board;})
   .then(data=>{if(!controller.signal.aborted)setBoard(data);})
   .catch(e=>{if(!controller.signal.aborted){setBoard(null);setError(e instanceof Error?e.message:"Unable to load rankings");}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[period,game,reload]);
 const setPublic=async(enabled:boolean)=>{
  if(updating)return;setUpdating(true);setError("");
  try{
   const response=await fetch("/api/fun-zone/rankings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})});
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||"Could not save your preference");
   setReload(x=>x+1);
  }catch(e){setError(e instanceof Error?e.message:"Could not update your preference");}
  finally{setUpdating(false)}
 };
 const entries=board?.rows||[];
 const top=entries.slice(0,3);
 const others=entries.slice(3);
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/fun-zone" className={styles.back}><span aria-hidden="true">←</span> Fun Zone</Link>
  <header className={styles.hero}>
   <div><p className={styles.eyebrow}>PODSCAPE / FUN ZONE</p><h1>Arcade Rankings</h1><p>Big bragging rights. Tiny little victories. See who's been exploring the arcade.</p></div>
   <span className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
  </header>
  <section className={styles.controls} aria-label="Ranking filters">
   <div className={styles.controlHead}><div><small>LEADERBOARD</small><h2>Choose your standings.</h2></div><span className={styles.utc}>UTC periods</span></div>
   <div className={styles.tabs} role="group" aria-label="Ranking period">{periods.map(p=><button key={p.id} type="button" aria-pressed={period===p.id} className={period===p.id?styles.active:""} onClick={()=>setPeriod(p.id)}>{p.label}</button>)}</div>
   <label className={styles.filterLabel} htmlFor="ranking-game">Show rankings for</label>
   <select id="ranking-game" className={styles.select} value={game} onChange={e=>setGame(e.target.value)}>
    <option value="all">All ranked games</option>
    {games.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}
   </select>
   <p className={styles.helper}>{period==="daily"?"Today, starting 00:00 UTC.":period==="weekly"?"This week, starting Monday 00:00 UTC.":period==="monthly"?"This month, starting on the 1st at 00:00 UTC.":"Every verified completion since tracking began."}</p>
  </section>
  {error?<div role="alert" className={styles.alert}>{error} <button type="button" onClick={()=>setReload(x=>x+1)}>Try again</button></div>:null}
  <section className={styles.standings} aria-label="Ranking standings" aria-busy={loading}>
   <div className={styles.standingsHead}><div><small>THE SCOREBOARD</small><h2>{periods.find(x=>x.id===period)?.label} leaders</h2></div><span>{loading?"Updating…":entries.length? "Top "+Math.min(50,entries.length)+" shown":"No entries"}</span></div>
   {loading?<p className={styles.empty}>Loading verified arcade results…</p>:
    !entries.length?<div className={styles.empty}><PodscapeLineIcon name="trophy"/><h3>First place is waiting.</h3><p>No players have opted in with verified completions for this selection yet. Be the first to put your name on the board.</p><Link href="/fun-zone">Explore games →</Link></div>:
    <>
     <div className={styles.podium}>{top.map((entry,i)=><article key={entry.position+"-"+entry.name+"-"+i} className={styles.podiumCard} aria-label={"Position "+entry.position}>
      <span className={styles.place}>#{entry.position}</span><span className={styles.medal} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
      <strong>{entry.name}{entry.mine?" · You":""}</strong><b>{format(entry.points)} <small>pts</small></b><span>{entry.completions} verified {entry.completions===1?"puzzle":"puzzles"}</span>
     </article>)}</div>
     {others.length?<div className={styles.list}>{others.map((entry,i)=><div key={entry.position+"-"+entry.name+"-"+i} className={entry.mine?styles.myRow:styles.row}><span className={styles.rank}>#{entry.position}</span><div><strong>{entry.name}{entry.mine?" · You":""}</strong><small>{entry.completions} completed</small></div><b>{format(entry.points)} pts</b></div>)}</div>:null}
    </>}
  </section>
  <section className={styles.personal} aria-label="Your ranking participation">
   <div className={styles.personalTitle}><span><PodscapeLineIcon name="achievement"/></span><div><small>YOUR ARCADE</small><h2>Your standing</h2></div></div>
   {!board&&!loading?<p>Personal rankings are temporarily unavailable.</p>:!board?.signedIn?<p>Sign in to enter the public rankings. You can still explore the leaderboard without participating.</p>:
    <><div className={styles.consent}><div><strong>Show me on arcade rankings</strong><p>Optional. Your PodScape display name and verified puzzle totals become public on the leaderboard. Turn this off anytime.</p></div><button type="button" disabled={updating||loading} aria-pressed={board.participating} onClick={()=>setPublic(!board.participating)} className={board.participating?styles.optedIn:styles.optedOut}>{updating?"Saving…":board.participating?"Participating ✓":"Join rankings"}</button></div>
     {board.participating?(board.mine?<div className={styles.myStanding}><span>#{board.mine.position} this period</span><b>{format(board.mine.points)} pts</b></div>:<p>Your profile is public, but you haven't completed a ranked puzzle in this period yet.</p>):<p className={styles.helper}>Your completions are still saved privately. Rankings never affect your EXP or Duck Bucks.</p>}</>}
  </section>
  <p className={styles.note}>Ranking points = 100 per unique server-verified puzzle completion. Ties share a rank. Daily, weekly and monthly boards reset by UTC calendar periods; All time persists. Only opted-in players appear. The Pod Exchange is not ranked because simulated wealth isn't a verified puzzle score.</p>
 </div></main>;
}

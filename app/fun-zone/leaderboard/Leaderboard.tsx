"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ARCADE_GAMES} from "@/lib/fun-zone-arcade";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./leaderboard.module.css";

type Period="daily"|"weekly"|"monthly"|"all-time";
type Standing={name:string;points:number;completions:number;position:number;mine:boolean};
type Award={board:string;period:string;place:number;exp:number;date:string};
type Board={rows:Standing[];mine:Standing|null;participating:boolean;signedIn:boolean;timezone:string;awards:Award[]};
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
 const selectedGame=games.find(item=>item.key===game);
 const gameEntryGuides:Record<string,string>={
  "crossword-colony":"Finish a Crossword Colony puzzle by solving all its clues.",
  "colony-connections":"Complete every matching group in a Colony Connections puzzle.",
  "word-burrow":"Find the hidden word within six guesses and finish the puzzle.",
  "species-detective":"Finish all questions in a Species Detective challenge.",
  "keepers-challenge":"Complete all questions in a Keeper's Challenge puzzle.",
  "word-of-the-week":"Finish the vocabulary lesson's questions.",
  "species-quiz":"Complete all questions in a Species Quiz puzzle.",
  "word-search":"Find every hidden term in a Word Search puzzle."
 };
 const entryDescription=selectedGame?gameEntryGuides[selectedGame.key]||"Complete a puzzle in this game.":"Complete a verified puzzle in any eligible arcade game. Each unique puzzle contributes to the overall board.";
 const entries=board?.rows||[];
 const top=entries.slice(0,3);
 const others=entries.slice(3);
 return <main className={styles.page}><div className={styles.wrap}>
  <Link href="/fun-zone" className={styles.back}><span aria-hidden="true">←</span> Fun Zone</Link>
  <header className={styles.hero}>
   <div><p className={styles.eyebrow}>PODSCAPE / FUN ZONE</p><h1>Arcade Rankings</h1><p>Verified puzzles. Real standings. Your place in the arcade.</p></div>
   <span className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
  </header>
  {error?<div role="alert" className={styles.alert}>{error} <button type="button" onClick={()=>setReload(x=>x+1)}>Try again</button></div>:null}
  <section className={styles.personal} aria-label="Your ranking participation">
   <div className={styles.personalTitle}><span><PodscapeLineIcon name="achievement"/></span><div><small>YOUR ARCADE</small><h2>{board?.participating?"You’re on the board":"Join Arcade Rankings"}</h2></div></div>
   {!board&&!loading?<p>Personal rankings are temporarily unavailable.</p>:!board?.signedIn?<div className={styles.joinSignIn}><p>Sign in to join the leaderboard. Browsing stays open to everyone.</p><Link href="/account" className={styles.joinLink}>Sign in to join <span aria-hidden="true">→</span></Link></div>:
    <><div className={styles.consent}><div><strong>{board.participating?"Public participation is on":"Get on the leaderboard"}</strong><p>{board.participating?"Your name and verified points are currently public.":"Your saved puzzle points will appear when you join."}</p></div><button type="button" disabled={updating||loading} aria-pressed={board.participating} onClick={()=>setPublic(!board.participating)} className={board.participating?styles.optedIn:styles.optedOut} aria-label={board.participating?"Leave public arcade rankings":"Join public arcade rankings"}>{updating?"Saving…":board.participating?"Leave rankings":"Join rankings"}</button></div>
     <small className={styles.privacyHint}>{board.participating?"Participating · Visible to everyone · Leave anytime":"Private until you join · Only your display name and verified puzzle points become public"}</small>
     {board.participating?(board.mine?<div className={styles.myStanding}><span>#{board.mine.position} · {periods.find(p=>p.id===period)?.label} rank</span><b>{format(board.mine.points)} pts</b></div>:<p>Your profile is public, but you haven&apos;t completed a ranked puzzle in this period yet.</p>):<p className={styles.helper}>Your completions are still saved privately. Ranking points remain separate from EXP and Duck Bucks. Podium achievements may award EXP.</p>}</>}
  </section>
  <section className={styles.controls} aria-label="Ranking filters">
   <div className={styles.controlHead}><div><small>FILTER THE BOARD</small><h2>Standings</h2></div><span className={styles.utc}>UTC</span></div>
   <div className={styles.tabs} role="group" aria-label="Ranking period">{periods.map(p=><button key={p.id} type="button" aria-pressed={period===p.id} className={period===p.id?styles.active:""} onClick={()=>setPeriod(p.id)}>{p.label}</button>)}</div>
   <label className={styles.filterLabel} htmlFor="ranking-game">Game</label>
   <select id="ranking-game" className={styles.select} value={game} onChange={e=>setGame(e.target.value)}>
    <option value="all">All ranked games</option>
    {games.map(item=><option key={item.key} value={item.key}>{item.title}</option>)}
   </select>
   <p className={styles.helper}>{period==="daily"?"Today, starting 00:00 UTC.":period==="weekly"?"This week, starting Monday 00:00 UTC.":period==="monthly"?"This month, starting on the 1st at 00:00 UTC.":"Every verified completion since tracking began."}</p>
  </section>
  <section className={styles.standings} aria-label="Ranking standings" aria-busy={loading}>
   <div className={styles.standingsHead}><div><small>THE SCOREBOARD</small><h2>{periods.find(x=>x.id===period)?.label} leaders</h2></div><span>{loading?"Updating…":entries.length?format(entries.length)+" ranked players":"No entries"}</span></div>
   {loading?<p className={styles.empty}>Loading verified arcade results…</p>:
    !entries.length?<div className={styles.empty}><PodscapeLineIcon name="trophy"/><h3>First place is waiting.</h3><p>No players have opted in with verified completions for this selection yet. Be the first to put your name on the board.</p><Link href="/fun-zone">Explore games →</Link></div>:
    <>
     <div className={`${styles.podium} ${top.length===1?styles.soloPodium:top.length===2?styles.duoPodium:""}`}>{top.map((entry,i)=><article key={entry.position+"-"+entry.name+"-"+i} className={styles.podiumCard} aria-label={"Position "+entry.position}>
      <span className={styles.place}>#{entry.position}</span><span className={styles.medal} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
      <strong>{entry.name}{entry.mine?" · You":""}</strong><b>{format(entry.points)} <small>pts</small></b><span>{entry.completions} verified {entry.completions===1?"puzzle":"puzzles"}</span>
     </article>)}</div>
     {others.length?<div className={styles.list}>{others.map((entry,i)=><div key={entry.position+"-"+entry.name+"-"+i} className={entry.mine?styles.myRow:styles.row}><span className={styles.rank}>#{entry.position}</span><div><strong>{entry.name}{entry.mine?" · You":""}</strong><small>{entry.completions} completed</small></div><b>{format(entry.points)} pts</b></div>)}</div>:null}
    </>}
  </section>
  <div className={styles.expRankingsLink}>
    <div><strong>More than games?</strong><p>See how your lifetime EXP and keeper level compare across all of PodScape.</p></div>
    <Link href="/account/progress/rankings">Lifetime EXP Rankings <span aria-hidden="true">→</span></Link>
  </div>
  <details className={styles.entryGuide}>
   <summary className={styles.entryGuideHead}>
    <span className={styles.detailIcon} aria-hidden="true"><PodscapeLineIcon name="book"/></span>
    <span className={styles.detailCopy}><strong>How rankings work</strong><small>{selectedGame?selectedGame.title+" · ":""}One verified puzzle = 100 points</small></span>
    <span className={styles.detailChevron} aria-hidden="true"><PodscapeLineIcon name="arrow-down"/></span>
   </summary>
   <div className={styles.detailBody}>
    <h2 className={styles.visuallyHidden}>How to enter arcade rankings</h2>
   <p className={styles.entryIntro}>{entryDescription}</p>
   <ol className={styles.entrySteps}>
    <li><span>1</span><div><strong>Sign in</strong><small>Use a verified PodScape account so your completed puzzles are saved.</small></div></li>
    <li><span>2</span><div><strong>Complete a puzzle</strong><small>Finish a challenge and let PodScape verify the result. Only the first completion of each puzzle counts.</small></div></li>
    <li><span>3</span><div><strong>Join rankings</strong><small>Enable public participation under Your standing. Your display name and verified points will appear on the board.</small></div></li>
   </ol>
   <div className={styles.entryGuideFooter}>
    <span>Each puzzle counts in the period when it was first completed. Replays do not earn extra points or reset the date.</span>
    <Link href={selectedGame?.href||"/fun-zone"}>{selectedGame?"Play "+selectedGame.title:"Browse ranked games"} <span aria-hidden="true">→</span></Link>
   </div>
   </div>
  </details>
  <details className={styles.rewards}>
   <summary className={styles.rewardsTitle}>
    <span className={styles.detailIcon} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
    <span className={styles.detailCopy}><strong>Podium rewards & achievements</strong><small>Daily +50 · Weekly +200 · Monthly +500 EXP for 1st</small></span>
    <span className={styles.detailChevron} aria-hidden="true"><PodscapeLineIcon name="arrow-down"/></span>
   </summary>
   <div className={styles.detailBody}>
    <p className={styles.rewardRule}>Finish on the podium to earn bonus EXP when eligible ranking periods close.</p>
   <div className={styles.rewardTableWrap}><table className={styles.rewardTable}>
    <thead><tr><th scope="col">Board</th><th scope="col">1st</th><th scope="col">2nd</th><th scope="col">3rd</th></tr></thead>
    <tbody>
     {([{key:"daily",label:"Daily",values:[50,30,15]},
      {key:"weekly",label:"Weekly",values:[200,125,75]},
      {key:"monthly",label:"Monthly",values:[500,300,175]},
      {key:"all-time",label:"All-time milestone",values:[750,450,250]}] as const).map(row=><tr key={row.key}><th scope="row">{row.label}</th>{row.values.map((value,i)=><td key={i}>+{value} <small>EXP</small></td>)}</tr>)}
    </tbody>
   </table></div>
   <p className={styles.rewardRule}>These are overall arcade rewards. Each individual game board earns 25% of the listed EXP, with a maximum of two game-board payouts per period. All-time milestones pay only once per improvement, not at every refresh.</p>
   <div className={styles.rewardMilestones}>
    <span><PodscapeLineIcon name="achievement"/> A Place on the Podium</span>
    <span><PodscapeLineIcon name="achievement"/> Crowned for a Week</span>
    <span><PodscapeLineIcon name="achievement"/> Three-Peat <small>Hidden</small></span>
    <span><PodscapeLineIcon name="achievement"/> Arcade Legend <small>Hidden</small></span>
   </div>
   <p className={styles.rewardRule}>Rewards require at least two opted-in participants on a board, a verified first-time puzzle completion, and public ranking participation before the period closes. No Pod Coins are awarded.</p>
   <div className={styles.rewardHistory}><h3>Your recent rewards</h3>
    {!board?.signedIn?<p>Sign in to see your ranking rewards and achievements.</p>:!board.awards?.length?<p>No podium rewards yet. The next completed rankings may be your first!</p>:
     <div className={styles.rewardHistoryList}>{board.awards.map((award,i)=><div key={award.period+"-"+award.board+"-"+award.date+"-"+i}>
      <span><strong>{award.board==="all"?"Overall Arcade":games.find(g=>g.key===award.board)?.title||award.board}</strong><small>{award.period==="all-time"?"All-time milestone":award.period} · #{award.place}</small></span>
      <b>+{format(award.exp)} EXP</b>
     </div>)}</div>}
   </div>
   </div>
  </details>
  <p className={styles.note}>Ranking points = 100 per unique server-verified puzzle completion. Ties share a rank. Daily, weekly and monthly boards reset by UTC calendar periods; All time persists. Only opted-in players appear. The Pod Exchange is not ranked because simulated wealth isn&apos;t a verified puzzle score.</p>
 </div></main>;
}

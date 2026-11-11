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
  <section className={styles.entryGuide} aria-labelledby="ranking-entry-title">
   <div className={styles.entryGuideHead}>
    <div><small>HOW TO ENTER</small><h2 id="ranking-entry-title">{selectedGame?"Ranking in "+selectedGame.title:"Join the arcade rankings"}</h2></div>
    <span className={styles.entryPoints}>+100 pts / puzzle</span>
   </div>
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
  </section>
  {error?<div role="alert" className={styles.alert}>{error} <button type="button" onClick={()=>setReload(x=>x+1)}>Try again</button></div>:null}
  <section className={styles.standings} aria-label="Ranking standings" aria-busy={loading}>
   <div className={styles.standingsHead}><div><small>THE SCOREBOARD</small><h2>{periods.find(x=>x.id===period)?.label} leaders</h2></div><span>{loading?"Updating…":entries.length?format(entries.length)+" ranked players":"No entries"}</span></div>
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
     {board.participating?(board.mine?<div className={styles.myStanding}><span>#{board.mine.position} this period</span><b>{format(board.mine.points)} pts</b></div>:<p>Your profile is public, but you haven't completed a ranked puzzle in this period yet.</p>):<p className={styles.helper}>Your completions are still saved privately. Ranking points remain separate from EXP and Duck Bucks. Podium achievements may award EXP.</p>}</>}
  </section>
  <section className={styles.rewards} aria-label="Leaderboard achievements and EXP">
   <div className={styles.rewardsTitle}><span><PodscapeLineIcon name="trophy"/></span><div><small>ACHIEVEMENTS & EXP</small><h2>Podium rewards</h2><p>Finish on the podium, unlock permanent achievements and earn bonus EXP when rankings close.</p></div></div>
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
  </section>
  <p className={styles.note}>Ranking points = 100 per unique server-verified puzzle completion. Ties share a rank. Daily, weekly and monthly boards reset by UTC calendar periods; All time persists. Only opted-in players appear. The Pod Exchange is not ranked because simulated wealth isn't a verified puzzle score.</p>
 </div></main>;
}

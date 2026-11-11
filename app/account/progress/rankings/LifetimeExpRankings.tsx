"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./lifetime-rankings.module.css";
type Keeper={name:string;exp:number;level:number;position:number;mine:boolean};
type Board={rows:Keeper[];mine:Keeper|null;participating:boolean;signedIn:boolean};
const format=(n:number)=>n.toLocaleString("en-CA");
export default function LifetimeExpRankings(){
 const [board,setBoard]=useState<Board|null>(null);
 const [loading,setLoading]=useState(true);
 const [updating,setUpdating]=useState(false);
 const [error,setError]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");
  fetch("/api/progress/rankings",{cache:"no-store",signal:controller.signal})
   .then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error||"Rankings unavailable");return result as Board;})
   .then(value=>{if(!controller.signal.aborted)setBoard(value)})
   .catch(reason=>{if(!controller.signal.aborted){setBoard(null);setError(reason instanceof Error?reason.message:"Could not load rankings");}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[reload]);
 const toggleParticipation=async(enabled:boolean)=>{
  if(updating)return;
  setUpdating(true);setError("");
  try{
   const response=await fetch("/api/progress/rankings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Preference not saved");
   setReload(previous=>previous+1);
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to update your preference");}
  finally{setUpdating(false);}
 };
 const top=board?.rows.slice(0,3)||[];
 const others=board?.rows.slice(3)||[];
 return <main className={styles.page}><div className={styles.wrap}>
  <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/account/progress">← My Progress</Link><span>/</span><span>Lifetime Rankings</span></nav>
  <header className={styles.hero}>
   <div><p className={styles.eyebrow}>PODSCAPE / MY PROGRESS</p><h1>Lifetime EXP Rankings</h1><p>Every discovery, achievement and adventure adds to your keeper journey. See where you stand across PodScape.</p></div>
   <span className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
  </header>
  <div className={styles.explainer}>
   <div><span className={styles.statIcon}><PodscapeLineIcon name="achievement"/></span><div><strong>Lifetime EXP</strong><small>Ranked by total earned experience, across every eligible PodScape activity.</small></div></div>
   <div><span className={styles.statIcon}><PodscapeLineIcon name="leaf"/></span><div><strong>Keeper level</strong><small>Displayed alongside EXP using the same level system as My Progress.</small></div></div>
  </div>
  {error?<div role="alert" className={styles.alert}><span>{error}</span><button type="button" onClick={()=>setReload(v=>v+1)}>Retry</button></div>:null}
  <section className={styles.board} aria-label="Lifetime EXP standings" aria-busy={loading}>
   <div className={styles.sectionHead}><div><small>THE KEEPER BOARD</small><h2>All-time standings</h2></div><span>{loading?"Updating…":(board?.rows.length||0)+" ranked keepers"}</span></div>
   {loading?<p className={styles.empty}>Loading verified keeper progress…</p>:
    !top.length?<div className={styles.empty}><PodscapeLineIcon name="trophy"/><h3>The podium is waiting.</h3><p>When members opt in, their earned EXP and keeper levels will appear here. Nothing is added automatically.</p></div>:
    <>
     <div className={styles.podium}>{top.map((keeper,index)=><article key={index} className={styles.podiumCard}>
      <span className={styles.place}>#{keeper.position}</span>
      <span className={styles.medal}><PodscapeLineIcon name="trophy"/></span>
      <strong>{keeper.name}{keeper.mine?" · You":""}</strong>
      <span className={styles.level}>Level {format(keeper.level)}</span><b>{format(keeper.exp)} <small>EXP</small></b>
     </article>)}</div>
     {others.length?<div className={styles.list}>{others.map((keeper,index)=><div key={index} className={keeper.mine?styles.myRow:styles.row}>
      <strong className={styles.position}>#{keeper.position}</strong><div className={styles.person}><strong>{keeper.name}{keeper.mine?" · You":""}</strong><small>Level {format(keeper.level)}</small></div><b>{format(keeper.exp)} EXP</b>
     </div>)}</div>:null}
    </>}
  </section>
  <section className={styles.personal} aria-label="Your leaderboard visibility">
   <div className={styles.sectionHead}><div><small>YOUR JOURNEY</small><h2>Your standing</h2></div><PodscapeLineIcon name="achievement"/></div>
   {!board&&!loading?<p>Personal rankings are currently unavailable.</p>:
    !board?.signedIn?<p>Sign in to choose whether to appear in Lifetime EXP Rankings. The board remains viewable without joining.</p>:
    <>
     <div className={styles.consent}><div><strong>Show my progress on the leaderboard</strong><p>Optional. Your display name, keeper level and lifetime EXP are visible to other visitors. This is separate from your Fun Zone ranking preference.</p></div>
      <button type="button" disabled={updating||loading} aria-pressed={board.participating} onClick={()=>toggleParticipation(!board.participating)}>{updating?"Saving…":board.participating?"Participating ✓":"Join rankings"}</button>
     </div>
     {board.participating?(board.mine?<div className={styles.personalStanding}><span><strong>#{board.mine.position}</strong><small>Your lifetime placement</small></span><span><strong>Level {format(board.mine.level)}</strong><small>{format(board.mine.exp)} EXP</small></span></div>:<p>Your profile is public. Earn your first EXP to enter the board.</p>):<p>Your EXP and level remain saved privately even if you choose not to appear publicly.</p>}
    </>}
  </section>
  <section className={styles.future}>
   <span className={styles.futureIcon} aria-hidden="true"><PodscapeLineIcon name="leaf"/></span>
   <div><small>COMING LATER</small><h2>Molt & Prestige</h2><p>Reach new progression milestones, earn a prestige emblem and begin a new leveling journey. Lifetime EXP rankings will remain distinct from future Molt cycles; no reset is active now.</p></div>
  </section>
  <div className={styles.links}><Link href="/account/progress">View My Progress</Link><Link href="/fun-zone/leaderboard">Arcade Rankings</Link></div>
  <p className={styles.note}>Rankings use recorded lifetime EXP, not Pod Coins or spending alone. Tied totals share a rank. Only members who choose to participate are displayed. There are no extra rewards just for appearing on this leaderboard.</p>
 </div></main>;
}

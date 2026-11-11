"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {RankingModal} from "@/components/RankingModal";
import styles from "./lifetime-rankings.module.css";
type Keeper={name:string;exp:number;level:number;position:number;mine:boolean};
type Board={rows:Keeper[];mine:Keeper|null;participating:boolean;hideUsername:boolean;signedIn:boolean};
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
 const setHidden=async(hideUsername:boolean)=>{
  if(updating)return;setUpdating(true);setError("");
  try{
   const response=await fetch("/api/progress/rankings",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({hideUsername})
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Could not update username privacy");
   setReload(x=>x+1);
  }catch(error){setError(error instanceof Error?error.message:"Could not update username privacy");}
  finally{setUpdating(false)}
 };
 const top=board?.rows.slice(0,3)||[];
 const others=board?.rows.slice(3)||[];
 return <main className={styles.page}><div className={styles.wrap}>
  <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/account/progress">← My Progress</Link><span>/</span><span>Lifetime Rankings</span></nav>
  <header className={styles.hero}>
   <div><p className={styles.eyebrow}>PODSCAPE / MY PROGRESS</p><h1>Lifetime EXP Rankings</h1><p>Every discovery, achievement and adventure adds to your keeper journey. See where you stand across PodScape.</p></div>
   <span className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="trophy"/></span>
  </header>
  {error?<div role="alert" className={styles.alert}><span>{error}</span><button type="button" onClick={()=>setReload(v=>v+1)}>Retry</button></div>:null}
  <section className={styles.personal} aria-label="Your leaderboard visibility">
   <div className={styles.sectionHead}><div><small>YOUR KEEPER PROFILE</small><h2>Your lifetime standing</h2></div><PodscapeLineIcon name="achievement"/></div>
   {!board&&!loading?<p>Personal rankings are currently unavailable.</p>:
    !board?.signedIn?<div className={styles.joinSignIn}><p>Sign in to see your lifetime EXP and level ranked automatically.</p><Link href="/account" className={styles.joinLink}>Sign in <span aria-hidden="true">→</span></Link></div>:
    <>
     <div className={styles.privacyAction}><RankingModal trigger={board.hideUsername?"Username hidden · Manage":"Username visible · Manage"} title="Lifetime ranking privacy" subtle>
      <label className={styles.namePrivacy}>
      <input type="checkbox" checked={board.hideUsername===true} disabled={updating||loading}
       onChange={event=>setHidden(event.target.checked)}/>
      <span><strong>Hide my username</strong><small>{board.hideUsername?"Anonymous Keeper is shown publicly; your level and EXP remain visible.":"Show Anonymous Keeper instead of your display name on the leaderboard."}</small></span>
     </label>
     <small className={styles.privacyHint}>Your level and EXP are ranked automatically · Username privacy is optional</small>
      <p className={styles.note}>Hiding your name does not hide your EXP, keeper level or leaderboard placement.</p>
     </RankingModal></div>
     {board.mine?<div className={styles.personalStanding}><span><strong>#{board.mine.position}</strong><small>Your lifetime placement</small></span><span><strong>Level {format(board.mine.level)}</strong><small>{format(board.mine.exp)} EXP</small></span></div>:<p>Your profile is public. Earn your first EXP to enter the board.</p>}
    </>}
  </section>
  <div className={styles.helpAction}><RankingModal trigger="How lifetime rankings work" title="Keeper rankings explained">
  <div className={styles.explainer}>
   <div><span className={styles.statIcon}><PodscapeLineIcon name="achievement"/></span><div><strong>Lifetime EXP</strong><small>Ranked by total earned experience, across every eligible PodScape activity.</small></div></div>
   <div><span className={styles.statIcon}><PodscapeLineIcon name="leaf"/></span><div><strong>Keeper level</strong><small>Displayed alongside EXP using the same level system as My Progress.</small></div></div>
  </div>

  <section className={styles.future}>
   <span className={styles.futureIcon} aria-hidden="true"><PodscapeLineIcon name="leaf"/></span>
   <div><small>COMING LATER</small><h2>Molt & Prestige</h2><p>Reach new progression milestones, earn a prestige emblem and begin a new leveling journey. Lifetime EXP rankings will remain distinct from future Molt cycles; no reset is active now.</p></div>
  </section>

  <p className={styles.note}>Rankings use recorded lifetime EXP, not Pod Coins or spending alone. Tied totals share a rank. Earned EXP is ranked automatically; usernames can be anonymized. There are no extra rewards just for appearing on this leaderboard.</p>
  </RankingModal></div>
  <section className={styles.board} aria-label="Lifetime EXP standings" aria-busy={loading}>
   <div className={styles.sectionHead}><div><small>THE KEEPER BOARD</small><h2>All-time standings</h2></div><span>{loading?"Updating…":(board?.rows.length||0)+" ranked keepers"}</span></div>
   {loading?<p className={styles.empty}>Loading verified keeper progress…</p>:
    !top.length?<div className={styles.empty}><PodscapeLineIcon name="trophy"/><h3>The podium is waiting.</h3><p>As members earn EXP, their keeper levels appear automatically.</p></div>:
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
  <div className={styles.links}><Link href="/account/progress">View My Progress</Link><Link href="/fun-zone/leaderboard">Arcade Rankings</Link></div>

 </div></main>;
}

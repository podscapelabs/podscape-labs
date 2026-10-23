"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./progress.module.css";

type Achievement = {key:string;title:string;description:string;exp:number;coins:number;unlockedAt?:string|null;status:"available"|"planned"};
const quests = [
 {title:"Explore the Ledger",description:"Get to know the species in our living archive.",href:"/ledger",cta:"Explore species"},
 {title:"Read a Field Guide",description:"Learn more about thoughtful, responsible isopod care.",href:"/field-guide",cta:"Read a guide"},
 {title:"Discover the Community",description:"Meet artists and makers connected to the hobby.",href:"/creative-network",cta:"Meet creators"},
 {title:"Care for Your Colony",description:"Use Manager to keep care notes and maintenance records.",href:"/keeper",cta:"Open Manager"},
];
export default function ProgressDashboard({exp,coins,level,levelStart,levelEnd,achievements,error}:{exp:number;coins:number;level:number;levelStart:number;levelEnd:number;achievements:Achievement[];error:boolean}){
 const [filter,setFilter]=useState<"all"|"unlocked"|"locked">("all");
 const percent=Math.max(0,Math.min(100,Math.round(100*(exp-levelStart)/(levelEnd-levelStart))));
 const unlocked=achievements.filter(a=>!!a.unlockedAt);
 const shown=achievements.filter(a=>filter==="all"||(filter==="unlocked"?!!a.unlockedAt:!a.unlockedAt));
 return <main className={styles.page}><div className={styles.inner}>
  <Link className={styles.crumb} href="/account">← My Account</Link>
  <header className={styles.hero}><p className={styles.eyebrow}>PodScape Labs / Member Progress</p><h1>My Progress</h1><p>A little recognition for curiosity, learning, and responsible keeping.</p></header>
  <div className={styles.overview}>
   <section className={styles.levelCard} aria-label="Member level"><div className={styles.row}><div><span className={styles.levelLabel}>Your progression</span><h2>Level {level}</h2><p>Every discovery builds your journey.</p></div><div className={styles.ring} style={{"--pct":percent+"%"} as React.CSSProperties}><div className={styles.ringInner}>{percent}%</div></div></div><div className={styles.bar} role="progressbar" aria-label="Progress toward next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={exp}><span style={{width:percent+"%"}} /></div><div className={styles.barLabels}><span>{exp.toLocaleString("en-CA")} EXP earned</span><span>{Math.max(0,levelEnd-exp).toLocaleString("en-CA")} to Level {level+1}</span></div></section>
   <div className={styles.balance}><div className={styles.balanceCard}><small>✦ Lifetime EXP</small><strong>{exp.toLocaleString("en-CA")}</strong><span>Permanent progress</span></div><div className={styles.balanceCard}><small>◉ Pod Coins</small><strong>{coins.toLocaleString("en-CA")}</strong><span>Future platform rewards</span></div></div>
  </div>
  <section className={styles.section} aria-labelledby="achievement-title"><div className={styles.heading}><h2 id="achievement-title">Achievements</h2><p>{unlocked.length} of {achievements.filter(a=>a.status==="available").length} available unlocked</p></div>
   <div className={styles.tabs} aria-label="Filter achievements">{([["all","All"],["unlocked","Unlocked"],["locked","Not unlocked"]] as const).map(([value,label])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
   {error?<div className={styles.notice} role="status">Achievement history is temporarily unavailable. Unlocks cannot be verified right now.</div>:null}
   <div className={styles.achievementGrid}>{shown.map(a=><article className={styles.achievement} data-unlocked={Boolean(a.unlockedAt)} key={a.key}><div className={styles.emblem} aria-hidden="true">{a.unlockedAt?"✦":a.status==="planned"?"❧":"◇"}</div><div><span className={styles.tag}>{a.unlockedAt?"✓ Unlocked":a.status==="planned"?"Coming later":"Not yet unlocked"}</span><h3>{a.title}</h3><p>{a.description}</p>{a.status==="available"?<p className={styles.reward}>+{a.exp} EXP · +{a.coins} Pod Coins</p>:null}{a.unlockedAt?<p>Earned {new Date(a.unlockedAt).toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"})}</p>:a.status==="available"?<Link href="/ledger">Explore the Ledger →</Link>:null}</div></article>)}</div>{!shown.length?<p className={styles.empty}>Nothing in this view yet. Your achievements will appear here as you explore PodScape.</p>:null}
  </section>
  <section className={styles.section} aria-labelledby="quests-title"><div className={styles.heading}><h2 id="quests-title">Explore PodScape</h2><p>Ideas for your next visit</p></div><p className={styles.finePrint}>These are suggested activities, not automatically tracked quests. There are no EXP or Pod Coin awards for these links yet.</p><div className={styles.questGrid}>{quests.map(q=><article className={styles.quest} key={q.title}><small>❧ Discover & learn</small><h3>{q.title}</h3><p>{q.description}</p><Link href={q.href}>{q.cta} →</Link></article>)}</div></section>
  <p className={styles.finePrint}>EXP is permanent. Pod Coins and additional reward milestones are under development; no redemption value is currently guaranteed.</p>
 </div></main>
}

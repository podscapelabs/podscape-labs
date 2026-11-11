"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./progress.module.css";
import { PodscapeLineIcon, type PodscapeIconName } from "@/components/PodscapeLineIcon";
import { FirstActionEmptyState } from "@/components/FirstActionEmptyState";

type Achievement = {
  key: string; title: string; description: string; exp: number; coins: number; icon: string; href: string;
  unlockedAt?: string | null; status: "available" | "planned"; hidden?:boolean;
};

function achievementMark(key:string):PodscapeIconName{
 if(key.startsWith("ranking_"))return "trophy";
 if(key.startsWith("exchange_"))return "gamepad";
 if(key.startsWith("puzzle_")||key.startsWith("secret_arcade")||key.startsWith("secret_burrow"))return "challenge";
 if(key.startsWith("ledger_")||key.startsWith("collection_"))return "leaf";
 if(key.startsWith("care_"))return "manager";
 if(key.startsWith("nav_"))return "grid";
 if(key.includes("personalized")||key.startsWith("customize_"))return "edit";
 return "achievement";
}

const activities: { icon: PodscapeIconName; title: string; description: string; href: string }[] = [
  { icon: "leaf", title: "Explore the Ledger", description: "Discover new species", href: "/ledger" },
  { icon: "book", title: "Read a Guide", description: "Learn care essentials", href: "/field-guide" },
  { icon: "community", title: "Meet the Community", description: "Connect with keepers and makers", href: "/community" },
  { icon: "manager", title: "Update Your Colonies", description: "Keep your care notes", href: "/keeper" },
];

export default function ProgressDashboard({
  exp, coins, level, levelStart, levelEnd, achievements, error, discoveries, collectionSpecies, puzzleCompletions,
}: {
  exp: number; coins: number; level: number; levelStart: number; levelEnd: number;
  achievements: Achievement[]; error: boolean; discoveries: number; collectionSpecies: number; puzzleCompletions: number|null;
}) {
  const [view, setView] = useState<"achievements" | "explore" | "stats">("achievements");
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const percent = Math.max(0, Math.min(100, Math.round(100 * (exp - levelStart) / (levelEnd - levelStart))));
  const unlockedCount = achievements.filter(a => Boolean(a.unlockedAt)).length;
  const availableCount = achievements.filter(a => a.status === "available").length;
  const shown = achievements.filter(a => filter === "all" || (filter === "unlocked" ? Boolean(a.unlockedAt) : !a.unlockedAt));
  const selectedAchievement = achievements.find(a => a.key === selected);

  return <main className={styles.page}><div className={styles.inner}>
    <div className={styles.crumb}><Link href="/account">← My Account</Link></div>
    <header className={styles.hero}>
      <div className={styles.heroText}><span className={styles.eyebrow}>PodScape Labs / Member Progress</span>
        <h1>My Progress</h1><p>Explore, learn, care, and connect. Every step adds to your journey.</p></div>
      
    </header>

    <section className={styles.journey} aria-label="Your progression">
      <div className={styles.levelSeal} style={{ "--pct": percent + "%" } as CSSProperties}>
        <div className={styles.sealInside}><small>Level</small><strong>{level}</strong><span aria-hidden="true"><PodscapeLineIcon name="achievement" /></span></div>
      </div>
      <div className={styles.journeyInfo}>
        <div className={styles.journeyTop}><strong>Journey to Level {level + 1}</strong><span>{(exp - levelStart).toLocaleString("en-CA")} / {(levelEnd - levelStart).toLocaleString("en-CA")} EXP</span></div>
        <div className={styles.progressTrack} role="progressbar" aria-label="Progress toward next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={exp}><span style={{width:percent+"%"}} /></div>
        <div className={styles.currencyGrid}>
          <div><span className={styles.currencyIcon} aria-hidden="true"><PodscapeLineIcon name="achievement" /></span><div><strong>{exp.toLocaleString("en-CA")}</strong><small>Lifetime EXP</small></div></div>
          <div><span className={styles.currencyIcon} aria-hidden="true"><PodscapeLineIcon name="shop" /></span><div><strong>{coins.toLocaleString("en-CA")}</strong><small>Pod Coins</small></div></div>
        </div>
      </div>
    </section>

    <nav className={styles.sectionsNav} aria-label="Progress sections">
      {([["achievements","achievement","Achievements"],["explore","leaf","Explore"],["stats","grid","Stats"]] as const).map(([key,icon,label]) =>
        <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => setView(key)}><span aria-hidden="true"><PodscapeLineIcon name={icon} /></span>{label}</button>
      )}
    </nav>

    {view === "achievements" ? <section className={styles.achievements} aria-labelledby="achievements-title">
      <div className={styles.sectionHeading}><h2 id="achievements-title">Achievements</h2><span>{error ? "Progress unavailable" : unlockedCount + " of " + availableCount + " available unlocked"}</span></div>
      <div className={styles.filters} aria-label="Filter achievements">
        {([["all","All"],["unlocked","Unlocked"],["locked","Locked & upcoming"]] as const).map(([key,label]) =>
          <button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>
        )}
      </div>
      {error ? <p className={styles.notice} role="status">Achievement history is temporarily unavailable. Please check again later.</p> : null}
      {!error&&unlockedCount===0&&filter==="all"?<FirstActionEmptyState icon="achievement" eyebrow="YOUR FIRST MILESTONE" title="Your journey starts with one discovery." description="Explore the species catalogue, try a Fun Zone game, or finish the welcome tour. Eligible actions unlock achievements when completed—nothing is awarded just for opening this page." primary={{href:"/ledger",label:"Discover species"}} secondary={{href:"/app?onboarding=1",label:"Take the welcome tour"}} compact/>:null}
      <div className={styles.achievementGrid}>
        {shown.map(a => <button type="button" key={a.key} className={styles.achievementTile} data-earned={Boolean(a.unlockedAt)} onClick={()=>setSelected(a.key)} aria-label={(a.hidden&&!a.unlockedAt?"Secret achievement":a.title) + (a.unlockedAt ? a.hidden?", previously hidden, unlocked":", unlocked" : a.status === "planned" ? ", coming later" : ", not yet unlocked") + ". View details."}>
          <span className={styles.medallion} data-earned={Boolean(a.unlockedAt)} aria-hidden="true">
            <span className={styles.medallionRing}>{a.hidden&&!a.unlockedAt?"?":<PodscapeLineIcon name={achievementMark(a.key)}/>}</span>
            {!a.unlockedAt ? <span className={styles.lockMark}><PodscapeLineIcon name="lock" /></span> : null}
          </span>
          <span className={styles.tileCopy}><span className={styles.tileStatus}>{a.unlockedAt ? "✓ Unlocked" : a.status === "planned" ? "Coming later" : "Locked"}</span>{a.hidden&&a.unlockedAt?<span className={styles.previouslyHidden}><PodscapeLineIcon name="achievement" /> Previously Hidden</span>:null}
            <strong>{a.hidden&&!a.unlockedAt?"Secret Achievement":a.title}</strong><span className={styles.tileDescription}>{a.hidden&&!a.unlockedAt?"A little surprise for curious keepers.":a.description}</span>
            {(a.status==="available"&&(!a.hidden||Boolean(a.unlockedAt))) ? <span className={styles.tileReward}>{a.key.startsWith("ranking_")?"Podium achievement · EXP awarded per placement":`+${a.exp} EXP${a.coins ? ` · +${a.coins} Pod Coins (legacy)` : ""}`}</span> : <span className={styles.tileRewardMuted}>{a.hidden&&!a.unlockedAt?"Secret reward": "Rewards not finalized"}</span>}</span>
        </button>)}
      </div>
      {!shown.length&&!error ? <div className={styles.empty} role="status"><strong>No achievements in this view yet.</strong><p>{filter==="unlocked"?"You have not unlocked a milestone yet. Try exploring the Leaf Ledger or playing a Fun Zone game.":"Try another achievement filter to see more."}</p><button type="button" onClick={()=>setFilter("all")}>Show all achievements</button></div> : null}
      <p className={styles.caption}>Early-access achievements unlock automatically from verified species discoveries, collection entries, completed tutorials, customization milestones, and Fun Zone challenges. Each eligible milestone pays EXP once; puzzle milestones do not award Pod Coins.</p>
    </section> : null}

    {view === "explore" ? <section className={styles.explore} aria-labelledby="explore-title"><div className={styles.sectionHeading}><h2 id="explore-title">Explore PodScape</h2><span>Find something new</span></div><p className={styles.caption}>These are suggested destinations, not EXP-earning quests yet.</p><div className={styles.exploreGrid}>{activities.map(a=><Link href={a.href} className={styles.exploreTile} key={a.href}><span className={styles.exploreIcon} aria-hidden="true"><PodscapeLineIcon name={a.icon} /></span><strong>{a.title}</strong><small>{a.description}</small><span className={styles.exploreArrow} aria-hidden="true">↗</span></Link>)}</div></section> : null}

    {view === "stats" ? <section className={styles.stats} aria-labelledby="stats-title"><div className={styles.sectionHeading}><h2 id="stats-title">Your Journey</h2><span>Member overview</span></div><div className={styles.statsGrid}><div><small>Current level</small><strong>{level}</strong></div><div><small>Lifetime EXP</small><strong>{exp.toLocaleString("en-CA")}</strong></div><div><small>Pod Coins</small><strong>{coins.toLocaleString("en-CA")}</strong></div><div><small>Recorded achievements</small><strong>{error ? "—" : unlockedCount}</strong></div><div><small>Species discovered</small><strong>{discoveries}</strong></div><div><small>Species collected</small><strong>{collectionSpecies}</strong></div><div><small>Fun Zone puzzles</small><strong>{puzzleCompletions===null?"—":`${puzzleCompletions} / 32`}</strong></div></div><p className={styles.caption}>EXP is permanent. Pod Coin redemption and additional reward milestones are still being developed.</p></section> : null}

    {view === "achievements" ? <section className={styles.explore} aria-labelledby="explore-next"><div className={styles.sectionHeading}><h2 id="explore-next">Explore & Learn</h2><span>Ideas for your next visit</span></div><div className={styles.exploreGrid}>{activities.map(a=><Link href={a.href} className={styles.exploreTile} key={a.href}><span className={styles.exploreIcon} aria-hidden="true"><PodscapeLineIcon name={a.icon}/></span><strong>{a.title}</strong><small>{a.description}</small><span className={styles.exploreArrow} aria-hidden="true">↗</span></Link>)}</div><p className={styles.caption}>Suggestions only: activities here do not automatically award EXP or Pod Coins yet.</p></section> : null}
    <p className={styles.footerNote}>Your EXP stays with you. Future Pod Coin rewards and eligibility will be announced as the program develops.</p>
  </div>

  {selectedAchievement ? <div className={styles.modalBackdrop} role="presentation" onClick={()=>setSelected(null)}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="achievement-detail-title" onClick={e=>e.stopPropagation()}>
    <button type="button" className={styles.closeModal} aria-label="Close achievement details" onClick={()=>setSelected(null)}>×</button>
    <div className={styles.modalEmblem} aria-hidden="true"><PodscapeLineIcon name={selectedAchievement.unlockedAt ? "achievement" : "lock"} /></div>
    <span className={styles.tileStatus}>{selectedAchievement.unlockedAt?"✓ Unlocked":selectedAchievement.status==="planned"?"Coming later":"Not yet unlocked"}</span>{selectedAchievement.hidden&&selectedAchievement.unlockedAt?<span className={styles.previouslyHidden}><PodscapeLineIcon name="achievement" /> Previously Hidden</span>:null}
    <h2 id="achievement-detail-title">{selectedAchievement.hidden&&!selectedAchievement.unlockedAt?"Secret Achievement":selectedAchievement.title}</h2><p>{selectedAchievement.hidden&&!selectedAchievement.unlockedAt?"A secret milestone is waiting to be discovered.":selectedAchievement.description}</p>
    {selectedAchievement.status==="available"&&(!selectedAchievement.hidden||selectedAchievement.unlockedAt) ? <strong className={styles.modalReward}>{selectedAchievement.key.startsWith("ranking_")?"Permanent podium achievement · EXP rewards are paid separately":`+${selectedAchievement.exp} EXP${selectedAchievement.coins ? ` · +${selectedAchievement.coins} Pod Coins (legacy reward)` : ""}`}</strong> : <p>{selectedAchievement.hidden&&!selectedAchievement.unlockedAt?"Reward revealed when unlocked.":"Milestone and rewards are still being designed."}</p>}
    {selectedAchievement.unlockedAt ? <p>Earned {new Date(selectedAchievement.unlockedAt).toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"})}</p> : null}
    {selectedAchievement.status==="available"&&!selectedAchievement.unlockedAt&&!selectedAchievement.hidden ? <Link href={selectedAchievement.href} onClick={()=>setSelected(null)}>Keep exploring →</Link> : null}
  </div></div> : null}
  </main>;
}

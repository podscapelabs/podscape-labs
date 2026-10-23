"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./progress.module.css";

type Achievement = {
  key: string; title: string; description: string; exp: number; coins: number;
  unlockedAt?: string | null; status: "available" | "planned";
};

const activities = [
  { icon: "❧", title: "Explore the Ledger", description: "Discover new species", href: "/ledger" },
  { icon: "☷", title: "Read a Guide", description: "Learn care essentials", href: "/field-guide" },
  { icon: "✧", title: "Creative Network", description: "Meet artists and makers", href: "/creative-network" },
  { icon: "☑", title: "Update Your Colonies", description: "Keep your care notes", href: "/keeper" },
];

export default function ProgressDashboard({
  exp, coins, level, levelStart, levelEnd, achievements, error,
}: {
  exp: number; coins: number; level: number; levelStart: number; levelEnd: number;
  achievements: Achievement[]; error: boolean;
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
      <div className={styles.botanical} aria-hidden="true"><span>❧</span><span>✧</span><span>❧</span></div>
    </header>

    <section className={styles.journey} aria-label="Your progression">
      <div className={styles.levelSeal} style={{ "--pct": percent + "%" } as CSSProperties}>
        <div className={styles.sealInside}><small>Level</small><strong>{level}</strong><span aria-hidden="true">❧</span></div>
      </div>
      <div className={styles.journeyInfo}>
        <div className={styles.journeyTop}><strong>Journey to Level {level + 1}</strong><span>{(exp - levelStart).toLocaleString("en-CA")} / {(levelEnd - levelStart).toLocaleString("en-CA")} EXP</span></div>
        <div className={styles.progressTrack} role="progressbar" aria-label="Progress toward next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={exp}><span style={{width:percent+"%"}} /></div>
        <div className={styles.currencyGrid}>
          <div><span className={styles.currencyIcon} aria-hidden="true">❧</span><div><strong>{exp.toLocaleString("en-CA")}</strong><small>Lifetime EXP</small></div></div>
          <div><span className={styles.currencyIcon} aria-hidden="true">◉</span><div><strong>{coins.toLocaleString("en-CA")}</strong><small>Pod Coins</small></div></div>
        </div>
      </div>
    </section>

    <nav className={styles.sectionsNav} aria-label="Progress sections">
      {([["achievements","❧","Achievements"],["explore","◇","Explore"],["stats","▥","Stats"]] as const).map(([key,icon,label]) =>
        <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => setView(key)}><span aria-hidden="true">{icon}</span>{label}</button>
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
      <div className={styles.achievementGrid}>
        {shown.map(a => <button type="button" key={a.key} className={styles.achievementTile} data-earned={Boolean(a.unlockedAt)} onClick={()=>setSelected(a.key)} aria-label={a.title + (a.unlockedAt ? ", unlocked" : a.status === "planned" ? ", coming later" : ", not yet unlocked") + ". View details."}>
          <span className={styles.medallion} data-earned={Boolean(a.unlockedAt)} aria-hidden="true">
            <span className={styles.medallionRing}>{a.key==="field_observer"?"⌕":a.key==="care_journal"?"▤":"❧"}</span>
            {!a.unlockedAt ? <span className={styles.lockMark}>◇</span> : null}
          </span>
          <span className={styles.tileCopy}><span className={styles.tileStatus}>{a.unlockedAt ? "✓ Unlocked" : a.status === "planned" ? "Coming later" : "Locked"}</span>
            <strong>{a.title}</strong><span className={styles.tileDescription}>{a.description}</span>
            {a.status==="available" ? <span className={styles.tileReward}>+{a.exp} EXP · +{a.coins} Pod Coins</span> : <span className={styles.tileRewardMuted}>Rewards not finalized</span>}</span>
        </button>)}
      </div>
      {!shown.length ? <p className={styles.empty}>No achievements in this view yet.</p> : null}
      <p className={styles.caption}>More milestones will appear as they are finalized and connected to real activity tracking.</p>
    </section> : null}

    {view === "explore" ? <section className={styles.explore} aria-labelledby="explore-title"><div className={styles.sectionHeading}><h2 id="explore-title">Explore PodScape</h2><span>Find something new</span></div><p className={styles.caption}>These are suggested destinations, not EXP-earning quests yet.</p><div className={styles.exploreGrid}>{activities.map(a=><Link href={a.href} className={styles.exploreTile} key={a.href}><span className={styles.exploreIcon} aria-hidden="true">{a.icon}</span><strong>{a.title}</strong><small>{a.description}</small><span className={styles.exploreArrow} aria-hidden="true">↗</span></Link>)}</div></section> : null}

    {view === "stats" ? <section className={styles.stats} aria-labelledby="stats-title"><div className={styles.sectionHeading}><h2 id="stats-title">Your Journey</h2><span>Member overview</span></div><div className={styles.statsGrid}><div><small>Current level</small><strong>{level}</strong></div><div><small>Lifetime EXP</small><strong>{exp.toLocaleString("en-CA")}</strong></div><div><small>Pod Coins</small><strong>{coins.toLocaleString("en-CA")}</strong></div><div><small>Recorded achievements</small><strong>{error ? "—" : unlockedCount}</strong></div></div><p className={styles.caption}>EXP is permanent. Pod Coin redemption and additional reward milestones are still being developed.</p></section> : null}

    {view === "achievements" ? <section className={styles.explore} aria-labelledby="explore-next"><div className={styles.sectionHeading}><h2 id="explore-next">Explore & Learn</h2><span>Ideas for your next visit</span></div><div className={styles.exploreGrid}>{activities.map(a=><Link href={a.href} className={styles.exploreTile} key={a.href}><span className={styles.exploreIcon} aria-hidden="true">{a.icon}</span><strong>{a.title}</strong><small>{a.description}</small><span className={styles.exploreArrow} aria-hidden="true">↗</span></Link>)}</div><p className={styles.caption}>Suggestions only: activities here do not automatically award EXP or Pod Coins yet.</p></section> : null}
    <p className={styles.footerNote}>Your EXP stays with you. Future Pod Coin rewards and eligibility will be announced as the program develops.</p>
  </div>

  {selectedAchievement ? <div className={styles.modalBackdrop} role="presentation" onClick={()=>setSelected(null)}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="achievement-detail-title" onClick={e=>e.stopPropagation()}>
    <button type="button" className={styles.closeModal} aria-label="Close achievement details" onClick={()=>setSelected(null)}>×</button>
    <div className={styles.modalEmblem} aria-hidden="true">{selectedAchievement.unlockedAt ? "✦" : "❧"}</div>
    <span className={styles.tileStatus}>{selectedAchievement.unlockedAt?"✓ Unlocked":selectedAchievement.status==="planned"?"Coming later":"Not yet unlocked"}</span>
    <h2 id="achievement-detail-title">{selectedAchievement.title}</h2><p>{selectedAchievement.description}</p>
    {selectedAchievement.status==="available" ? <strong className={styles.modalReward}>+{selectedAchievement.exp} EXP · +{selectedAchievement.coins} Pod Coins</strong> : <p>Milestone and rewards are still being designed.</p>}
    {selectedAchievement.unlockedAt ? <p>Earned {new Date(selectedAchievement.unlockedAt).toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"})}</p> : null}
    {selectedAchievement.status==="available"&&!selectedAchievement.unlockedAt ? <Link href="/ledger" onClick={()=>setSelected(null)}>Explore the Ledger →</Link> : null}
  </div></div> : null}
  </main>;
}

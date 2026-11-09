"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./fun-zone.module.css";
import {WorkspaceSectionHeader} from "@/components/PodscapeWorkspaceUI";
import {games as gameCatalog} from "@/lib/fun-zone-games";

type Category = "All" | "Daily" | "Word" | "Knowledge" | "Logic";
// Single source of truth for all playable sample games.
const games: {key:string;title:string;detail:string;category:Exclude<Category,"All">;mark:string;ready:boolean;href?:string}[] = [
 ...gameCatalog.map(game=>({
  key:game.key,title:game.title,detail:game.subtitle,category:game.category as Exclude<Category,"All">,
  mark:game.mark,ready:true,href:"/fun-zone/"+game.key
 })),
 {key:"word-search",title:"Word Search",detail:"Find hidden hobby terms.",category:"Word",mark:"⌗",ready:true,href:"/fun-zone/word-search"}
];
const categories:Category[] = ["All","Daily","Word","Knowledge","Logic"];
export function FunZoneLibrary({completedByGame={},trackingAvailable=false}:{completedByGame?:Record<string,number>;trackingAvailable?:boolean}){
 const [category,setCategory]=useState<Category>("All");
 const filtered=games.filter(game=>category==="All"||game.category===category);
 return <section className={styles.library} id="puzzle-collection" aria-label="Puzzle Collection">
  <WorkspaceSectionHeader title="Puzzle Collection" description="Explore isopod-themed games, quizzes and puzzles." meta={games.length}/>
  <div className={styles.categories} aria-label="Filter puzzles by category">{categories.map(item=><button type="button" key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>
  <div className={styles.puzzleGrid}>{filtered.map((game)=><article className={styles.puzzleCard} key={game.title}>
    <div className={styles.puzzleArt} data-kind={game.category}><span className={styles.artLeaf} aria-hidden="true">❧</span><span className={styles.artMark} aria-hidden="true">{game.mark}</span><span className={styles.artLabel} aria-hidden="true">{game.category}</span></div>
    <div className={styles.puzzleDetails}><div><h3>{game.title}</h3><p>{game.detail}</p><small className={styles.gameProgress}>{trackingAvailable?`${Math.min(4,completedByGame[game.key]||0)} / 4 completed · ${completedByGame[game.key]===4?"All cleared":"Sequential unlocks"}`:"4 puzzles · Complete to unlock the next"}</small><span className={styles.availability} data-ready={game.ready}>{game.ready?"Playable":"Coming soon"}</span></div>{game.href?<Link className={styles.puzzleArrow} href={game.href} aria-label={`Play ${game.title}`}>→</Link>:<span className={styles.puzzleArrowDisabled} aria-hidden="true">⌛</span>}</div>
  </article>)}</div>
  <nav className={styles.funLinks} aria-label="Fun Zone destinations"><Link href="/fun-zone/leaderboard">Leaderboard →</Link><Link href="/account/progress">My progress →</Link><Link href="/ledger">Explore Leaf Ledger →</Link></nav>
  <div className={styles.milestone}><span className={styles.milestoneIcon} aria-hidden="true">❧</span><div><strong>Monthly Milestones</strong><p>Five EXP achievement milestones are available for unique completions, including finishing all eight game types.</p></div><span className={styles.milestoneStatus}>EXP milestones</span></div>
 </section>;
}

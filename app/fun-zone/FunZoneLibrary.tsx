"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./fun-zone.module.css";
import {WorkspaceSectionHeader} from "@/components/PodscapeWorkspaceUI";
import {games as gameCatalog} from "@/lib/fun-zone-games";

type Category = "All" | "Daily" | "Word" | "Knowledge" | "Logic";
// Single source of truth for all playable sample games.
const games: {title:string;detail:string;category:Exclude<Category,"All">;mark:string;ready:boolean;href?:string}[] = [
 ...gameCatalog.map(game=>({
  title:game.title,detail:game.subtitle,category:game.category as Exclude<Category,"All">,
  mark:game.mark,ready:true,href:"/fun-zone/"+game.key
 })),
 {title:"Word Search",detail:"Find hidden hobby terms.",category:"Word",mark:"⌗",ready:true,href:"/fun-zone/word-search"}
];
const categories:Category[] = ["All","Daily","Word","Knowledge","Logic"];
export function FunZoneLibrary(){
 const [category,setCategory]=useState<Category>("All");
 const filtered=games.filter(game=>category==="All"||game.category===category);
 return <section className={styles.library} id="puzzle-collection" aria-label="Puzzle Collection">
  <WorkspaceSectionHeader title="Puzzle Collection" description="Explore isopod-themed games, quizzes and puzzles." meta={games.length}/>
  <div className={styles.categories} aria-label="Filter puzzles by category">{categories.map(item=><button type="button" key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>
  <div className={styles.puzzleGrid}>{filtered.map((game)=><article className={styles.puzzleCard} key={game.title}>
    <div className={styles.puzzleArt} data-kind={game.category}><span className={styles.artLeaf} aria-hidden="true">❧</span><span className={styles.artMark} aria-hidden="true">{game.mark}</span><span className={styles.artLabel} aria-hidden="true">{game.category}</span></div>
    <div className={styles.puzzleDetails}><div><h3>{game.title}</h3><p>{game.detail}</p><span className={styles.availability} data-ready={game.ready}>{game.ready?"Playable":"Coming soon"}</span></div>{game.href?<Link className={styles.puzzleArrow} href={game.href} aria-label={`Play ${game.title}`}>→</Link>:<span className={styles.puzzleArrowDisabled} aria-hidden="true">⌛</span>}</div>
  </article>)}</div>
  <nav className={styles.funLinks} aria-label="Fun Zone destinations"><Link href="/fun-zone/leaderboard">Leaderboard →</Link><Link href="/account/progress">My progress →</Link><Link href="/ledger">Explore Leaf Ledger →</Link></nav>
  <div className={styles.milestone}><span className={styles.milestoneIcon} aria-hidden="true">❧</span><div><strong>Monthly Milestones</strong><p>Challenges and activity milestones are in development.</p></div><span className={styles.milestoneStatus}>Coming soon</span></div>
 </section>;
}

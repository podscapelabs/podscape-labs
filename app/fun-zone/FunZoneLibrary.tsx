"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./fun-zone.module.css";

type Category = "All" | "Daily" | "Word" | "Knowledge" | "Logic";
const games: {title:string;detail:string;category:Exclude<Category,"All">;mark:string;ready:boolean;href?:string}[] = [
 {title:"Crossword Colony",detail:"Solve isopod-themed clues.",category:"Word",mark:"▦",ready:true,href:"/fun-zone/crossword-colony"},
 {title:"Colony Connections",detail:"Find four hidden groups.",category:"Logic",mark:"◇",ready:true,href:"/fun-zone/colony-connections"},
 {title:"Word Burrow",detail:"Guess the isopod term.",category:"Word",mark:"ABC",ready:true,href:"/fun-zone/word-burrow"},
 {title:"Species Detective",detail:"Identify species from clues.",category:"Knowledge",mark:"⌕",ready:true,href:"/fun-zone/species-detective"},
 {title:"Word Search",detail:"Find hidden hobby terms.",category:"Word",mark:"⌗",ready:true,href:"/fun-zone/word-search"},
 {title:"Keeper's Challenge",detail:"Solve practical colony scenarios.",category:"Logic",mark:"☷",ready:true,href:"/fun-zone/keepers-challenge"},
 {title:"Word of the Week",detail:"Explore isopod terminology.",category:"Daily",mark:"✧",ready:true,href:"/fun-zone/word-of-the-week"},
 {title:"Species Quiz",detail:"Test your isopod knowledge.",category:"Knowledge",mark:"?",ready:true,href:"/fun-zone/species-quiz"},
];
const categories:Category[] = ["All","Daily","Word","Knowledge","Logic"];
export function FunZoneLibrary(){
 const [category,setCategory]=useState<Category>("All");
 const filtered=games.filter(game=>category==="All"||game.category===category);
 return <section className={styles.library} id="puzzle-collection" aria-labelledby="puzzle-collection-heading">
  <div className={styles.sectionHeading}><h2 id="puzzle-collection-heading">Puzzle Collection <span aria-hidden="true">❧</span></h2><small>Every puzzle has an isopod theme</small></div>
  <div className={styles.categories} aria-label="Filter puzzles by category">{categories.map(item=><button type="button" key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>
  <div className={styles.puzzleGrid}>{filtered.map((game,i)=><article className={styles.puzzleCard} key={game.title}>
    <div className={styles.puzzleArt} data-kind={game.category}><span className={styles.artLeaf} aria-hidden="true">❧</span><span className={styles.artMark} aria-hidden="true">{game.mark}</span><span className={styles.artLabel} aria-hidden="true">{game.category} / {String(i+1).padStart(2,"0")}</span></div>
    <div className={styles.puzzleDetails}><div><h3>{game.title}</h3><p>{game.detail}</p><span className={styles.availability} data-ready={game.ready}>{game.ready?"Play sample":"Coming soon"}</span></div>{game.href?<Link className={styles.puzzleArrow} href={game.href} aria-label={`Play ${game.title}`}>→</Link>:<span className={styles.puzzleArrowDisabled} aria-hidden="true">⌛</span>}</div>
  </article>)}</div>
  <div className={styles.milestone}><span className={styles.milestoneIcon} aria-hidden="true">❧</span><div><strong>Monthly Milestones</strong><p>Challenges and activity milestones are in development.</p></div><span className={styles.milestoneStatus}>Coming soon</span></div>
 </section>;
}

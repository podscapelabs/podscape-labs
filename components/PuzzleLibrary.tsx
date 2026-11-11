"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./PuzzleLibrary.module.css";
import {WorkspaceSectionHeader,WorkspaceLinks} from "./PodscapeWorkspaceUI";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {gameIcon,progressIcons} from "@/lib/podscape-icon-catalog";

export type PuzzleItem = {id:string;title:string;description:string;learning?:string;topic:string;difficulty:string;href?:string;status:"playable"|"completed"|"locked"|"upcoming"};
export function PuzzleLibrary({title,subtitle,eyebrow="Fun Zone / Puzzle Library",puzzles,gameKey=""}:{title:string;subtitle:string;eyebrow?:string;puzzles:PuzzleItem[];gameKey?:string}){
 const [filter,setFilter]=useState<"all"|"playable"|"upcoming">("all");
 const shown=puzzles.filter(p=>filter==="all"||(filter==="playable"?p.status==="playable"||p.status==="completed":p.status==="upcoming"||p.status==="locked"));
 const completed=puzzles.filter(p=>p.status==="completed").length;
 return <main className={styles.page}><div className={styles.wrap}>
   <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/fun-zone">← Fun Zone</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
   <header className={styles.hero}><div className={styles.heroContent}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div></header>
   <div className={styles.summary} aria-label="Puzzle library overview">
     <div><span className={styles.summaryIcon} aria-hidden="true"><PodscapeLineIcon name="grid"/></span><strong>{puzzles.length}</strong><small>Listed puzzles</small></div>
     <div><span className={styles.summaryIcon} aria-hidden="true"><PodscapeLineIcon name="check"/></span><strong>{completed} / {puzzles.length}</strong><small>Completed</small></div>
   </div>
   <div className={styles.libraryHeading}><WorkspaceSectionHeader title="Your learning path" description="Start with familiar words. Each level introduces new keeper knowledge before tougher scientific vocabulary." meta={shown.length+" shown"}/></div>
   <div className={styles.filters} role="group" aria-label="Filter puzzles">
     {([["all","All"],["playable","Ready & completed"],["upcoming","Locked"]] as const).map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}
   </div>
   <div className={styles.cards}>{shown.map((puzzle)=><article className={styles.card} data-status={puzzle.status} key={puzzle.id}>
     <div className={styles.art} aria-hidden="true"><span className={styles.artSymbol}><PodscapeLineIcon name={puzzle.status==="completed"?progressIcons.completed:puzzle.status==="locked"?progressIcons.locked:gameIcon(gameKey)}/></span></div>
     <div className={styles.cardContent}><div className={styles.cardTop}><span className={styles.topic}>{puzzle.topic} · {puzzle.difficulty}</span><span className={styles.status} data-ready={puzzle.status==="playable"||puzzle.status==="completed"}>{puzzle.status==="completed"?"Completed":puzzle.status==="locked"?"Locked":puzzle.status==="playable"?"Ready to play":"Coming soon"}</span></div><h3>{puzzle.title}</h3><p>{puzzle.description}</p>{puzzle.learning?<p className={styles.learningPreview}><PodscapeLineIcon name="book"/> {puzzle.learning}</p>:null}<small>{puzzle.status==="completed"?"You can replay this puzzle at any time":puzzle.status==="locked"?"Complete the previous puzzle to unlock":puzzle.status==="playable"?"Finish to record your progress":"This challenge is in development"}</small></div>
     {puzzle.href&&puzzle.status!=="locked"&&puzzle.status!=="upcoming"?<Link className={styles.action} href={puzzle.href} aria-label={`${puzzle.status==="completed"?"Replay":"Play"} ${puzzle.title}`}>{puzzle.status==="completed"?"Replay":"Play"} <span aria-hidden="true">→</span></Link>:null}
   </article>)}</div>
   {shown.length===0?<p className={styles.empty}>No puzzles match this filter yet.</p>:null}
   <p className={styles.note}>Complete puzzles in order to unlock the next challenge. Your completed puzzles remain replayable, and eligible Fun Zone achievements award EXP only once.</p>
   <WorkspaceLinks items={[{href:"/fun-zone",label:"All games"},...(gameKey?[{href:"/fun-zone/leaderboard?game="+encodeURIComponent(gameKey),label:"Game rankings"}]:[]),{href:"/ledger",label:"Leaf Ledger"}]}/>
 </div></main>;
}

"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./PuzzleLibrary.module.css";

export type PuzzleItem = {id:string;title:string;description:string;topic:string;difficulty:string;href?:string;status:"playable"|"upcoming"};
export function PuzzleLibrary({title,subtitle,eyebrow="Fun Zone / Puzzle Library",puzzles}:{title:string;subtitle:string;eyebrow?:string;puzzles:PuzzleItem[]}){
 const [filter,setFilter]=useState<"all"|"playable"|"upcoming">("all");
 const shown=puzzles.filter(p=>filter==="all"||(filter==="playable"?p.status==="playable":p.status==="upcoming"));
 const ready=puzzles.filter(p=>p.status==="playable").length;
 return <main className={styles.page}><div className={styles.wrap}>
   <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/fun-zone">← Fun Zone</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
   <header className={styles.hero}><div className={styles.heroContent}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}<span aria-hidden="true"> ❧</span></h1><p>{subtitle}</p></div><div className={styles.heroDecoration} aria-hidden="true">❧</div></header>
   <div className={styles.summary} aria-label="Puzzle library overview">
     <div><span className={styles.summaryIcon} aria-hidden="true">▦</span><strong>{puzzles.length}</strong><small>Listed puzzles</small></div>
     <div><span className={styles.summaryIcon} aria-hidden="true">✦</span><strong>{ready}</strong><small>Playable now</small></div>
   </div>
   <div className={styles.libraryHeading}><div><h2>Choose a puzzle</h2><p>Pick a challenge and explore at your own pace.</p></div><span>{shown.length} shown</span></div>
   <div className={styles.filters} role="group" aria-label="Filter puzzles">
     {([["all","All"],["playable","Playable"],["upcoming","Coming soon"]] as const).map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}
   </div>
   <div className={styles.cards}>{shown.map((puzzle,index)=><article className={styles.card} key={puzzle.id}>
     <div className={styles.art} aria-hidden="true"><span className={styles.artLeaf}>❧</span><span className={styles.artSymbol}>{puzzle.status==="playable"?"⌕":"▦"}</span></div>
     <div className={styles.cardContent}><div className={styles.cardTop}><span className={styles.topic}>{puzzle.topic} · {puzzle.difficulty}</span><span className={styles.status} data-ready={puzzle.status==="playable"}>{puzzle.status==="playable"?"Playable test":"Coming soon"}</span></div><h3>{puzzle.title}</h3><p>{puzzle.description}</p><small>{puzzle.status==="playable"?"Progress is not saved yet · No EXP awarded":"This challenge is in development"}</small></div>
     {puzzle.href?<Link className={styles.action} href={puzzle.href} aria-label={`Play ${puzzle.title}`}>Play <span aria-hidden="true">→</span></Link>:null}
   </article>)}</div>
   {shown.length===0?<p className={styles.empty}>No puzzles match this filter yet.</p>:null}
   <p className={styles.note}>Completion tracking and EXP rewards are being developed. The numbers above describe available puzzles, not personal achievements.</p>
 </div></main>;
}

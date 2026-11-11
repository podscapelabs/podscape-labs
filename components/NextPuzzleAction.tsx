"use client";
import Link from "next/link";
import type {PuzzleSaveState} from "./usePuzzleCompletion";
import styles from "./PlayGame.module.css";

/** Progression is more important than replay; wait until the completion is saved
 * so server-side sequential unlocking does not redirect back to the library. */
export function NextPuzzleAction({completed,saved,nextHref,nextTitle,libraryHref}:{
 completed:boolean;saved:PuzzleSaveState;nextHref?:string;nextTitle?:string;libraryHref:string;
}){
 if(!completed)return null;
 const ready=saved==="saved";
 return <div className={styles.completionNavigation} aria-label="Continue playing">
  {ready&&nextHref?<Link className={styles.completionNext} href={nextHref}>Next challenge <span aria-hidden="true">→</span><small>{nextTitle}</small></Link>:
   ready?<Link className={styles.completionNext} href={libraryHref}>Explore more puzzles <span aria-hidden="true">→</span></Link>:
   <span className={styles.completionWaiting} role="status">{saved==="unavailable"?"Save your result to unlock the next challenge.":"Saving your progress to unlock the next challenge…"}</span>}
  {ready?<Link href={libraryHref} className={styles.completionBrowse}>All puzzles</Link>:null}
 </div>;
}

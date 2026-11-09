"use client";
import { useState, useRef, useMemo } from "react";
import type {SearchPuzzle} from "@/lib/fun-zone-puzzles";
import {makeWordSearchPuzzle} from "@/lib/fun-zone-logic";
import {usePuzzleCompletion,PuzzleSaveStatus} from "@/components/usePuzzleCompletion";
import Link from "next/link";
import styles from "./game.module.css";

type Point={r:number;c:number};
export default function GenusWordSearch({puzzleData}:{puzzleData:SearchPuzzle}){
 const {words:WORDS,size:SIZE}=puzzleData;
 const puzzle=useMemo(()=>makeWordSearchPuzzle(puzzleData.words,puzzleData.size,puzzleData.seed),[puzzleData]);
 const {saved,record,retry}=usePuzzleCompletion("word-search",puzzleData.id);
 const [found,setFound]=useState<string[]>([]);
 const [hinted,setHinted]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const [start,setStart]=useState<Point|null>(null);
 const [end,setEnd]=useState<Point|null>(null);
 const gesture=useRef<{origin:Point;last:Point;moved:boolean}|null>(null);
 const board=useRef<HTMLDivElement>(null);
 const path=(a:Point,b:Point)=>{const dr=b.r-a.r,dc=b.c-a.c,n=Math.max(Math.abs(dr),Math.abs(dc));if(n===0||dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return [a.r+"-"+a.c];return Array.from({length:n+1},(_,i)=>(a.r+Math.sign(dr)*i)+"-"+(a.c+Math.sign(dc)*i));};
 const selected=start&&end?path(start,end):[];
 const commit=(a:Point,b:Point)=>{const chosen=path(a,b);const word=WORDS.find(w=>!found.includes(w)&&(chosen.join("|")===puzzle.locations[w].join("|")||[...chosen].reverse().join("|")===puzzle.locations[w].join("|")));if(word){const next=[...found,word];setFound(v=>v.includes(word)?v:next);if(next.length===WORDS.length)record({words:next});setHinted(current=>current===word?null:current);setNotice(word+" found!");}else if(chosen.length>1)setNotice("No matching genus along that line — try another direction.");setStart(null);setEnd(null);gesture.current=null;};
 const cellAt=(x:number,y:number):Point|null=>{const el=document.elementFromPoint(x,y)?.closest("[data-cell]") as HTMLElement|null;if(!el||!board.current?.contains(el))return null;return {r:Number(el.dataset.r),c:Number(el.dataset.c)};};
 const same=(a:Point,b:Point)=>a.r===b.r&&a.c===b.c;
 const press=(p:Point)=>{gesture.current={origin:p,last:p,moved:false};};
 const move=(p:Point)=>{const g=gesture.current;if(!g)return;if(!same(p,g.origin)){g.last=p;g.moved=true;setStart(g.origin);setEnd(p);}};
 const release=(p:Point|null)=>{const g=gesture.current;gesture.current=null;if(!g)return;
  if(g.moved){commit(g.origin,p||g.last);return;}
  if(start){commit(start,g.origin);}else{setStart(g.origin);setEnd(g.origin);}
 };
 const cancel=()=>{gesture.current=null;setStart(null);setEnd(null);};
 return <main className={styles.page}><div className={styles.wrap}>
 <Link href="/fun-zone/word-search" className={styles.back}>← Word Search Library</Link>
 <p className={styles.eyebrow}>PODSCAPE / FUN ZONE / WORD SEARCH</p><h1>{puzzleData.title}</h1>
 <p className={styles.intro}>{puzzleData.description} Tap the first and last letters, or swipe across a word.</p>
 <div className={styles.game}>
 <div className={styles.board} data-swipe-navigation="local" ref={board} onPointerMove={e=>{const p=cellAt(e.clientX,e.clientY);if(p)move(p);}} onPointerUp={e=>release(cellAt(e.clientX,e.clientY))} onPointerCancel={cancel}>
 {puzzle.grid.map((row,r)=>row.map((letter,c)=>{const id=r+"-"+c;const solved=found.some(w=>puzzle.locations[w].includes(id));const isHint=hinted!==null&&puzzle.locations[hinted]?.[0]===id;return <button key={id} type="button" data-cell data-r={r} data-c={c} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press({r,c});}} className={`${styles.cell} ${solved?styles.solved:""} ${selected.includes(id)?styles.selected:""} ${isHint?styles.hinted:""}`} aria-label={`Row ${r+1} column ${c+1}, ${letter}`}>{letter}</button>}))}
 </div>
 <aside className={styles.side}><div className={styles.progress}><strong>{found.length} / {WORDS.length} found</strong><button type="button" onClick={()=>{setFound([]);setStart(null);setEnd(null);setHinted(null);setNotice("");gesture.current=null}}>Reset</button></div><div className={styles.words}>{WORDS.map(w=><span className={found.includes(w)?styles.done:""} key={w}>{found.includes(w)?"✓ ":""}{w}</span>)}</div>{found.length===WORDS.length?<div className={styles.win}>Puzzle complete! Well done!</div>:<div className={styles.hintControls}><button type="button" onClick={()=>{const word=WORDS.find(w=>!found.includes(w));if(word){setHinted(word);setNotice("Hint: The first letter of "+word+" is highlighted.");}}}>Show a starting letter</button><p className={styles.tip}>Tip: Words can run backwards or diagonally.</p></div>}<p className={styles.statusText} role="status">{notice}</p><small>Early-access puzzle · EXP milestones only, no Pod Coins</small><PuzzleSaveStatus status={saved} retry={retry}/></aside>
 </div></div></main>;
}
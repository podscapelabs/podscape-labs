"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import styles from "./game.module.css";
const WORDS=["CUBARIS","PORCELLIO","ARMADILLIDIUM","PORCELLIONIDES","TRICHORHINA","ONISCUS","PHILOSCIA","NAGURUS"];
const SIZE=16;
type Point={r:number;c:number};
const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
function makePuzzle(){
 const grid=Array.from({length:SIZE},()=>Array.from({length:SIZE},()=> ""));
 const locations:Record<string,string[]>={};
 let seed=24681357;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(const word of [...WORDS].sort((a,b)=>b.length-a.length)){
  let placed=false;
  for(let attempt=0;attempt<10000&&!placed;attempt++){
   const [dr,dc]=directions[Math.floor(random()*directions.length)];
   const r=Math.floor(random()*SIZE),c=Math.floor(random()*SIZE);
   const cells=Array.from({length:word.length},(_,i)=>({r:r+i*dr,c:c+i*dc}));
   if(cells.some((p,i)=>p.r<0||p.c<0||p.r>=SIZE||p.c>=SIZE||(grid[p.r][p.c]!==""&&grid[p.r][p.c]!==word[i])))continue;
   cells.forEach((p,i)=>grid[p.r][p.c]=word[i]);
   locations[word]=cells.map(p=>p.r+"-"+p.c);placed=true;
  }
  if(!placed)throw new Error("Puzzle placement failed");
 }
 const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 grid.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]=letters[Math.floor(random()*letters.length)]}));
 return {grid,locations};
}
const puzzle=makePuzzle();
export default function GenusWordSearch(){
 const [found,setFound]=useState<string[]>([]);
 const [start,setStart]=useState<Point|null>(null);
 const [end,setEnd]=useState<Point|null>(null);
 const gesture=useRef<{origin:Point;last:Point;moved:boolean}|null>(null);
 const board=useRef<HTMLDivElement>(null);
 const path=(a:Point,b:Point)=>{const dr=b.r-a.r,dc=b.c-a.c,n=Math.max(Math.abs(dr),Math.abs(dc));if(n===0||dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return [a.r+"-"+a.c];return Array.from({length:n+1},(_,i)=>(a.r+Math.sign(dr)*i)+"-"+(a.c+Math.sign(dc)*i));};
 const selected=start&&end?path(start,end):[];
 const commit=(a:Point,b:Point)=>{const chosen=path(a,b);const word=WORDS.find(w=>!found.includes(w)&&(chosen.join("|")===puzzle.locations[w].join("|")||[...chosen].reverse().join("|")===puzzle.locations[w].join("|")));if(word)setFound(v=>[...v,word]);setStart(null);setEnd(null);gesture.current=null;};
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
 <Link href="/fun-zone" className={styles.back}>← Fun Zone</Link>
 <p className={styles.eyebrow}>WORD SEARCH · TAXONOMY · EASY</p><h1>Genus Explorer</h1>
 <p className={styles.intro}>Find eight isopod genera hidden horizontally, vertically, or diagonally. Tap the first and last letter of a word, or drag across its letters.</p>
 <div className={styles.game}>
 <div className={styles.board} ref={board} onPointerMove={e=>{const p=cellAt(e.clientX,e.clientY);if(p)move(p);}} onPointerUp={e=>release(cellAt(e.clientX,e.clientY))} onPointerCancel={cancel}>
 {puzzle.grid.map((row,r)=>row.map((letter,c)=>{const id=r+"-"+c;const solved=found.some(w=>puzzle.locations[w].includes(id));return <button key={id} type="button" data-cell data-r={r} data-c={c} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press({r,c});}} className={`${styles.cell} ${solved?styles.solved:""} ${selected.includes(id)?styles.selected:""}`} aria-label={`Row ${r+1} column ${c+1}, ${letter}`}>{letter}</button>}))}
 </div>
 <aside className={styles.side}><div className={styles.progress}><strong>{found.length} / {WORDS.length} found</strong><button onClick={()=>{setFound([]);setStart(null);setEnd(null);gesture.current=null}}>Reset</button></div><div className={styles.words}>{WORDS.map(w=><span className={found.includes(w)?styles.done:""} key={w}>{found.includes(w)?"✓ ":""}{w}</span>)}</div>{found.length===WORDS.length?<div className={styles.win}>✦ Puzzle complete! Well done!</div>:<p className={styles.tip}>Tip: You can also select a word backwards.</p>}<small>Test puzzle · No rewards awarded</small></aside>
 </div></div></main>;
}
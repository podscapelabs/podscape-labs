"use client";
import {useCallback,useEffect,useState} from "react";
import {DIFFICULTIES,type PicturePuzzle} from "@/lib/picture-puzzles-client";
import styles from "./picture-puzzles.module.css";

type Difficulty=PicturePuzzle["difficulty"];
function shuffled(count:number):number[]{
 const values=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 if(values.every((value,i)=>value===i)&&count>1)[values[0],values[1]]=[values[1],values[0]];
 return values;
}
export function PicturePuzzleBoard({id,title,description,imageUrl,difficulty}:{id:string;title:string;description:string;imageUrl:string;difficulty:Difficulty}){
 const size=DIFFICULTIES[difficulty]?.columns||3;
 const count=size*size;
 const [tiles,setTiles]=useState<number[]>(()=>Array.from({length:count},(_,i)=>i));
 const [selected,setSelected]=useState<number|null>(null);
 const [moves,setMoves]=useState(0);
 const [started,setStarted]=useState(false);
 const [finished,setFinished]=useState(false);
 const [showReference,setShowReference]=useState(false);
 const key="podscape:picture-puzzle:v1:"+id;
 const start=useCallback(()=>{setTiles(shuffled(count));setSelected(null);setMoves(0);setFinished(false);setStarted(true);},[count]);
 useEffect(()=>{try{const saved=localStorage.getItem(key);if(!saved)return;const v=JSON.parse(saved) as {tiles:number[];moves:number;finished:boolean};if(!Array.isArray(v.tiles)||v.tiles.length!==count||new Set(v.tiles).size!==count||!v.tiles.every(n=>Number.isInteger(n)&&n>=0&&n<count))return;setTiles(v.tiles);setMoves(Number.isSafeInteger(v.moves)&&v.moves>=0?v.moves:0);setFinished(v.finished===true);setStarted(true);}catch{/* Storage unavailable */}},[key,count]);
 useEffect(()=>{if(!started)return;try{localStorage.setItem(key,JSON.stringify({tiles,moves,finished}));}catch{/* Storage unavailable */}},[key,tiles,moves,finished,started]);
 function select(index:number){
  if(!started||finished)return;
  if(selected===null){setSelected(index);return;}
  if(index===selected){setSelected(null);return;}
  const next=[...tiles];[next[index],next[selected]]=[next[selected],next[index]];
  setTiles(next);setSelected(null);setMoves(m=>m+1);
  if(next.every((value,i)=>value===i))setFinished(true);
 }
 return <section className={styles.game}>
  <div className={styles.gameHeading}><div><span>PICTURE PUZZLE · {DIFFICULTIES[difficulty]?.label.toUpperCase()}</span><h1>{title}</h1><p>{description||"Tap two picture pieces to swap their places."}</p></div><div className={styles.moveCount}><strong>{moves}</strong><small>moves</small></div></div>
  <div className={styles.gameLayout}><div>
   <div className={styles.board} style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label={title+" puzzle board"}>
    {tiles.map((tile,index)=><button type="button" key={index} disabled={!started||finished} onClick={()=>select(index)} className={styles.tile} data-selected={selected===index} aria-label={`Piece ${tile+1}, position ${index+1}${selected===index?", selected":""}`} aria-pressed={selected===index} style={{backgroundImage:`url("${imageUrl}")`,backgroundSize:`${size*100}% ${size*100}%`,backgroundPosition:`${(tile%size)*100/(size-1)}% ${Math.floor(tile/size)*100/(size-1)}%`}}/>)}
   </div>
   {finished?<p className={styles.win} role="status">Puzzle complete! Beautifully pieced together in {moves} moves. ✨</p>:null}
   {!started?<button type="button" className={styles.primary} onClick={start}>Shuffle & start puzzle</button>:<div className={styles.controls}><button type="button" className={styles.primary} onClick={start}>Shuffle again</button><button type="button" onClick={()=>setShowReference(v=>!v)} aria-pressed={showReference}>{showReference?"Hide image":"View image"}</button></div>}
   <p className={styles.helper}>Tap one tile, then tap another to swap. Your board saves on this device.</p>
  </div><aside className={styles.reference}><h2>The complete artwork</h2><p>Need a little help? Reveal the original while solving.</p>{showReference?<div className={styles.fullImage} role="img" aria-label={"Original artwork for "+title} style={{backgroundImage:`url("${imageUrl}")`}}/>:<button type="button" onClick={()=>setShowReference(true)}>Reveal reference artwork</button>}<p className={styles.note}>A picture-tile puzzle designed for phones, tablets and desktop. No drag precision needed.</p></aside></div>
 </section>;
}

"use client";
import {useCallback,useEffect,useState} from "react";
import {DIFFICULTIES,PUZZLE_TYPES,levelLabel,type PicturePuzzle} from "@/lib/picture-puzzles-client";
import styles from "./picture-puzzles.module.css";
import {InterlockingJigsawBoard} from "./InterlockingJigsawBoard";
import {usePuzzleCompletion,PuzzleSaveStatus} from "@/components/usePuzzleCompletion";

type Difficulty=PicturePuzzle["difficulty"];
type Mode=PicturePuzzle["puzzle_type"];
function shuffled(count:number):number[]{
 const values=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 if(values.every((value,i)=>value===i)&&count>1)[values[0],values[1]]=[values[1],values[0]];
 return values;
}
function adjacent(index:number,blank:number,size:number){
 return Math.abs(Math.floor(index/size)-Math.floor(blank/size))+Math.abs(index%size-blank%size)===1;
}
function shuffledSliding(size:number){
 const count=size*size,tiles=Array.from({length:count},(_,i)=>i);let blank=count-1,last=-1;
 // Every shuffle is a sequence of valid moves, so the resulting board is solvable.
 for(let i=0;i<count*16;i++){
  const options=[blank-size,blank+size,blank%size?blank-1:-1,blank%size<size-1?blank+1:-1].filter(n=>n>=0&&n<count&&n!==last);
  const next=options[Math.floor(Math.random()*options.length)];
  [tiles[blank],tiles[next]]=[tiles[next],tiles[blank]];last=blank;blank=next;
 }
 if(tiles.every((n,i)=>n===i)){const next=blank===count-1?blank-1:blank+1;[tiles[blank],tiles[next]]=[tiles[next],tiles[blank]];}
 return tiles;
}
function SlidingPuzzleBoard({id,title,description,imageAlt,learningNote,imageUrl,difficulty,puzzleType,level}:{id:string;title:string;description:string;imageAlt:string;learningNote:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number}){
 const size=DIFFICULTIES[difficulty]?.columns||3,count=size*size,blankTile=count-1,sliding=puzzleType==="sliding";
 const [tiles,setTiles]=useState<number[]>(()=>Array.from({length:count},(_,i)=>i));
 const [selected,setSelected]=useState<number|null>(null);
 const [moves,setMoves]=useState(0);
 const [started,setStarted]=useState(false);
 const [finished,setFinished]=useState(false);
 const [showReference,setShowReference]=useState(false);
 const [initial,setInitial]=useState<number[]>([]);
 const [steps,setSteps]=useState<number[]>([]);
 const {saved,record,retry}=usePuzzleCompletion("picture-puzzles",id);
 const key="podscape:picture-puzzle:v2:"+id+":"+puzzleType+":"+difficulty;
 const start=useCallback(()=>{const next=sliding?shuffledSliding(size):shuffled(count);setTiles(next);setInitial(next);setSteps([]);setSelected(null);setMoves(0);setFinished(false);setStarted(true);},[count,size,sliding]);
 useEffect(()=>{try{
  const saved=localStorage.getItem(key);if(!saved)return;
  const v=JSON.parse(saved) as {tiles:number[];moves:number;finished:boolean;initial?:number[];steps?:number[]};
  if(!Array.isArray(v.tiles)||v.tiles.length!==count||new Set(v.tiles).size!==count||!v.tiles.every(n=>Number.isInteger(n)&&n>=0&&n<count))return;
  setTiles(v.tiles);setMoves(Number.isSafeInteger(v.moves)&&v.moves>=0?v.moves:0);
  setFinished(v.finished===true);setInitial(Array.isArray(v.initial)?v.initial:[]);setSteps(Array.isArray(v.steps)?v.steps:[]);setStarted(true);
 }catch{/* Device storage unavailable */}},[key,count]);
 useEffect(()=>{if(!started)return;try{localStorage.setItem(key,JSON.stringify({tiles,moves,finished,initial,steps}));}catch{/* Device storage unavailable */}},[key,tiles,moves,finished,started,initial,steps]);
 function select(index:number){
  if(!started||finished)return;
  const next=[...tiles];
  if(sliding){
   const empty=next.indexOf(blankTile);
   if(!adjacent(index,empty,size))return;
   [next[index],next[empty]]=[next[empty],next[index]];
   const trail=[...steps,index];setSteps(trail);
   if(next.every((value,i)=>value===i))void record({initial,steps:trail});
  }else{
   if(selected===null){setSelected(index);return;}
   if(index===selected){setSelected(null);return;}
   [next[index],next[selected]]=[next[selected],next[index]];
   setSelected(null);
  }
  setTiles(next);setMoves(m=>m+1);
  if(next.every((value,i)=>value===i))setFinished(true);
 }
 return <section className={styles.game}>
  <div className={styles.gameHeading}><div><span>{PUZZLE_TYPES[puzzleType].toUpperCase()} · {levelLabel(level)} · {DIFFICULTIES[difficulty].label}</span><h1>{title}</h1><p>{description||"Put the picture back together."}</p></div><div className={styles.moveCount}><strong>{moves}</strong><small>moves</small></div></div>
  {learningNote?<p className={styles.lesson}><strong>Before you play:</strong> {learningNote}</p>:null}
  <div className={styles.gameLayout}><div>
   <div className={styles.board} style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label={title+" "+PUZZLE_TYPES[puzzleType]+" puzzle"}>
    {tiles.map((tile,index)=>{
     const blank=sliding&&tile===blankTile;
     return <button type="button" key={index} disabled={!started||finished||blank} onClick={()=>select(index)} className={styles.tile} data-selected={!sliding&&selected===index} data-blank={blank} aria-label={blank?`Empty space at position ${index+1}`:`Piece ${tile+1}, position ${index+1}${sliding?", tap to slide if adjacent":selected===index?", selected":""}`} aria-pressed={!sliding&&selected===index} style={blank?undefined:{backgroundImage:`url("${imageUrl}")`,backgroundSize:`${size*100}% ${size*100}%`,backgroundPosition:`${(tile%size)*100/(size-1)}% ${Math.floor(tile/size)*100/(size-1)}%`}}/>;
    })}
   </div>
   {finished?<p className={styles.win} role="status">Puzzle complete! Rebuilt in {moves} moves. Beautifully done!</p>:null}
   {finished?<PuzzleSaveStatus status={saved} retry={retry}/>:null}
   {!started?<button type="button" className={styles.primary} onClick={start}>Shuffle & start puzzle</button>:<div className={styles.controls}><button type="button" className={styles.primary} onClick={start}>Start a new shuffle</button><button type="button" onClick={()=>setShowReference(v=>!v)} aria-pressed={showReference}>{showReference?"Hide image":"View image"}</button></div>}
   <p className={styles.helper}>{sliding?"Tap a tile beside the empty square to slide it into place.":"Tap one piece, then another to swap their places."} Your board saves on this device.</p>
  </div><aside className={styles.reference}><h2>The complete artwork</h2><p>Need a little help? Reveal the original while solving.</p>{showReference?<div className={styles.fullImage} role="img" aria-label={imageAlt||"Original artwork for "+title} style={{backgroundImage:`url("${imageUrl}")`}}/>:<button type="button" onClick={()=>setShowReference(true)}>Reveal reference artwork</button>}<p className={styles.note}>{sliding?"An authentic sliding-tile puzzle: only tiles next to the gap can move.":"Touch-friendly picture-piece assembly with tap-to-swap controls."}</p></aside></div>
 </section>;
}

export function PicturePuzzleBoard(props:{id:string;title:string;description:string;imageAlt:string;learningNote:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number}){
 if(props.puzzleType==="sliding")return <SlidingPuzzleBoard {...props}/>;
 return <section className={styles.game}>
  <div className={styles.gameHeading}><div><span>JIGSAW · {levelLabel(props.level)} · {DIFFICULTIES[props.difficulty].label}</span><h1>{props.title}</h1><p>{props.description||"Build this picture, one interlocking piece at a time."}</p></div></div>
  {props.learningNote?<p className={styles.lesson}><strong>Before you play:</strong> {props.learningNote}</p>:null}
  <RewardedJigsaw {...props}/>
 </section>;
}

function RewardedJigsaw(props:{id:string;title:string;description:string;imageAlt:string;learningNote:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number}){
 const {saved,record,retry}=usePuzzleCompletion("picture-puzzles",props.id);
 const [solved,setSolved]=useState(false);
 const onComplete=useCallback((proof:{placed:number[];moves:number})=>{setSolved(true);void record(proof);},[record]);
 return <>
  <InterlockingJigsawBoard key={props.id+props.difficulty} id={props.id} imageUrl={props.imageUrl} imageAlt={props.imageAlt||props.title} size={DIFFICULTIES[props.difficulty].columns} onComplete={onComplete}/>
  {solved?<PuzzleSaveStatus status={saved} retry={retry}/>:null}
 </>;
}

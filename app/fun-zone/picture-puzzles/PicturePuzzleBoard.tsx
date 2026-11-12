"use client";
import {useCallback,useEffect,useState} from "react";
import {DIFFICULTIES,PUZZLE_TYPES,levelLabel,type PicturePuzzle} from "@/lib/picture-puzzles-client";
import styles from "./picture-puzzles.module.css";
import {InterlockingJigsawBoard} from "./InterlockingJigsawBoard";
import {usePuzzleCompletion,PuzzleSaveStatus} from "@/components/usePuzzleCompletion";

type Difficulty=PicturePuzzle["difficulty"];
type Mode=PicturePuzzle["puzzle_type"];
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
/** Reject stale or corrupted device saves instead of presenting an unwinnable board. */
function validSlidingSave(value:unknown,size:number):value is {tiles:number[];initial:number[];steps:number[];moves:number;finished:boolean}{
 if(!value||typeof value!=="object")return false;
 const v=value as Record<string,unknown>,count=size*size;
 const permutation=(x:unknown):x is number[]=>Array.isArray(x)&&x.length===count&&
  x.every(n=>Number.isInteger(n)&&n>=0&&n<count)&&new Set(x).size===count;
 if(!permutation(v.initial)||!permutation(v.tiles)||!Array.isArray(v.steps)||
    v.steps.length>1000||!Number.isSafeInteger(v.moves)||v.moves!==v.steps.length||
    typeof v.finished!=="boolean")return false;
 const board=[...v.initial],hole=count-1;
 if(board.every((tile,i)=>tile===i))return false;
 for(const move of v.steps){
  if(!Number.isInteger(move)||move<0||move>=count)return false;
  const blank=board.indexOf(hole);
  if(!adjacent(move,blank,size))return false;
  [board[blank],board[move]]=[board[move],board[blank]];
 }
 const savedTiles=v.tiles;
 return board.every((tile,i)=>tile===savedTiles[i])&&
  v.finished===board.every((tile,i)=>tile===i);
}
function SlidingPuzzleBoard({userId,id,title,description,imageAlt,learningNote,artistCredit,imageUrl,difficulty,puzzleType,level,rewardsEnabled,nextHref,previewMode=false}:{userId:string;id:string;title:string;description:string;imageAlt:string;learningNote:string;artistCredit?:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number;rewardsEnabled:boolean;nextHref?:string;previewMode?:boolean}){
 const size=DIFFICULTIES[difficulty]?.columns||3,count=size*size,blankTile=count-1;
 const [tiles,setTiles]=useState<number[]>(()=>Array.from({length:count},(_,i)=>i));
 const [moves,setMoves]=useState(0);
 const [started,setStarted]=useState(false);
 const [finished,setFinished]=useState(false);
 const [showReference,setShowReference]=useState(false);
 const [hydrated,setHydrated]=useState(false);
 const [initial,setInitial]=useState<number[]>([]);
 const [steps,setSteps]=useState<number[]>([]);
 const {saved,earnedExp,record,retry}=usePuzzleCompletion("picture-puzzles",id);
 const key="podscape:picture-puzzle:v3:"+userId+":"+id+":"+puzzleType+":"+difficulty;
 const start=useCallback(()=>{const next=shuffledSliding(size);setTiles(next);setInitial(next);setSteps([]);setMoves(0);setFinished(false);setStarted(true);},[size]);
 useEffect(()=>{if(previewMode){setHydrated(true);return;}try{
  const saved=localStorage.getItem(key);if(!saved)return;
  const v:unknown=JSON.parse(saved);
  if(!validSlidingSave(v,size))return;
  setTiles(v.tiles);setMoves(v.moves);
  setFinished(v.finished);setInitial(v.initial);setSteps(v.steps);setStarted(true);
 }catch{/* Device storage unavailable */}finally{setHydrated(true)}},[key,size,previewMode]);
 useEffect(()=>{if(!started||!hydrated||previewMode)return;try{localStorage.setItem(key,JSON.stringify({tiles,moves,finished,initial,steps}));}catch{/* Device storage unavailable */}},[key,tiles,moves,finished,started,hydrated,initial,steps,previewMode]);
 // If the player completed a board while offline, retry the verified save on return.
 // A server-side move replay still decides whether EXP/progression is earned.
 useEffect(()=>{
  if(hydrated&&started&&finished&&rewardsEnabled&&saved==="idle"&&initial.length===count&&steps.length>0)
   void record({initial,steps});
 },[hydrated,started,finished,rewardsEnabled,saved,initial,steps,count,record]);
 function select(index:number){
  if(!started||finished)return;
  const next=[...tiles];
  const empty=next.indexOf(blankTile);
  if(!adjacent(index,empty,size))return;
  [next[index],next[empty]]=[next[empty],next[index]];
  const trail=[...steps,index];setSteps(trail);
  if(next.every((value,i)=>value===i)&&rewardsEnabled)void record({initial,steps:trail});
  setTiles(next);setMoves(m=>m+1);
  if(next.every((value,i)=>value===i))setFinished(true);
 }
 return <section className={styles.game}>
  <div className={styles.gameHeading}><div><span>{PUZZLE_TYPES[puzzleType].toUpperCase()} · {levelLabel(level)} · {DIFFICULTIES[difficulty].label}</span><h1>{title}</h1><p>{description||"Put the picture back together."}</p></div><div className={styles.moveCount}><strong>{moves}</strong><small>moves</small></div></div>
  <div className={styles.gameLayout}><div>
   <div className={styles.board} style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label={title+" "+PUZZLE_TYPES[puzzleType]+" puzzle"}>
    {tiles.map((tile,index)=>{
     const blank=tile===blankTile;
     return <button type="button" key={index} disabled={!started||finished||blank} onClick={()=>select(index)} className={styles.tile} data-selected={false} data-blank={blank} aria-label={blank?`Empty space at position ${index+1}`:`Piece ${tile+1}, position ${index+1}, tap to slide if adjacent`} aria-pressed={false} style={blank?undefined:{backgroundImage:`url("${imageUrl}")`,backgroundSize:`${size*100}% ${size*100}%`,backgroundPosition:`${(tile%size)*100/(size-1)}% ${Math.floor(tile/size)*100/(size-1)}%`}}/>;
    })}
   </div>
   {finished?<div className={styles.victory} role="status"><span aria-hidden="true">✦ 🧩 ✦</span><h2>Picture complete!</h2><p className={styles.victoryTitle}>{title}</p><p>You solved the sliding puzzle in {moves} moves.</p><div className={styles.victoryArt} role="img" aria-label={imageAlt} style={{backgroundImage:`url("${imageUrl}")`}}/>{learningNote?<div className={styles.victoryDiscovery}><strong>Did you know?</strong><p>{learningNote}</p></div>:null}{artistCredit?<p className={styles.victoryCredit}>Original artwork by <strong>{artistCredit}</strong></p>:null}{previewMode?<small>Preview only · No EXP or progress recorded</small>:saved==="saved"?<strong className={styles.victoryExp}>{earnedExp?`+${earnedExp} EXP earned`:"Progress saved · No new EXP on replay"}</strong>:<small>Achievement EXP is awarded once for newly unlocked milestones.</small>}</div>:null}
   {finished&&rewardsEnabled?<PuzzleSaveStatus status={saved} retry={retry}/>:null}
   {finished&&saved==="saved"&&nextHref?<a className={styles.nextPuzzle} href={nextHref}>Next picture puzzle →</a>:null}
   {!started?<button type="button" className={styles.primary} onClick={start}>Shuffle & start puzzle</button>:<div className={styles.controls}><button type="button" className={styles.primary} onClick={start}>Start a new shuffle</button><button type="button" onClick={()=>setShowReference(v=>!v)} aria-pressed={showReference}>{showReference?"Hide image":"View image"}</button></div>}
   <p className={styles.helper}>Tap a tile beside the empty square to slide it into place. {previewMode?"This is a temporary preview.":"Your board saves on this device."}</p>
  </div><aside className={styles.reference}><h2>The complete artwork</h2><p>Need a little help? Reveal the original while solving.</p>{showReference?<div className={styles.fullImage} role="img" aria-label={imageAlt||"Original artwork for "+title} style={{backgroundImage:`url("${imageUrl}")`}}/>:<button type="button" onClick={()=>setShowReference(true)}>Reveal reference artwork</button>}<p className={styles.note}>An authentic sliding-tile puzzle: only tiles next to the gap can move.</p></aside></div>
 </section>;
}

export function PicturePuzzleBoard(props:{userId:string;id:string;title:string;description:string;imageAlt:string;learningNote:string;artistCredit?:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number;rewardsEnabled:boolean;nextHref?:string;previewMode?:boolean}){
 if(props.puzzleType==="sliding")return <SlidingPuzzleBoard {...props}/>;
 return <section className={styles.game}>
  <div className={styles.gameHeading}><div><span>JIGSAW · {levelLabel(props.level)} · {DIFFICULTIES[props.difficulty].label}</span><h1>{props.title}</h1><p>{props.description||"Build this picture, one interlocking piece at a time."}</p></div></div>
  <RewardedJigsaw {...props}/>
 </section>;
}

function RewardedJigsaw(props:{userId:string;id:string;title:string;description:string;imageAlt:string;learningNote:string;artistCredit?:string;imageUrl:string;difficulty:Difficulty;puzzleType:Mode;level:number;rewardsEnabled:boolean;nextHref?:string;previewMode?:boolean}){
 const {saved,earnedExp,record,retry}=usePuzzleCompletion("picture-puzzles",props.id);
 const [solved,setSolved]=useState(false);
 const onReset=useCallback(()=>setSolved(false),[]);
 const onComplete=useCallback((proof:{placed:number[];moves:number})=>{setSolved(true);if(props.rewardsEnabled)void record(proof);},[record,props.rewardsEnabled]);
 return <>
  <InterlockingJigsawBoard key={props.id+props.difficulty} previewMode={props.previewMode} earnedExp={earnedExp} rewardSaved={saved==="saved"} userId={props.userId} id={props.id} imageUrl={props.imageUrl} imageAlt={props.imageAlt||props.title} title={props.title} learningNote={props.learningNote} artistCredit={props.artistCredit} size={DIFFICULTIES[props.difficulty].columns} onComplete={onComplete} onReset={onReset}/>
  {solved&&props.rewardsEnabled?<PuzzleSaveStatus status={saved} retry={retry}/>:null}
  {solved&&saved==="saved"&&props.nextHref?<a className={styles.nextPuzzle} href={props.nextHref}>Next picture puzzle →</a>:null}
 </>;
}

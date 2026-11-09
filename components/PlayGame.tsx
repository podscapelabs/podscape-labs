"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {Game} from "@/lib/fun-zone-games";
import type {Puzzle,QuizPuzzle,ConnectionsPuzzle,BurrowPuzzle,CrosswordPuzzle} from "@/lib/fun-zone-puzzles";
import {usePuzzleCompletion,PuzzleSaveStatus} from "./usePuzzleCompletion";
import {scoreWordGuess} from "@/lib/fun-zone-logic";
import styles from "./PlayGame.module.css";
import {WorkspaceLinks} from "./PodscapeWorkspaceUI";
import {PodscapeLineIcon} from "./PodscapeLineIcon";

type Completion=(proof:unknown)=>void;
function Quiz({puzzle,onComplete}:{puzzle:QuizPuzzle;onComplete:Completion}){
 const [index,setIndex]=useState(0),[answers,setAnswers]=useState<number[]>([]);
 const questions=puzzle.questions;
 const done=index>=questions.length;
 const score=answers.filter((value,i)=>value===questions[i].answer).length;
 const current=questions[index];
 const chosen=answers[index];
 return <div className={styles.playArea}>{done?<div className={styles.result}><span aria-hidden="true"><PodscapeLineIcon name="achievement"/></span><h2>Challenge complete!</h2><p>You answered {score} of {questions.length} correctly.</p>
  {score<questions.length?<div className={styles.quizReview}><h3>Review what you learned</h3>{questions.map((question,i)=>answers[i]!==question.answer?<div key={i}><strong>{question.prompt}</strong><p>Correct answer: {question.choices[question.answer]}</p><small>{question.explanation}</small></div>:null)}</div>:<p>Perfect round! Every answer was correct.</p>}
  <button type="button" onClick={()=>{setIndex(0);setAnswers([])}}>Try again ↻</button>
 </div>:<><div className={styles.stage}><small>QUESTION {index+1} / {questions.length}</small><h2>{current.prompt}</h2></div><div className={styles.options}>{current.choices.map((choice,i)=><button type="button" disabled={chosen!==undefined} data-result={chosen===undefined?"":i===current.answer?"correct":i===chosen?"incorrect":""} key={choice} onClick={()=>setAnswers(a=>[...a,i])}>{choice}</button>)}</div>{chosen!==undefined?<div className={styles.feedback} role="status"><strong>{chosen===current.answer?"Correct!":"Not quite."}</strong><p>{current.explanation}</p><button type="button" onClick={()=>{if(index===questions.length-1)onComplete({answers});setIndex(x=>x+1)}}>{index===questions.length-1?"See results":"Next question →"}</button></div>:null}</>}</div>;
}
function Connections({puzzle,onComplete}:{puzzle:ConnectionsPuzzle;onComplete:Completion}){
 const [round,setRound]=useState(0);
 const all=useMemo(()=>{
  // Vary order between rounds, but keep it deterministic during rendering.
  let seed=24813+round*9719;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const words=puzzle.groups.flatMap(g=>g.words);
  for(let i=words.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[words[i],words[j]]=[words[j],words[i]];}
  return words;
 },[round,puzzle]);
 const [selected,setSelected]=useState<string[]>([]),[solved,setSolved]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0),[notice,setNotice]=useState("");
 const completed=solved.length===puzzle.groups.length;
 const exhausted=mistakes>=4;
 const check=()=>{
  if(selected.length!==4||completed||exhausted)return;
  const group=puzzle.groups.find(g=>selected.every(w=>g.words.includes(w)));
  if(group&&!solved.includes(group.label)){const next=[...solved,group.label];setSolved(next);setNotice("Found: "+group.label+"!");if(next.length===puzzle.groups.length)onComplete({solved:next});}
  else{setMistakes(m=>m+1);setNotice("Not quite — compare the terms and try another group.");}
  setSelected([]);
 };
 const reset=()=>{setRound(x=>x+1);setSelected([]);setSolved([]);setMistakes(0);setNotice("")};
 return <div className={styles.playArea}>
  <div className={styles.smallStats}><span>{solved.length} / {puzzle.groups.length} groups found</span><span>{Math.max(0,4-mistakes)} mistakes left</span></div>
  {solved.map(label=>{const group=puzzle.groups.find(g=>g.label===label)!;return <div className={styles.solvedGroup} key={label}><strong>{label}</strong><span>{group.words.join(" · ")}</span></div>})}
  {completed||exhausted?<div className={styles.result}><h2>{completed?"Colony connected!":"Round complete"}</h2>
    <p>{completed?"All four categories found.":`You found ${solved.length} of four groups. Review the categories below, then try a fresh arrangement.`}</p>
    {exhausted&&puzzle.groups.filter(g=>!solved.includes(g.label)).map(g=><div className={styles.revealGroup} key={g.label}><strong>{g.label}</strong><span>{g.words.join(" · ")}</span></div>)}
    <button type="button" onClick={reset}>New arrangement ↻</button>
   </div>:<>
   <div className={styles.connectionGrid}>{all.filter(w=>!solved.some(label=>puzzle.groups.find(g=>g.label===label)?.words.includes(w))).map(word=><button type="button" aria-pressed={selected.includes(word)} key={word} onClick={()=>setSelected(old=>old.includes(word)?old.filter(x=>x!==word):old.length<4?[...old,word]:old)}>{word}</button>)}</div>
   <div className={styles.actions}><button type="button" disabled={selected.length!==4} onClick={check}>Submit group ({selected.length}/4)</button><button type="button" className={styles.secondary} disabled={!selected.length} onClick={()=>setSelected([])}>Clear selection</button></div>
   <p className={styles.feedbackText} role="status">{notice||"Find four terms that belong to the same category. Four incorrect submissions end the round."}</p>
  </>}
 </div>;
}
function Burrow({puzzle,onComplete}:{puzzle:BurrowPuzzle;onComplete:Completion}){
 const {answer:target,clue,note}=puzzle;
 const [guesses,setGuesses]=useState<string[]>([]),[entry,setEntry]=useState("");
 const won=guesses.includes(target),lost=guesses.length>=6&&!won;
 const submit=()=>{
  const word=entry.toUpperCase().trim();
  if(!/^[A-Z]{5}$/.test(word)||won||lost)return;
  const next=[...guesses,word];setGuesses(next);setEntry("");
  if(word===target)onComplete({guesses:next});
 };
 const restart=()=>{setGuesses([]);setEntry("");};
 const keyboard=new Map<string,ReturnType<typeof scoreWordGuess>[number]>();
 const rank:Record<ReturnType<typeof scoreWordGuess>[number],number>={absent:1,present:2,correct:3};
 guesses.forEach(guess=>scoreWordGuess(guess,target).forEach((result,i)=>{
  const key=guess[i],previous=keyboard.get(key);
  if(!previous||rank[result]>rank[previous])keyboard.set(key,result);
 }));
 return <div className={styles.playArea}>
  <div className={styles.stage}><small>FIVE LETTERS · SIX GUESSES</small><h2>Unearth the hidden term</h2><p><strong>Clue:</strong> {clue}</p></div>
  <div className={styles.guessGrid} aria-label="Word guesses">{Array.from({length:6},(_,r)=>{
   const guess=guesses[r]||"",results=guess?scoreWordGuess(guess,target):[];
   return <div className={styles.guessRow} key={r}>{Array.from({length:5},(_,c)=><span key={c} data-result={results[c]||""} aria-label={guess?(`Guess ${r+1}, ${guess[c]}, ${results[c]}`):`Guess ${r+1}, empty tile ${c+1}`}>{guess[c]||""}</span>)}</div>;
  })}</div>
  {won||lost?<div className={styles.result} role="status"><h2>{won?"You found it!":`The word was ${target}`}</h2><p>{note}</p><div className={styles.actions} style={{justifyContent:"center"}}><button type="button" onClick={restart}>Retry word ↻</button><Link className={styles.nextPuzzle} href="/fun-zone/word-burrow">More words →</Link></div></div>
  :<form className={styles.burrowForm} onSubmit={e=>{e.preventDefault();submit()}}>
   <label htmlFor="burrow-guess">Your guess</label>
   <input id="burrow-guess" value={entry} onChange={e=>setEntry(e.target.value.replace(/[^a-z]/gi,"").slice(0,5).toUpperCase())} maxLength={5} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="5 letters" aria-describedby="burrow-help"/>
   <button type="submit" disabled={entry.length!==5}>Guess →</button>
  </form>}
  <div className={styles.letterKeyboard} aria-label="Letter clues">{["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].map(row=><div key={row}>{[...row].map(letter=><span key={letter} data-result={keyboard.get(letter)||""}>{letter}</span>)}</div>)}</div>
  <p className={styles.footnote} id="burrow-help">Green: correct spot · Sage: in word, wrong spot · Gray: not in word. Repeated letters count only when present in the answer.</p>
 </div>;
}
function Crossword({puzzle,onComplete}:{puzzle:CrosswordPuzzle;onComplete:Completion}){
 const [answers,setAnswers]=useState<Record<number,string>>({}),[checked,setChecked]=useState(false);
 // Coordinates deliberately intersect at matching letters of the five answers.
 const places=puzzle.clues;
 // Use standard crossword numbering: entries that start in one square share its number.
 const starts=[...new Set(places.map(p=>p.r+":"+p.c))].sort((a,b)=>{
  const [ar,ac]=a.split(":").map(Number),[br,bc]=b.split(":").map(Number);
  return ar-br||ac-bc;
 });
 const clueNumbers=new Map(starts.map((start,i)=>[start,i+1]));
 const rows=Math.max(...places.map(p=>p.r+(p.dir==="down"?p.answer.length:1)));
 const columns=Math.max(...places.map(p=>p.c+(p.dir==="across"?p.answer.length:1)));
 const display=Array.from({length:rows},()=>Array.from({length:columns},()=>({open:false,char:"",number:0,conflict:false})));
 places.forEach((p,i)=>{
  const value=(answers[i]||"").toUpperCase();
  for(let j=0;j<puzzle.clues[i].answer.length;j++){
   const row=p.r+(p.dir==="down"?j:0),col=p.c+(p.dir==="across"?j:0);
   const cell=display[row][col];
   cell.open=true;
   if(value[j]){
    if(cell.char&&cell.char!==value[j])cell.conflict=true;
    else cell.char=value[j];
   }
   if(j===0)cell.number=clueNumbers.get(p.r+":"+p.c)||0;
  }
 });
 const conflicts=display.flat().filter(cell=>cell.conflict).length;
 const correct=puzzle.clues.filter((clue,i)=>(answers[i]||"").trim().toUpperCase()===clue.answer).length;
 const complete=correct===puzzle.clues.length&&conflicts===0;
 return <div className={styles.playArea}>
  <div className={styles.stage}><small>MINI CROSSWORD · FIVE CLUES</small><h2>{puzzle.title}</h2><p>Enter answers below. Crossing clues share letter squares; any conflicting entries are highlighted.</p></div>
  <div className={styles.crosswordBoard} style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}} aria-label="Crossword grid">{display.flatMap((row,r)=>row.map((cell,c)=><div key={r+"-"+c} className={cell.open?styles.crosswordCell:styles.crosswordBlank} data-conflict={cell.conflict?"true":undefined}>{cell.number?<small>{cell.number}</small>:null}{cell.char}</div>))}</div>
  <div className={styles.clues}>{puzzle.clues.map((clue,i)=>{
   const success=(answers[i]||"").toUpperCase()===clue.answer;
   return <label key={clue.answer}><span><strong>{clueNumbers.get(clue.r+":"+clue.c)} {places[i].dir}.</strong> {clue.clue}</span><input aria-label={`Answer to clue ${i+1}`} value={answers[i]||""} maxLength={clue.answer.length} autoComplete="off" spellCheck={false} onChange={e=>{setAnswers(a=>({...a,[i]:e.target.value.replace(/[^a-z]/gi,"").toUpperCase()}));setChecked(false)}} data-correct={checked&&success}/></label>;
  })}</div>
  <div className={styles.actions}><button type="button" onClick={()=>{setChecked(true);if(complete)onComplete({answers:puzzle.clues.map((_,i)=>answers[i]||"")})}}>Check answers</button><button type="button" className={styles.secondary} onClick={()=>{setAnswers({});setChecked(false)}}>Reset</button></div>
  {conflicts>0?<p className={styles.errorText} role="status">{conflicts} crossing {conflicts===1?"letter disagrees":"letters disagree"} between answers. Check the highlighted cells.</p>:null}
  {checked?<p className={styles.feedbackText} role="status">{complete?"All five correct! Crossword complete.":`${correct} of ${puzzle.clues.length} answers correct. ${conflicts?"Resolve the crossings too.":"Keep going!"}`}</p>:null}
 </div>;
}
export function PlayGame({game,challenge}:{game:Game;challenge:{gameKey:string;mode:string;puzzle:Puzzle}}){
 const {saved,record,retry}=usePuzzleCompletion(challenge.gameKey,challenge.puzzle.id);
 return <main className={styles.page}><div className={styles.wrap}>
  <nav className={styles.crumb}><Link href="/fun-zone">Fun Zone</Link><span>/</span><Link href={`/fun-zone/${game.key}`}>{game.title}</Link></nav>
  <header className={styles.hero}>
   <span className={styles.eyebrow}>PODSCAPE / FUN ZONE / {game.category.toUpperCase()}</span>
   <div className={styles.heroTitleRow}><div><h1>{challenge.puzzle.title}</h1><p>{challenge.puzzle.description}</p></div><span className={styles.difficulty}>{challenge.puzzle.difficulty}</span></div>
   <div className={styles.heroLinks}><Link href={`/fun-zone/${game.key}`}>All {game.title} puzzles</Link><Link href="/account/progress">Achievements</Link></div>
  </header>
  <div className={styles.notice}>Early-access challenge · Unique completions count toward EXP achievements · No Pod Coins</div>
  {challenge.mode==="connections"?<Connections puzzle={challenge.puzzle as ConnectionsPuzzle} onComplete={record}/>:
    challenge.mode==="burrow"?<Burrow puzzle={challenge.puzzle as BurrowPuzzle} onComplete={record}/>:
    challenge.mode==="crossword"?<Crossword puzzle={challenge.puzzle as CrosswordPuzzle} onComplete={record}/>:
    <Quiz puzzle={challenge.puzzle as QuizPuzzle} onComplete={record}/>}
  <PuzzleSaveStatus status={saved} retry={retry}/>
  <WorkspaceLinks items={[{href:`/fun-zone/${game.key}`,label:`More ${game.title}`},{href:"/fun-zone",label:"All games"},{href:"/ledger",label:"Leaf Ledger"}]}/>
 </div></main>;
}

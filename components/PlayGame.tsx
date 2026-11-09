"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {Game} from "@/lib/fun-zone-games";
import {connectionGroups,crosswordClues} from "@/lib/fun-zone-games";
import styles from "./PlayGame.module.css";
import {WorkspaceLinks} from "./PodscapeWorkspaceUI";

function Quiz({game}:{game:Game}){
 const [index,setIndex]=useState(0),[answers,setAnswers]=useState<number[]>([]);
 const questions=game.questions||[];
 const done=index>=questions.length;
 const score=answers.filter((value,i)=>value===questions[i].answer).length;
 const current=questions[index];
 const chosen=answers[index];
 return <div className={styles.playArea}>{done?<div className={styles.result}><span aria-hidden="true">✦</span><h2>Challenge complete!</h2><p>You answered {score} of {questions.length} correctly.</p><button onClick={()=>{setIndex(0);setAnswers([])}}>Try again ↻</button></div>:<><div className={styles.stage}><small>QUESTION {index+1} / {questions.length}</small><h2>{current.prompt}</h2></div><div className={styles.options}>{current.choices.map((choice,i)=><button type="button" disabled={chosen!==undefined} data-result={chosen===undefined?"":i===current.answer?"correct":i===chosen?"incorrect":""} key={choice} onClick={()=>setAnswers(a=>[...a,i])}>{choice}</button>)}</div>{chosen!==undefined?<div className={styles.feedback} role="status"><strong>{chosen===current.answer?"Correct!":"Not quite."}</strong><p>{current.explanation}</p><button type="button" onClick={()=>setIndex(x=>x+1)}>{index===questions.length-1?"See results":"Next question →"}</button></div>:null}</>}</div>;
}
function Connections(){
 const [round,setRound]=useState(0);
 const all=useMemo(()=>{
  // Vary order between rounds, but keep it deterministic during rendering.
  let seed=24813+round*9719;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const words=connectionGroups.flatMap(g=>g.words);
  for(let i=words.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[words[i],words[j]]=[words[j],words[i]];}
  return words;
 },[round]);
 const [selected,setSelected]=useState<string[]>([]),[solved,setSolved]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0),[notice,setNotice]=useState("");
 const completed=solved.length===connectionGroups.length;
 const exhausted=mistakes>=4;
 const check=()=>{
  if(selected.length!==4||completed||exhausted)return;
  const group=connectionGroups.find(g=>selected.every(w=>g.words.includes(w)));
  if(group&&!solved.includes(group.label)){setSolved(old=>[...old,group.label]);setNotice("Found: "+group.label+"!");}
  else{setMistakes(m=>m+1);setNotice("Not quite — compare the terms and try another group.");}
  setSelected([]);
 };
 const reset=()=>{setRound(x=>x+1);setSelected([]);setSolved([]);setMistakes(0);setNotice("")};
 return <div className={styles.playArea}>
  <div className={styles.smallStats}><span>{solved.length} / {connectionGroups.length} groups found</span><span>{Math.max(0,4-mistakes)} mistakes left</span></div>
  {solved.map(label=>{const group=connectionGroups.find(g=>g.label===label)!;return <div className={styles.solvedGroup} key={label}><strong>{label}</strong><span>{group.words.join(" · ")}</span></div>})}
  {completed||exhausted?<div className={styles.result}><h2>{completed?"Colony connected! ✦":"Round complete"}</h2>
    <p>{completed?"All four categories found.":`You found ${solved.length} of four groups. Review the categories below, then try a fresh arrangement.`}</p>
    {exhausted&&connectionGroups.filter(g=>!solved.includes(g.label)).map(g=><div className={styles.revealGroup} key={g.label}><strong>{g.label}</strong><span>{g.words.join(" · ")}</span></div>)}
    <button type="button" onClick={reset}>New arrangement ↻</button>
   </div>:<>
   <div className={styles.connectionGrid}>{all.filter(w=>!solved.some(label=>connectionGroups.find(g=>g.label===label)?.words.includes(w))).map(word=><button type="button" aria-pressed={selected.includes(word)} key={word} onClick={()=>setSelected(old=>old.includes(word)?old.filter(x=>x!==word):old.length<4?[...old,word]:old)}>{word}</button>)}</div>
   <div className={styles.actions}><button type="button" disabled={selected.length!==4} onClick={check}>Submit group ({selected.length}/4)</button><button type="button" className={styles.secondary} disabled={!selected.length} onClick={()=>setSelected([])}>Clear selection</button></div>
   <p className={styles.feedbackText} role="status">{notice||"Find four terms that belong to the same category. Four incorrect submissions end the round."}</p>
  </>}
 </div>;
}
const burrowRounds=[
 {answer:"HUMUS",clue:"Dark, decomposed organic matter found in soil and forest-floor substrate.",note:"Humus is well-decomposed organic matter. It isn't a shelter object, but forms part of the natural soil environment."},
 {answer:"COVER",clue:"Shelter or protection provided by leaves, bark and other hiding places.",note:"Leaf litter and bark offer cover from exposure and help create local microhabitats."},
 {answer:"FUNGI",clue:"Organisms that help break down dead plant matter in woodland habitats.",note:"Fungi contribute to decomposition. Isopods may interact with fungal growth as part of the detrital food web."}
] as const;
type TileResult="correct"|"present"|"absent";
function scoreGuess(guess:string,target:string):TileResult[]{
 const result:Array<TileResult>=Array(5).fill("absent");
 const available=new Map<string,number>();
 for(let i=0;i<5;i++){if(guess[i]===target[i])result[i]="correct";else available.set(target[i],(available.get(target[i])||0)+1);}
 for(let i=0;i<5;i++)if(result[i]!=="correct"){
  const count=available.get(guess[i])||0;
  if(count>0){result[i]="present";available.set(guess[i],count-1)}
 }
 return result;
}
function Burrow(){
 const [round,setRound]=useState(0);
 const {answer:target,clue,note}=burrowRounds[round%burrowRounds.length];
 const [guesses,setGuesses]=useState<string[]>([]),[entry,setEntry]=useState("");
 const won=guesses.includes(target),lost=guesses.length>=6&&!won;
 const submit=()=>{
  const word=entry.toUpperCase().trim();
  if(!/^[A-Z]{5}$/.test(word)||won||lost)return;
  setGuesses(g=>[...g,word]);setEntry("");
 };
 const restart=(next:boolean)=>{
  if(next)setRound(n=>(n+1)%burrowRounds.length);
  setGuesses([]);setEntry("");
 };
 const keyboard=new Map<string,TileResult>();
 const rank:Record<TileResult,number>={absent:1,present:2,correct:3};
 guesses.forEach(guess=>scoreGuess(guess,target).forEach((result,i)=>{
  const key=guess[i],previous=keyboard.get(key);
  if(!previous||rank[result]>rank[previous])keyboard.set(key,result);
 }));
 return <div className={styles.playArea}>
  <div className={styles.stage}><small>WORD {round+1} / {burrowRounds.length} · FIVE LETTERS · SIX GUESSES</small><h2>Unearth the hidden term</h2><p><strong>Clue:</strong> {clue}</p></div>
  <div className={styles.guessGrid} aria-label="Word guesses">{Array.from({length:6},(_,r)=>{
   const guess=guesses[r]||"",results=guess?scoreGuess(guess,target):[];
   return <div className={styles.guessRow} key={r}>{Array.from({length:5},(_,c)=><span key={c} data-result={results[c]||""} aria-label={guess?(`Guess ${r+1}, ${guess[c]}, ${results[c]}`):`Guess ${r+1}, empty tile ${c+1}`}>{guess[c]||""}</span>)}</div>;
  })}</div>
  {won||lost?<div className={styles.result} role="status"><h2>{won?"You found it! ✦":`The word was ${target}`}</h2><p>{note}</p><div className={styles.actions} style={{justifyContent:"center"}}><button type="button" onClick={()=>restart(false)}>Retry word ↻</button><button type="button" onClick={()=>restart(true)}>Next term →</button></div></div>
  :<form className={styles.burrowForm} onSubmit={e=>{e.preventDefault();submit()}}>
   <label htmlFor="burrow-guess">Your guess</label>
   <input id="burrow-guess" value={entry} onChange={e=>setEntry(e.target.value.replace(/[^a-z]/gi,"").slice(0,5).toUpperCase())} maxLength={5} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="5 letters" aria-describedby="burrow-help"/>
   <button type="submit" disabled={entry.length!==5}>Guess →</button>
  </form>}
  <div className={styles.letterKeyboard} aria-label="Letter clues">{["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].map(row=><div key={row}>{[...row].map(letter=><span key={letter} data-result={keyboard.get(letter)||""}>{letter}</span>)}</div>)}</div>
  <p className={styles.footnote} id="burrow-help">Green: correct spot · Sage: in word, wrong spot · Gray: not in word. Repeated letters count only when present in the answer.</p>
 </div>;
}
function Crossword(){
 const [answers,setAnswers]=useState<Record<number,string>>({}),[checked,setChecked]=useState(false);
 // A real connected mini crossword; coordinates are row, column, orientation.
 const places=[{r:6,c:1,dir:"across"},{r:1,c:3,dir:"down"},{r:3,c:2,dir:"down"},{r:4,c:0,dir:"across"},{r:2,c:2,dir:"across"}] as const;
 const display=Array.from({length:7},()=>Array.from({length:6},()=>({open:false,char:"",number:0})));
 places.forEach((p,i)=>{const value=(answers[i]||"").toUpperCase();for(let j=0;j<crosswordClues[i].answer.length;j++){const row=p.r+(p.dir==="down"?j:0),col=p.c+(p.dir==="across"?j:0);if(row>=0&&row<7&&col>=0&&col<6){display[row][col].open=true;if(value[j])display[row][col].char=value[j];if(j===0)display[row][col].number=i+1;}}});
 const correct=crosswordClues.filter((c,i)=>(answers[i]||"").trim().toUpperCase()===c.answer).length;
 return <div className={styles.playArea}><div className={styles.stage}><small>MINI CROSSWORD · FIVE CLUES</small><h2>Keeper&apos;s Vocabulary</h2><p>Fill the intersecting words from the clues below.</p></div>
 <div className={styles.crosswordBoard} aria-label="Crossword grid">{display.flatMap((row,r)=>row.map((cell,c)=><div key={r+"-"+c} className={cell.open?styles.crosswordCell:styles.crosswordBlank}>{cell.number?<small>{cell.number}</small>:null}{cell.char}</div>))}</div>
 <div className={styles.clues}>{crosswordClues.map((clue,i)=>{const success=(answers[i]||"").toUpperCase()===clue.answer;return <label key={clue.answer}><span><strong>{i+1} {places[i].dir}.</strong> {clue.clue}</span><input aria-label={`Answer to clue ${i+1}`} value={answers[i]||""} maxLength={clue.answer.length} onChange={e=>{setAnswers(a=>({...a,[i]:e.target.value.replace(/[^a-z]/gi,"").toUpperCase()}));setChecked(false)}} data-correct={checked&&success}/></label>})}</div>
 <div className={styles.actions}><button onClick={()=>setChecked(true)}>Check answers</button><button className={styles.secondary} onClick={()=>{setAnswers({});setChecked(false)}}>Reset</button></div>{checked?<p className={styles.feedbackText} role="status">{correct===crosswordClues.length?"All five correct! Crossword complete. ✦":`${correct} of ${crosswordClues.length} correct. Keep going!`}</p>:null}</div>;
}
export function PlayGame({game}:{game:Game}){
 return <main className={styles.page}><div className={styles.wrap}><nav className={styles.crumb}><Link href="/fun-zone">Fun Zone</Link><span>/</span><Link href={`/fun-zone/${game.key}`}>{game.title}</Link></nav><header className={styles.hero}><span className={styles.eyebrow}>{game.category} / Sample 01</span><h1>{game.puzzleTitle}</h1><p>{game.description}</p></header><div className={styles.notice}>Practice puzzle · No EXP or Pod Coins awarded · Results are not saved to your account</div>{game.mode==="connections"?<Connections/>:game.mode==="burrow"?<Burrow/>:game.mode==="crossword"?<Crossword/>:<Quiz game={game}/>}<WorkspaceLinks items={[{href:`/fun-zone/${game.key}`,label:`More ${game.title}`},{href:"/fun-zone",label:"All games"},{href:"/ledger",label:"Leaf Ledger"}]}/></div></main>;
}

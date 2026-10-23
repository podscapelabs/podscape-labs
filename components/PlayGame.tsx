"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import type {Game} from "@/lib/fun-zone-games";
import {connectionGroups,crosswordClues} from "@/lib/fun-zone-games";
import styles from "./PlayGame.module.css";

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
 const all=useMemo(()=>[...connectionGroups.flatMap(g=>g.words)].sort((a,b)=>{const hash=(s:string)=>s.split("").reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);return hash(a)-hash(b)}),[]);
 const [selected,setSelected]=useState<string[]>([]),[solved,setSolved]=useState<string[]>([]),[mistakes,setMistakes]=useState(0),[notice,setNotice]=useState("");
 const completed=solved.length===4;
 const check=()=>{
  const group=connectionGroups.find(g=>selected.every(w=>g.words.includes(w)));
  if(group){setSolved(old=>[...old,group.label]);setNotice("Found: "+group.label+"!");}
  else{setMistakes(m=>m+1);setNotice("Not quite — try a different group of four.");}
  setSelected([]);
 };
 const reset=()=>{setSelected([]);setSolved([]);setMistakes(0);setNotice("")};
 return <div className={styles.playArea}><div className={styles.smallStats}><span>{solved.length} / 4 groups found</span><span>{mistakes} guesses missed</span></div>
 {solved.map(label=>{const group=connectionGroups.find(g=>g.label===label)!;return <div className={styles.solvedGroup} key={label}><strong>{label}</strong><span>{group.words.join(" · ")}</span></div>})}
 {completed?<div className={styles.result}><h2>Colony connected! ✦</h2><p>You found all four hidden groups.</p><button onClick={reset}>Play again ↻</button></div>:<><div className={styles.connectionGrid}>{all.filter(w=>!solved.some(label=>connectionGroups.find(g=>g.label===label)?.words.includes(w))).map(word=><button type="button" aria-pressed={selected.includes(word)} key={word} onClick={()=>setSelected(old=>old.includes(word)?old.filter(x=>x!==word):old.length<4?[...old,word]:old)}>{word}</button>)}</div><div className={styles.actions}><button disabled={selected.length!==4} onClick={check}>Submit group ({selected.length}/4)</button><button className={styles.secondary} onClick={()=>setSelected([])}>Clear selection</button></div><p className={styles.feedbackText} role="status">{notice||"Find four terms with one thing in common."}</p></>}</div>;
}
function Burrow(){
 const target="MOSSY";
 const [guesses,setGuesses]=useState<string[]>([]),[entry,setEntry]=useState("");
 const won=guesses.includes(target),lost=guesses.length>=6&&!won;
 const submit=()=>{const word=entry.toUpperCase().trim();if(word.length!==5||! /^[A-Z]+$/.test(word)||won||lost)return;setGuesses(g=>[...g,word]);setEntry("")};
 return <div className={styles.playArea}><div className={styles.stage}><small>FIVE LETTERS · SIX GUESSES</small><h2>Find the hidden habitat word</h2><p>Think of a place where tiny isopods might shelter.</p></div><div className={styles.guessGrid}>{Array.from({length:6},(_,r)=>{const guess=guesses[r]||"";return <div className={styles.guessRow} key={r}>{Array.from({length:5},(_,c)=>{const letter=guess[c]||"";const result=!letter?"":target[c]===letter?"correct":target.includes(letter)?"present":"absent";return <span key={c} data-result={result}>{letter}</span>})}</div>})}</div>
 {won||lost?<div className={styles.result}><h2>{won?"You found it! ✦":"The word was MOSSY"}</h2><p>{won?"A mossy microhabitat can provide cover and hold moisture.":"Try the challenge again and look for the habitat clue."}</p><button onClick={()=>{setGuesses([]);setEntry("")}}>Play again ↻</button></div>:<form className={styles.burrowForm} onSubmit={e=>{e.preventDefault();submit()}}><label htmlFor="burrow-guess">Your guess</label><input id="burrow-guess" value={entry} onChange={e=>setEntry(e.target.value.replace(/[^a-z]/gi,"").slice(0,5).toUpperCase())} maxLength={5} autoComplete="off" autoCapitalize="characters" placeholder="5 letters"/><button disabled={entry.length!==5}>Guess →</button></form>}<p className={styles.footnote}>Green: right position · Sage: right letter, wrong place</p></div>;
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
 return <main className={styles.page}><div className={styles.wrap}><nav className={styles.crumb}><Link href="/fun-zone">Fun Zone</Link><span>/</span><Link href={`/fun-zone/${game.key}`}>{game.title}</Link></nav><header className={styles.hero}><span className={styles.eyebrow}>{game.category} / Sample 01</span><h1>{game.puzzleTitle}</h1><p>{game.description}</p></header><div className={styles.notice}>Practice puzzle · No EXP or Pod Coins awarded · Results are not saved to your account</div>{game.mode==="connections"?<Connections/>:game.mode==="burrow"?<Burrow/>:game.mode==="crossword"?<Crossword/>:<Quiz game={game}/>}<Link className={styles.back} href={`/fun-zone/${game.key}`}>← All {game.title} puzzles</Link></div></main>;
}

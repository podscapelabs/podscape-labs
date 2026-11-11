import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path,imports={}){
 const output=ts.transpileModule(source(path),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const mod={exports:{}};
 runInNewContext(output,{module:mod,exports:mod.exports,require:(name)=>{
  if(!(name in imports))throw new Error("Unexpected dependency "+name);
  return imports[name];
 }},{filename:path});
 return mod.exports;
}
const gameModule=load("lib/fun-zone-games.ts");
const catalog=load("lib/fun-zone-puzzles.ts",{"./fun-zone-games":gameModule});
const logic=load("lib/fun-zone-logic.ts");
const entries=catalog.puzzleEntries;
assert.equal(entries.length,32,"Exactly 32 curated puzzles must exist");
assert.equal(catalog.gameKeys.length,8,"Eight game libraries must exist");

const expectedModes=new Map(gameModule.games.map(g=>[g.key,g.mode]));
expectedModes.set("word-search","search");
const usedIds=new Set();
let questionCount=0;
for(const gameKey of catalog.gameKeys){
 const challenges=catalog.getPuzzles(gameKey);
 assert.equal(challenges.length,4,`Expected 4 puzzles for ${gameKey}`);
 assert.equal(challenges[0].puzzle.id,gameKey==="word-search"?"genus-explorer":"sample-01");
 challenges.forEach(({mode,puzzle},i)=>{
  assert.equal(mode,expectedModes.get(gameKey),`Wrong mode for ${gameKey}`);
  const key=gameKey+"/"+puzzle.id;
  assert.ok(!usedIds.has(key),"Duplicate puzzle ID "+key);
  usedIds.add(key);
  assert.ok(puzzle.title.length>=4&&puzzle.description.length>=12,"Missing copy "+key);
  assert.ok(["Intro","Medium","Easy"].includes(puzzle.difficulty),"Unexpected difficulty "+key);
  if(mode==="quiz"){
   assert.ok(puzzle.questions.length>=4,"Not enough questions "+key);
   questionCount+=puzzle.questions.length;
   for(const q of puzzle.questions){
    assert.ok(q.prompt.endsWith("?"),"Quiz prompt must end with ? "+key);
    assert.equal(q.choices.length,4,"Quiz must have four answers "+key);
    assert.equal(new Set(q.choices).size,4,"Repeated answer choices "+key);
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,"Bad answer index "+key);
    assert.ok(q.explanation.length>=25,"Missing explanation "+key);
   }
  }else if(mode==="burrow"){
   assert.match(puzzle.answer,/^[A-Z]{5}$/);
   assert.ok(puzzle.clue.endsWith("."),"A complete clue must end in a period "+key);
  }else if(mode==="connections"){
   assert.equal(puzzle.groups.length,4);
   const terms=puzzle.groups.flatMap(g=>g.words);
   assert.ok(puzzle.groups.every(g=>g.words.length===4&&g.label.length>3));
   assert.equal(new Set(terms).size,16,"Overlapping Connections groups "+key);
  }else if(mode==="crossword"){
   const cells=new Map(),expected=new Set();
   const membership=new Map();
   puzzle.clues.forEach((clue,index)=>{
    assert.match(clue.answer,/^[A-Z]+$/);
    assert.ok(clue.clue.includes("("+clue.answer.length+")"),"Incorrect clue length "+key);
    expected.add(clue.dir+":"+clue.r+":"+clue.c+":"+clue.answer);
    for(let i=0;i<clue.answer.length;i++){
     const r=clue.r+(clue.dir==="down"?i:0),col=clue.c+(clue.dir==="across"?i:0);
     assert.ok(r>=0&&col>=0&&r<8&&col<13,"Crossword clipping "+key);
     const pos=r+":"+col;
     if(cells.has(pos))assert.equal(cells.get(pos),clue.answer[i],"Crossword mismatch "+key);
     cells.set(pos,clue.answer[i]);
     membership.set(pos,[...(membership.get(pos)||[]),index]);
    }
   });
   const actual=new Set();
   for(const dir of ["across","down"]){
    const dr=dir==="down"?1:0,dc=dir==="across"?1:0;
    for(const pos of cells.keys()){
     const [r,c]=pos.split(":").map(Number);
     if(cells.has((r-dr)+":"+(c-dc)))continue;
     let word="",rr=r,cc=c;
     while(cells.has(rr+":"+cc)){word+=cells.get(rr+":"+cc);rr+=dr;cc+=dc;}
     if(word.length>=2){
      const entry=dir+":"+r+":"+c+":"+word;
      assert.ok(expected.has(entry),"Unclued ghost word "+entry+" in "+key);
      actual.add(entry);
     }
    }
   }
   assert.equal(actual.size,puzzle.clues.length,"Every crossword answer must be a full clued run "+key);
   const connected=new Set([0]);
   while(true){
    const prior=connected.size;
    for(const indices of membership.values())if(indices.some(i=>connected.has(i)))
     indices.forEach(i=>connected.add(i));
    if(prior===connected.size)break;
   }
   assert.equal(connected.size,puzzle.clues.length,"Crossword must be one connected grid "+key);
  }else if(mode==="search"){
   assert.equal(puzzle.words.length,8);
   assert.equal(new Set(puzzle.words).size,8);
   const {grid,locations}=logic.makeWordSearchPuzzle(puzzle.words,puzzle.size,puzzle.seed);
   assert.equal(grid.length,puzzle.size);
   for(const word of puzzle.words){
    assert.equal(locations[word].length,word.length);
    assert.equal(locations[word].map(k=>{const [r,c]=k.split("-").map(Number);return grid[r][c]}).join(""),word,"Broken word search "+key);
   }
  }
 });
}
assert.equal(usedIds.size,32);
assert.ok(questionCount>=70,"Expected deep, varied quiz banks");

// Repeated letters must never be over-counted.
assert.equal(JSON.stringify(logic.scoreWordGuess("PAPAL","APPLE")),JSON.stringify(["present","present","correct","absent","present"]));
assert.equal(JSON.stringify(logic.scoreWordGuess("HUMUS","HUMUS")),JSON.stringify(["correct","correct","correct","correct","correct"]));


// Every word-based game must share stable feedback meanings, independent
// of visual theme palettes. Verify contrast and non-colour indicators.
const feedbackTokens=source("app/globals.css");
const gameUi=source("components/PlayGame.module.css");
const gameLogicUi=source("components/PlayGame.tsx");
const wordSearchUi=source("app/fun-zone/word-search/game.module.css");
const wordSearchLogic=source("app/fun-zone/word-search/GenusWordSearch.tsx");
const gameColors={};
for(const role of ["correct","present","absent","incorrect","state-text"]){
 const token="--game-"+role;
 const match=feedbackTokens.match(new RegExp(token+"\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;"));
 assert.ok(match,"Missing theme-independent word game token "+token);
 gameColors[role]=match[1];
}
function gameLuminance(hex){
 const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const mapped=channels.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return mapped[0]*.2126+mapped[1]*.7152+mapped[2]*.0722;
}
function gameContrast(a,b){
 const x=gameLuminance(a),y=gameLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
for(const role of ["correct","present","absent","incorrect"]){
 assert.ok(gameContrast(gameColors[role],gameColors["state-text"])>=4.5,
  "Game state text contrast fails AA for "+role);
}
for(const state of ["correct","present","absent"]){
 assert.ok(gameUi.includes('.guessRow>span[data-result="'+state+'"]'),"Missing Burrow tile state "+state);
 assert.ok(gameUi.includes('.letterKeyboard span[data-result="'+state+'"]'),"Missing keyboard state "+state);
 assert.ok(gameUi.includes('.gameLegendSwatch[data-result="'+state+'"]'),"Missing visible legend "+state);
}
for(const marker of ['content:"✓"','content:"●"','content:"×"']){
 assert.ok(gameUi.includes(marker),"Word tiles need a non-colour symbol "+marker);
}
assert.match(gameLogicUi,/Green: correct position/);
assert.match(gameLogicUi,/Amber: in the word, wrong position/);
assert.match(gameLogicUi,/Slate: not in the word/);
assert.match(gameLogicUi,/in word, wrong position/,"Word Burrow key needs accessible feedback");
assert.match(gameUi,/\.options button\[data-result="correct"\]/,"Quizzes need clear correct answer feedback");
assert.match(gameUi,/\.options button\[data-result="incorrect"\]/,"Quizzes need clear incorrect answer feedback");
assert.match(gameUi,/\.connectionGrid button\[aria-pressed="true"\]/,"Connections must distinguish selected words");
assert.match(gameUi,/\.solvedGroup strong::before/,"Connections solved groups need a success symbol");
assert.match(gameUi,/\.crosswordCell\[data-conflict="true"\]::after/,"Crossword conflicts need a symbol");
for(const selector of [".cell.solved",".cell.selected",".cell.hinted",".words .done"]){
 assert.ok(wordSearchUi.includes(selector),"Word Search feedback must have a distinct state: "+selector);
}
assert.ok(wordSearchLogic.includes('", found word"'),"Word Search cells must announce solved status");

const migration=source("supabase/migrations/20261109190000_fun_zone_puzzle_achievements.sql");
assert.match(migration,/primary key\(user_id,game_key,puzzle_id\)/);
assert.match(migration,/p_previous_puzzle_id/);
assert.match(migration,/grant execute on function public\.record_member_puzzle_completion\(uuid,text,text,text\) to service_role/i);
assert.match(migration,/coin_delta\)\s*values\([^;]+,0\)/);
const endpoint=source("app/api/progress/puzzle-complete/route.ts");
assert.match(endpoint,/getPuzzle\(gameKey,puzzleId\)/);
assert.match(endpoint,/validProof\(challenge.mode,challenge.puzzle,proof\)/);
assert.match(endpoint,/p_previous_puzzle_id:previousPuzzleId/);
const toast=source("components/AchievementToast.tsx");
const hook=source("components/usePuzzleCompletion.tsx");
assert.match(toast,/podscape:achievement-unlocked/);
assert.match(toast,/createPortal\(/);
assert.match(hook,/announceAchievement/);
assert.match(hook,/router\.refresh\(\)/);
console.log(`Fun Zone checks passed: ${catalog.gameKeys.length} games, ${entries.length} puzzles, ${questionCount} quiz questions, all search layouts, crossings, word scoring, award guards and toast wiring.`);

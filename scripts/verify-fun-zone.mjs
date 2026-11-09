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
   const cells=new Map(),vertical=new Set(),horizontal=new Set();
   puzzle.clues.forEach(c=>{
    assert.match(c.answer,/^[A-Z]+$/);
    assert.ok(c.clue.includes("("+c.answer.length+")"),"Missing correct word-length clue "+key);
    for(let i=0;i<c.answer.length;i++){
     const r=c.r+(c.dir==="down"?i:0),col=c.c+(c.dir==="across"?i:0);
     assert.ok(r>=0&&col>=0&&r<8&&col<13,"Crossword clipping "+key);
     const pos=r+":"+col;
     if(cells.has(pos))assert.equal(cells.get(pos),c.answer[i],"Crossword mismatch "+key);
     cells.set(pos,c.answer[i]);
     (c.dir==="down"?vertical:horizontal).add(pos);
    }
   });
   assert.ok([...vertical].some(pos=>horizontal.has(pos)),"Crossword must intersect "+key);
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

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const puzzles=read("lib/fun-zone-puzzles.ts");
const games=read("lib/fun-zone-games.ts");
const lessons=read("lib/fun-zone-learning.ts");
const library=read("components/PuzzleLibrary.tsx");
const play=read("components/PlayGame.tsx");
const listPage=read("app/fun-zone/[game]/page.tsx");
const playPage=read("app/fun-zone/[game]/[puzzle]/page.tsx");
const progress=read("lib/fun-zone-progress.ts");
const portal=read("app/fun-zone/FunZonePortal.tsx");
const categoryCss=read("app/fun-zone/fun-zone-portal.module.css");
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const names=["crossword-colony","colony-connections","word-burrow","species-detective","keepers-challenge","word-of-the-week","species-quiz","word-search"];
const ids=[...puzzles.matchAll(/(?:quiz|burrow|connections|crossword|search)\("([a-z0-9-]+)","/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"Authored puzzle IDs must stay unique");
for(const id of ["field-marks","taxonomy-desk","compare-the-keepers","humidity-check","feeding-decisions","troubleshooting","manca","body-parts","molting","forest-floor","respiration","classification","leaf-matter","shelter","decomposers","parts-and-places","names-and-needs","life-in-litter","anatomy-clues","forest-words","keeper-words","leaf-litter","keeper-essentials","anatomy-terms","genus-explorer"]){
 assert.ok(ids.includes(id),"A legacy puzzle ID was deleted: "+id);
}
assert.match(puzzles,/const baseEntries:Entry\[\]=\[\.\.\.sample,\.\.\.extra,\.\.\.extension\]/,"New puzzles must append after old ones");
for(const name of names){
 const count=[...lessons.matchAll(new RegExp('"'+name+'":\\[([\\s\\S]*?)\\n \\]',"g"))][0];
 assert.ok(count,"Learning notes missing for "+name);
 const items=[...count[1].matchAll(/^\s+"[^"]+"[,\s]*$/gm)];
 assert.equal(items.length,5,"Every game needs five graduated lessons: "+name);
 assert.ok(categoryCss.includes(".learningTrail"),"Starter trail must stay visible and theme-aware");
}
assert.match(puzzles,/quiz\("manca","Young Isopods"/,"Second vocabulary level must be about young isopods");
assert.match(puzzles,/search\("genus-explorer","First Finds"/,"Starter word-search must not open with scientific genera");
assert.match(puzzles,/answer:"HOLES"/,"Starter crossword must use familiar words");
assert.match(puzzles,/crossword\("science-crossword","The Science Trail"/,"Expert crossword must exist");
assert.match(puzzles,/search\("genera-field-guide","Scientific Names"/,"Advanced genus search must come later");
assert.match(puzzles,/burrow\("sample-01",game\.puzzleTitle,"WATER"/,"Starter word game must use a familiar term");
assert.match(puzzles,/answer:\(q\.answer\+shift\)%4/,"Correct choices should rotate deterministically");
assert.match(puzzles,/seenQuizPrompts\.has\(prompt\)/,"Repeated quiz questions should fail validation");
assert.match(puzzles,/seenPuzzles\.has\(key\)/,"Identical puzzles should fail validation");
assert.match(puzzles,/new Set\(words\)\.size!==words\.length/,"Repeated word-search entries should fail validation");
assert.match(puzzles,/seenSearchWords\.has\(word\)/,"Word Search solutions should not repeat across levels");
assert.match(puzzles,/new Set\(ids\)\.size!==ids\.length/,"Duplicate completion IDs should fail validation");
assert.match(puzzles,/const levelNames=\["Starter","Familiar","Explorer","Practiced","Specialist","Expert"\]/,"Difficulty must follow a clear learning curve");
const prompts=[...puzzles.matchAll(/\bQ\("([^"]+)"/g),...games.matchAll(/prompt:"([^"]+)"/g)].map(m=>normalize(m[1]));
assert.equal(new Set(prompts).size,prompts.length,"No verbatim duplicated questions across games");
const searches=[...puzzles.matchAll(/search\("([a-z0-9-]+)","[^"]+",\[([^\]]+)\]/g)];
for(const match of searches){
 const terms=[...match[2].matchAll(/"([A-Z]+)"/g)].map(m=>m[1]);
 assert.equal(terms.length,8,"Word search must have eight words: "+match[1]);
 assert.equal(new Set(terms).size,terms.length,"Search words must be unique: "+match[1]);
 assert.ok(terms.every(w=>w.length<=16),"Search terms must fit the board");
}
const words=[...puzzles.matchAll(/burrow\("([a-z0-9-]+)","[^"]+","([A-Z]{5})"/g)].map(m=>m[2]);
assert.equal(new Set(words).size,words.length,"Do not recycle Word Burrow answers");
assert.match(listPage,/getFunZoneLearningNote\(game\.key,index\)/);
assert.match(playPage,/getFunZoneLearningNote\(game,getPuzzles\(game\)\.findIndex/);
assert.match(library,/Your learning path/);
assert.match(play,/Before you play/);
assert.match(portal,/Start simple\. Learn as you play/);
assert.match(portal,/\/fun-zone\/species-quiz/);
assert.match(portal,/\/fun-zone\/word-of-the-week/);
assert.match(progress,/completed\.has\(challenges\[index-1\]\.puzzle\.id\)/,"Existing sequential unlock rules must remain");
console.log("Fun Zone learning and puzzle uniqueness checks passed: five staged lessons per game, legacy IDs preserved.");

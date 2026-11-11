import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const modal=read("components/RankingModal.tsx");
const css=read("components/RankingModal.module.css");
const cases=[
 {label:"Arcade",path:"app/fun-zone/leaderboard/Leaderboard.tsx",rules:"Rules, rewards & achievements",privacy:"Ranking name privacy",board:"styles.standings",score:"styles.rewardTable",join:"Join rankings"},
 {label:"Lifetime EXP",path:"app/account/progress/rankings/LifetimeExpRankings.tsx",rules:"How lifetime rankings work",privacy:"Lifetime ranking privacy",board:"styles.board",score:"styles.explainer",join:"Join rankings"},
 {label:"Market",path:"app/fun-zone/pod-exchange/rankings/MarketRankings.tsx",rules:"Rules & market achievements",privacy:"Market ranking privacy",board:"styles.rankings",score:"styles.achievementHint",join:"Join rankings"}
];
assert.match(modal,/<dialog ref=\{dialog\}/,"Use native dialog for focus and Escape handling");
assert.match(modal,/showModal\(\)/,"Dialog must be interactive");
assert.match(modal,/dialog\.current\?\.close\(\)/,"Dialog must close reliably");
assert.match(modal,/triggerButton\.current\?\.focus\(\)/,"Focus must return to the trigger");
assert.match(css,/max-height:min\(86dvh,780px\)/,"Modal must fit the viewport");
assert.match(css,/overflow-y:auto/,"Long rules must scroll inside popup");
for(const item of cases){
 const code=read(item.path);
 const rulesPos=code.indexOf('trigger="'+item.rules+'"');
 const boardPos=code.indexOf("className={"+item.board+"}");
 assert.ok(rulesPos>=0&&rulesPos<boardPos,item.label+" help button must appear before standings");
 assert.ok(code.includes('title="'+item.privacy+'"'),item.label+" privacy needs a popup");
 assert.ok(code.includes("Hide my username"),item.label+" anonymity control must remain available");
 assert.ok(code.includes(item.score),item.label+" original explanation or rewards must remain");
 assert.ok(code.includes(item.join),item.label+" joining the leaderboard must remain prominent");
 assert.equal((code.match(/<RankingModal/g)||[]).length,(code.match(/<\/RankingModal>/g)||[]).length,item.label+" popups must be closed");
 assert.ok(!code.includes("<details"),item.label+" must not render long collapsible page sections");
}
assert.match(read("app/fun-zone/leaderboard/Leaderboard.tsx"),/board\.awards\.map/,"Arcade reward history must remain available");
assert.match(read("app/fun-zone/pod-exchange/rankings/MarketRankings.tsx"),/requestReview/,"Legacy investor review path must remain intact");
assert.match(read("app/account/progress/rankings/LifetimeExpRankings.tsx"),/Molt & Prestige/,"Molt explanations must not disappear");
console.log("Ranking page condensation checks passed.");

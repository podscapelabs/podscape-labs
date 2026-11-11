import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const migration=read("supabase/migrations/202611110007_ranking_username_privacy.sql");
const routes=[
 {label:"Arcade",path:"app/api/fun-zone/rankings/route.ts",table:"fun_zone_ranking_preferences",alias:"Anonymous Keeper"},
 {label:"Lifetime EXP",path:"app/api/progress/rankings/route.ts",table:"member_exp_ranking_preferences",alias:"Anonymous Keeper"},
 {label:"Market",path:"app/api/fun-zone/pod-exchange/rankings/route.ts",table:"member_exchange_ranking_preferences",alias:"Anonymous Investor"}
];
const pages=[
 "app/fun-zone/leaderboard/Leaderboard.tsx",
 "app/account/progress/rankings/LifetimeExpRankings.tsx",
 "app/fun-zone/pod-exchange/rankings/MarketRankings.tsx"
];
for(const table of routes.map(r=>r.table)){
 assert.match(migration,new RegExp("alter table public\\."+table+"\\s+add column if not exists hide_username boolean not null default false"),table+" must default to visible names");
}
for(const r of routes){
 const source=read(r.path);
 assert.match(source,/hide_username/,"Missing database privacy column in "+r.label);
 assert.match(source,new RegExp('"'+r.alias+'"'),"Missing server-side anonymous name in "+r.label);
 assert.match(source,/hideUsername/,"Missing privacy preference from API response in "+r.label);
 assert.match(source,/typeof .*hideUsername.*===?"boolean"/,"Privacy setting should be validated as boolean in "+r.label);
 assert.match(source,/user\.id/,"Only the authenticated account may update privacy in "+r.label);
 assert.match(source,/Cache-Control.*no-store/,"Public name privacy requires no-store cache in "+r.label);
}
for(const path of pages){
 const source=read(path);
 assert.match(source,/Hide my username/,"Missing participant privacy control in "+path);
 assert.match(source,/checked=\{(?:board|data)\.hideUsername===true\}/,"Privacy setting must be a controlled input in "+path);
 assert.match(source,/disabled=\{updating\|\|loading\}/,"Toggle must disable during persistence in "+path);
 assert.match(source,/JSON\.stringify\(\{hideUsername\}\)/,"Toggle should save independently of participation in "+path);
}
assert.match(read("supabase/migrations/202611110008_automatic_rankings_and_legacy_wallet_audits.sql"),/reward_opted_in_at/,"Automatic Arcade ranking rewards require a recorded start");
assert.match(read("app/api/fun-zone/pod-exchange/rankings/route.ts"),/hiddenIds\.has\(wallet\.user_id\)/,"Market names must be masked before leaderboard JSON");
console.log("Ranking name privacy checks passed for Arcade, Lifetime EXP and Market Rankings.");

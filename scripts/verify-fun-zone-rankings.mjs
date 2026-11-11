import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const schema=read("supabase/migrations/202611110002_fun_zone_rankings.sql");
const api=read("app/api/fun-zone/rankings/route.ts");
const ui=read("app/fun-zone/leaderboard/Leaderboard.tsx");
const portal=read("app/fun-zone/FunZonePortal.tsx");
const awards=read("supabase/migrations/202611110003_ranking_rewards.sql");
const catalog=read("data/achievement-catalog.ts");
const cron=read("app/api/cron/ranking-awards/route.ts");
const vercel=JSON.parse(read("vercel.json"));
const progress=read("app/account/progress/ProgressDashboard.tsx");
const puzzle=read("app/api/progress/puzzle-complete/route.ts");
for(const period of ["daily","weekly","monthly","all-time"]){
 assert.ok(api.includes('"'+period+'"'),"Missing period API: "+period);
 assert.ok(ui.includes('"'+period+'"'),"Missing period UI: "+period);
 assert.ok(schema.includes("'"+period+"'"),"Missing period SQL: "+period);
}
assert.match(schema,/date_trunc\('week'/,"Weekly rankings must use a calendar week, not the last seven days");
assert.match(schema,/at time zone 'UTC'/,"Period boundaries must use UTC");
assert.match(schema,/join public\.fun_zone_ranking_preferences/,"Only opted-in members may appear");
assert.match(schema,/public_enabled=true/,"Consent is required for inclusion");
assert.match(schema,/member_puzzle_completions/,"Rankings must use verified puzzle completions");
assert.match(schema,/rank\(\) over/,"Tied scores must share ranks");
assert.match(schema,/grant execute on function public\.get_fun_zone_rankings.*to service_role/,"Rankings RPC must be server-only");
assert.match(api,/getSupabaseAdmin/,"Use server-side DB access for ranking data");
assert.match(api,/customerSupabase/,"Preference updates must authenticate users");
assert.match(api,/user\.email_confirmed_at/,"Only verified accounts can opt in");
assert.match(api,/validGames/,"Games must use canonical Arcade registry");
assert.match(api,/game\.key!=="pod-exchange"/,"Unverified market wallets are excluded");
assert.match(ui,/setPublic/,"Users must control public participation");
assert.match(ui,/HOW TO ENTER/,"Leaderboard must explain how participation works");
assert.match(ui,/gameEntryGuides/,"Each selected game needs an explanation of its completion criteria");
assert.match(ui,/selectedGame\?\.href/,"Game-specific ranking guidance must link to the actual game");
assert.match(ui,/first completion of each puzzle counts/,"Replays must not be presented as repeat scoring opportunities");
assert.match(ui,/Each puzzle counts in the period when it was first completed/,"Ranking date handling must be transparent");

assert.match(ui,/entries\.slice\(0,3\)/,"Podium must display at most three people");
assert.match(ui,/100 per unique/,"Point attribution must be transparent");
assert.match(portal,/\/fun-zone\/leaderboard/,"Fun Zone must link to the rankings page");
for(const key of ["ranking_first_podium","ranking_weekly_champion","ranking_three_wins","ranking_alltime_top"]){
 assert.ok(catalog.includes('key:"'+key+'"'),"Missing ranking achievement: "+key);
 assert.ok(awards.includes("'"+key+"'"),"Ranking achievement is not linked to settlement: "+key);
}
assert.match(awards,/pg_advisory_xact_lock/,"Ranking settlement must be serialized");
assert.match(awards,/fun_zone_ranking_settlements/,"Closed ranking periods must be settled only once");
assert.match(awards,/on conflict do nothing/,"Awards must be idempotent");
assert.match(awards,/member_progress_events/,"Every EXP payout needs a unique progress event");
assert.match(awards,/at time zone 'UTC'/,"Closed ranking boundaries must use UTC");
assert.match(awards,/count\(distinct \(period_key,period_start\)\)/,"Three-Peat must use distinct seasons");
assert.match(awards,/v_exp-v_prior/,"All-time improvements must pay only the difference");
assert.match(awards,/v_game_awards>=2/,"Limit individual game EXP awards");
assert.match(cron,/process\.env\.CRON_SECRET/,"The scheduled settlement must require a server secret");
assert.ok(vercel.crons.some(job=>job.path==="/api/cron/ranking-awards"&&job.schedule==="10 0 * * *"),"Missing 00:10 UTC daily settlement schedule");
assert.match(progress,/Podium achievement/,"Permanent badges must not display misleading +0 EXP");

assert.match(puzzle,/record_member_puzzle_completion/,"Existing scoring remains based on server-verified completions");
console.log("Arcade rankings source checks passed: real completions, opt-in, UTC periods, filters, podium and existing game links.");

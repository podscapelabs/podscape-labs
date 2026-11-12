import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const catalog=read("data/achievement-catalog.ts");
const sql=read("supabase/migrations/202611110005_extended_achievement_triggers.sql");
const progress=read("app/account/progress/page.tsx");
const dashboard=read("app/account/progress/ProgressDashboard.tsx");
const puzzle=read("app/api/progress/puzzle-complete/route.ts");
const newRules=[
 "care_journal","care_seven_days","collection_twenty_five_species",
 "secret_arcade_variety","secret_burrow_streak","keeper_first_enclosure",
 "keeper_five_enclosures","keeper_first_care","puzzle_three_games",
 "puzzle_twenty_four","secret_burrow_explorer",
 "level_ten","level_twenty_five","level_fifty"
];
const ids=[...catalog.matchAll(/key:"([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"Every achievement key must be unique");
for(const key of newRules){
 assert.ok(catalog.includes('key:"'+key+'"'),"Missing achievement from catalogue: "+key);
 assert.ok(sql.includes("'"+key+"'"),"No database-backed trigger rule: "+key);
 const match=catalog.match(new RegExp('key:"'+key+'"[^\\n]+'));
 assert.ok(match&&match[0].includes('status:"available"'),"Verified milestone must be earnable: "+key);
 assert.ok(match&&/exp:[1-9][0-9]*/.test(match[0]),"New milestones require a valid EXP amount: "+key);
}
assert.ok(!catalog.includes('status:"planned"'),"Do not leave data-backed achievements indefinitely locked");
assert.equal((sql.match(/\$\$/g)||[]).length,6,"All three SQL functions need valid dollar quote pairs");
assert.ok(!sql.includes("as $\n"),"Reject malformed SQL function delimiters");
for(const table of ["keeper_enclosures","keeper_events","member_species_collection","member_puzzle_completions","member_progress"])
 assert.ok(sql.includes("on public."+table),"Missing achievement trigger table: "+table);
assert.match(sql,/kind in \('feeding','maintenance','breeding','observation'\)/,"Care milestones must count genuine care events");
assert.match(sql,/count\(distinct \(created_at at time zone 'UTC'\)::date\)/,"Care streak must use distinct recorded dates");
assert.match(sql,/count\(distinct \(completed_at at time zone 'UTC'\)::date\)/,"Arcade return milestone must use distinct played dates");
assert.match(sql,/v_games>=4/,"Hidden game discovery must require four completed games");
assert.match(sql,/v_burrow>=3/,"Hidden Word Burrow milestone needs three completed puzzles");
assert.match(sql,/v_lifetime_exp>=240100/,"Level 50 must use the existing 100*(level-1)^2 curve");
assert.match(sql,/pg_trigger_depth\(\)>1/,"Progress trigger must avoid recursive payouts");
assert.match(sql,/on conflict do nothing/,"Achievement awards must be idempotent");
assert.match(sql,/member_progress_events/,"Every new EXP payout must be backed by an event");
assert.match(sql,/coin_delta\)\s+values\([^\n]+,0\)/,"Historical payout ledger must remain neutral for existing achievements");
assert.match(sql,/revoke all on function public.reconcile_member_extended_achievements/,"Reconciliation RPC must not be callable by ordinary users");
assert.match(progress,/reconcile_member_extended_achievements/,"Progress page must backfill existing milestones");
assert.match(dashboard,/Keeper Progression/,"Level milestones should have their own browsing category");
assert.match(dashboard,/key.startsWith\("keeper_"\)/,"Care achievements should appear under Colony Care");
assert.match(puzzle,/beforeBadges/,"Verified puzzle completion should detect newly unlocked milestones");
assert.match(puzzle,/afterBadges/,"Hidden milestones must be announced through existing achievement toasts");
console.log("Achievement source checks passed: 14 new triggers, legacy-safe keys, EXP event dedupe and hidden unlocks.");

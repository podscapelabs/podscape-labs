import assert from "node:assert/strict";
import {existsSync,readdirSync,readFileSync,statSync} from "node:fs";
import {join} from "node:path";

// Retired currency must never appear in the application, API, copy, or reward catalogue.
const roots=["app","components","data","lib"];
const files=[];
function walk(folder){
 if(!existsSync(folder))return;
 for(const name of readdirSync(folder)){
  const full=join(folder,name);
  if(statSync(full).isDirectory())walk(full);
  else if(/\.(ts|tsx|js|jsx|mjs)$/.test(name))files.push(full);
 }
}
roots.forEach(walk);
const offenders=[];
for(const path of files){
 const source=readFileSync(path,"utf8");
 if(/pod[\s_-]*coins?|pod_coins|\bcoins\s*:/i.test(source))offenders.push(path);
}
assert.deepEqual(offenders,[],"Retired currency must not reappear in application source");
const catalog=readFileSync("data/achievement-catalog.ts","utf8");
assert.doesNotMatch(catalog,/\bcoins\b/,"Achievements grant EXP only");
const progress=readFileSync("app/account/progress/ProgressDashboard.tsx","utf8");
assert.match(progress,/Lifetime EXP/,"Permanent EXP progression stays visible");
const migration=readFileSync("supabase/migrations/202611110010_retire_secondary_currency.sql","utf8");
assert.match(migration,/achievement:ledger_five_species/,"Field Observer still unlocks");
assert.match(migration,/values\(p_user_id,50\)/,"Field Observer still grants its full EXP");
assert.match(migration,/values\(p_user_id,'achievement:ledger_five_species','achievement',50,0\)/,"No more legacy minting");
console.log("Retired currency source and reward regression checks passed.");

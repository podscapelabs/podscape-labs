import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const js=ts.transpileModule(read("data/achievement-catalog.ts"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const commonJs={exports:{}};
runInNewContext(js,{module:commonJs,exports:commonJs.exports});
const catalog=commonJs.exports.achievementCatalog;
const expected={
 onboarding_complete:35,home_personalized:20,nav_personalized:20,
 species_personalized:25,manager_personalized:25,customize_three:60,customize_all:100
};
assert.equal(new Set(catalog.map(a=>a.key)).size,catalog.length,"Achievement IDs must be unique");
for(const [key,exp] of Object.entries(expected)){
 const item=catalog.find(a=>a.key===key);
 assert.ok(item,`Missing achievement ${key}`);
 assert.equal(item.exp,exp);
 assert.equal(item.coins,0,"Experience milestones must not award Pod Coins");
 assert.equal(item.status,"available");
 assert.ok(item.description.length>=25);
}
assert.equal(catalog.find(a=>a.key==="customize_all").hidden,true);
for(const key of ["secret_two_paths","secret_first_steps"]){
 const achievement=catalog.find(a=>a.key===key);
 assert.ok(achievement,"Missing hidden achievement");
 assert.equal(achievement.hidden,true);
 assert.equal(achievement.coins,0);
 assert.equal(achievement.status,"available");
}

const sql=read("supabase/migrations/20261109201500_member_experience_achievements.sql");
assert.match(sql,/primary key \(user_id,action_key\)/i);
assert.match(sql,/enable row level security/i);
assert.match(sql,/auth\.uid\(\)\)=user_id/i);
assert.match(sql,/on conflict do nothing/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/secret_two_paths/);
assert.match(sql,/secret_first_steps/);
assert.match(sql,/customized>=2/);
assert.match(sql,/action_key='onboarding_complete'/);
assert.match(sql,/grant execute on function public\.record_member_experience_action\(uuid,text\) to service_role/);
assert.match(sql,/coin_delta\)\s*values\([^;]+,0\)/);
const route=read("app/api/progress/experience-action/route.ts");
assert.match(route,/db\.auth\.getUser\(\)/);
assert.match(route,/email_confirmed_at/);
assert.match(route,/testerAccessStatus\(user\.email\)/);
assert.match(route,/validProof\(action as Action,proof\)/);
assert.match(route,/admin\.rpc\("record_member_experience_action"/);
const client=read("components/experience-achievements.ts");
assert.match(client,/announceAchievement\(notice\)/);
assert.match(route,/hidden:definition.hidden===true/);
const toast=read("components/AchievementToast.tsx");
assert.match(toast,/Hidden Achievement Discovered!/);
assert.match(toast,/current.hidden/);
const preview=read("components/TestAchievementButton.tsx");
assert.match(preview,/hidden:true/);
assert.ok(!preview.includes("fetch("),"Visual-only banner preview must not grant rewards");
const tour=read("components/ShortcutWelcomeTip.tsx");
assert.match(tour,/if\(!skipped\)void recordExperienceAction\("onboarding_complete"/);
assert.match(tour,/setSkipped\(true\)/);
const presets=read("components/onboarding-presets.ts");
assert.match(presets,/podscape-home-widgets-changed/);
assert.match(presets,/podscape-nav-updated/);
assert.ok(presets.includes("localStorage.getItem(onboardingLayoutKey)"),"Starter presets must inspect the existing layout");
assert.ok(presets.includes("if(options.shortcuts)"),"Shortcut presets must be optional");
assert.match(tour,/focus===null/,"Keep current layout must be the initial selection");
assert.ok(tour.includes("if(focus)"),"Never replace a saved Home layout unless a preset was explicitly selected");
assert.match(tour,/Not now/,"Onboarding must allow dismissal without personalizing");
assert.match(tour,/Skip tutorial/,"Onboarding must support skipping directly to setup");
assert.match(tour,/podscape-open-onboarding/,"The tutorial must be replayable");
assert.match(read("app/account/page.tsx"),/onboarding=1/,"Account must link back to onboarding");
assert.match(tour,/Appearance/,"Welcome setup should expose theme preferences");
for(const [source,event] of [
 ["components/HomeWidgets.tsx","home_personalized"],
 ["components/ManagerWorkspace.tsx","manager_personalized"],
 ["components/SpeciesDashboardWorkspace.tsx","species_personalized"],
 ["components/useNavigationPreferences.ts","nav_personalized"]
])assert.ok(read(source).includes(`recordExperienceAction("${event}"`),`Missing genuine edit trigger ${source}`);
console.log("Experience achievement checks passed: seven one-time EXP milestones, tutorial skip, personalized layouts, guarded RPC and notification integration.");

// The achievement toast must stay readable on dark-mode PWA screens.
const toastStyles=read("components/AchievementToast.module.css");
assert.match(toastStyles,/background:var\(--paper/);
assert.match(toastStyles,/color:var\(--ink/);
assert.match(toastStyles,/\.close\{[^}]*width:36px/);
assert.match(toastStyles,/@media\(max-width:600px\)/);
assert.ok(!/background:var\(--surface\)/.test(toastStyles),"Avoid undefined tokens that make achievement banners transparent");

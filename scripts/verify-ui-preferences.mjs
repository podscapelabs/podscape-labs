import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const navSource=read("components/navigation-customization.ts");
const modelSource=read("lib/ui-preferences.ts");
function execute(source,dependencies={},globals={}){
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const compiledModule={exports:{}};
 runInNewContext(code,{...globals,module:compiledModule,exports:compiledModule.exports,require:(id)=>{
  if(id==="./navigation-customization"||id==="@/components/navigation-customization")return dependencies.nav;
  throw new Error("Unexpected module "+id);
 }});
 return compiledModule.exports;
}
const nav=execute(navSource);
const memory=new Map();
const storage={getItem(key){return memory.get(key)??null},setItem(key,val){memory.set(key,String(val))},removeItem(key){memory.delete(key)}};
const model=execute(modelSource,{nav},{localStorage:storage});
const userId="member-x";
const managerKey=model.managerStorageKey(userId),speciesKey=model.speciesStorageKey(userId);
const oldManager={
 order:["stats","care","tools","activity","enclosures","insights"],
 visible:["stats","care","tools","activity","enclosures"],
 tools:["scan","qr","add","care","schedule","notes"]
};
const oldSpecies={
 order:["environment","feeding","habitat","about","guides"],
 visible:["environment","feeding","habitat","about"]
};
storage.setItem(managerKey,JSON.stringify(oldManager));
storage.setItem(speciesKey,JSON.stringify(oldSpecies));
const upgraded=model.readLocalUiPreferences(false,userId);
assert.equal(upgraded.manager.order.length,7,"Legacy manager must gain the complete canonical widget order");
assert.equal(upgraded.manager.tools.length,6,"Legacy manager shortcut positions must remain valid");
assert.ok(upgraded.species.order.includes("moisture"),"Legacy environment widget should migrate to moisture");
assert.ok(upgraded.species.visible.includes("nutrition"),"Legacy feeding widget should migrate to nutrition");
assert.ok(upgraded.species.visible.includes("habitatAdvanced"),"Legacy habitat widget should migrate to canonical habitat");
assert.ok(model.parseUiPreferences(upgraded),"Legacy layouts must normalize into a safe, syncable payload");
assert.equal(storage.getItem(managerKey),JSON.stringify(oldManager),"Reading legacy Manager layout must never mutate original device storage");
assert.equal(storage.getItem(speciesKey),JSON.stringify(oldSpecies),"Reading legacy Species layout must never mutate original device storage");
assert.equal(model.readLocalUiPreferences(false,"another-account").manager.visible.join(","),model.defaultManagerLayout().visible.join(","),"Manager preferences must be scoped to the signed-in user");
storage.removeItem(managerKey);
storage.removeItem(speciesKey);
const standard=model.defaultUiPreferences();
assert.equal(standard.home.order.length,12);
assert.equal(standard.home.visible.join(","),"recent");
assert.equal(standard.navBottom.length,5);
assert.equal(standard.navHome.length,6);
assert.equal(standard.manager.order.length,7);
assert.equal(standard.manager.tools.length,6);
assert.equal(standard.species.order.length,13);
assert.ok(model.parseUiPreferences(standard));
const altered=JSON.parse(JSON.stringify(standard));
altered.home.visible=["recent","colony"];altered.navHome=["ledger","shop","manager","community","guides","podbound"];
assert.ok(model.parseUiPreferences(altered));
const extended=JSON.parse(JSON.stringify(standard));
extended.manager.visible=["hero","tools","enclosures","care","activity"];
extended.manager.tools=["bulkqr","scan","add","care","schedule","colonies"];
extended.species.visible=["care","moisture","about","sources"];
extended.species.order=[...standard.species.order].reverse();
assert.ok(model.parseUiPreferences(extended),"Valid Manager and Species layouts must round trip");
assert.equal(model.sameUiPreferences(standard,extended),false);
for(const key of ["manager","species"]) {
 const legacy=JSON.parse(JSON.stringify(standard));
 delete legacy[key];
 assert.ok(model.parseUiPreferences(legacy),"Cloud preference snapshots without "+key+" must remain readable");
}
const invalidManager=JSON.parse(JSON.stringify(extended));
invalidManager.manager.tools=["scan","scan","qr","care","schedule","add"];
assert.equal(model.parseUiPreferences(invalidManager),null,"Manager tools cannot contain duplicates");
invalidManager.manager=extended.manager;
invalidManager.manager.visible=["care"];
assert.equal(model.parseUiPreferences(invalidManager),null,"Required Manager widgets cannot disappear");
const invalidSpecies=JSON.parse(JSON.stringify(extended));
invalidSpecies.species.order.push("made-up");
assert.equal(model.parseUiPreferences(invalidSpecies),null,"Unknown Species widget cannot be synced");
assert.ok(model.managerStorageKey("user-123").endsWith(":user-123"));
assert.ok(model.speciesStorageKey("user-123").endsWith(":user-123"));
assert.equal(model.sameUiPreferences(standard,altered),false);
assert.equal(model.isDefaultUiPreferences(standard),true);
const invalid=JSON.parse(JSON.stringify(standard));
invalid.home.visible=["bogus"];
assert.equal(model.parseUiPreferences(invalid),null,"Unknown Home widgets must fail validation");
invalid.home.visible=["recent"];
invalid.home.order.push("invalid");
assert.equal(model.parseUiPreferences(invalid),null,"Unknown Home blocks must fail validation");
invalid.home.order.pop();
invalid.navHome=["owner-tools","shop","manager","community","guides","podbound"];
assert.equal(model.parseUiPreferences(invalid,false),null,"Members cannot sync owner navigation");
assert.ok(model.parseUiPreferences(invalid,true),"Owner navigation may be saved by authorized owners");
const route=read("app/api/preferences/sync/route.ts");
for(const check of ["db.auth.getUser()","email_confirmed_at","testerAccessStatus","parseUiPreferences","eq(\"user_id\",session.userId)","eq(\"revision\",revision)","status:409","Cache-Control"]){
 assert.ok(route.includes(check),"Preference API missing "+check);
}
const migration=read("supabase/migrations/20261110150000_member_ui_preferences.sql");
for(const check of ["manager_layout jsonb not null","species_layout jsonb not null","references auth.users(id) on delete cascade","enable row level security","revoke all","grant select, insert, update","auth.uid()","for select to authenticated","for insert to authenticated","for update to authenticated"]){
 assert.ok(migration.toLowerCase().includes(check.toLowerCase()),"RLS migration missing "+check);
}
assert.ok(!/grant\s+delete/i.test(migration),"Preference deletion must remain denied");
const bridge=read("components/PreferenceSyncBridge.tsx");
for(const check of ["sameUiPreferences","isDefaultUiPreferences","status===409","modeChange(\"conflict\")","\"import\"","Use account layout","Use this device & sync","markSaved","readLocalUiPreferences"]){
 assert.ok(bridge.includes(check),"Client sync missing "+check);
}
assert.ok(route.includes("manager_layout:parsed.manager")&&route.includes("species_layout:parsed.species"),"Sync API must save both additional dashboards");
assert.ok(read("components/ManagerWorkspace.tsx").includes("podscape-workspace-layout-changed"),"Manager widget changes must trigger sync");
assert.ok(read("components/SpeciesDashboardWorkspace.tsx").includes("podscape-workspace-layout-changed"),"Species widget changes must trigger sync");
assert.ok(bridge.includes("podscape-workspace-layout-changed"),"Sync bridge must listen to workspace changes");
const unsafelyUnscopedReads=[...bridge.matchAll(/readLocalUiPreferences\(([^)]*)\)/g)].filter(match=>!match[1].includes("userId"));
assert.equal(unsafelyUnscopedReads.length,0,"Cloud sync must never omit account scope in Manager/Species comparison reads");

assert.ok(read("components/HomeWidgets.tsx").includes("podscape-home-widgets-changed"),"Home edits must trigger sync");
assert.ok(read("components/navigation-customization.ts").includes("podscape-nav-updated"),"Nav changes must trigger sync");
assert.ok(read("components/OwnerAwareMobileNav.tsx").includes("PreferenceSyncBridge"),"Authenticated sync bridge must mount across the app");
console.log("UI preference sync checks passed: Home, Manager, Species, navigation, legacy migration, RLS, conflicts, and account-scoped keys.");

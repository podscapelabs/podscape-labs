import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const navSource=read("components/navigation-customization.ts");
const modelSource=read("lib/ui-preferences.ts");
function execute(source,dependencies={}){
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 runInNewContext(code,{module,exports:module.exports,require:(id)=>{
  if(id==="./navigation-customization"||id==="@/components/navigation-customization")return dependencies.nav;
  throw new Error("Unexpected module "+id);
 }});
 return module.exports;
}
const nav=execute(navSource);
const model=execute(modelSource,{nav});
const standard=model.defaultUiPreferences();
assert.equal(standard.home.order.length,12);
assert.equal(standard.home.visible.join(","),"recent");
assert.equal(standard.navBottom.length,5);
assert.equal(standard.navHome.length,6);
assert.ok(model.parseUiPreferences(standard));
const altered=JSON.parse(JSON.stringify(standard));
altered.home.visible=["recent","colony"];altered.navHome=["ledger","shop","manager","community","guides","podbound"];
assert.ok(model.parseUiPreferences(altered));
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
for(const check of ["references auth.users(id) on delete cascade","enable row level security","revoke all","grant select, insert, update","auth.uid()","for select to authenticated","for insert to authenticated","for update to authenticated"]){
 assert.ok(migration.toLowerCase().includes(check.toLowerCase()),"RLS migration missing "+check);
}
assert.ok(!/grant\s+delete/i.test(migration),"Preference deletion must remain denied");
const bridge=read("components/PreferenceSyncBridge.tsx");
for(const check of ["sameUiPreferences","isDefaultUiPreferences","status===409","modeChange(\"conflict\")","modeChange(\"import\")","Use account layout","Use this device & sync","markSaved","readLocalUiPreferences"]){
 assert.ok(bridge.includes(check),"Client sync missing "+check);
}
assert.ok(read("components/HomeWidgets.tsx").includes("podscape-home-widgets-changed"),"Home edits must trigger sync");
assert.ok(read("components/navigation-customization.ts").includes("podscape-nav-updated"),"Nav changes must trigger sync");
assert.ok(read("components/OwnerAwareMobileNav.tsx").includes("PreferenceSyncBridge"),"Authenticated sync bridge must mount across the app");
console.log("UI preference sync checks passed: schema validation, RLS, conflict revision, safe import, and Home/Nav wiring.");

import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";

const root=new URL("../",import.meta.url).pathname;
const read=path=>readFileSync(join(root,path),"utf8");
function walk(dir){
 return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(entry=>{
  const next=join(dir,entry.name);
  return entry.isDirectory()?walk(next):entry.name.endsWith(".css")?[next.replaceAll("\\","/")]:[];
 });
}
const sheets=[...walk("app"),...walk("components")];
assert.ok(sheets.length>=68,"Theme scan must cover all existing app and component stylesheets");
const globals=read("app/globals.css");
for(const token of ["--ps-bg","--ps-surface","--ps-surface-raised","--ps-surface-muted","--ps-text","--ps-text-secondary","--ps-border","--ps-accent","--ps-accent-text","--ps-focus","--ps-font-ui","--ps-font-display","--ps-radius-card","--ps-min-control"]){
 assert.ok(globals.includes(token+":"),"Missing theme role: "+token);
}
assert.match(globals,/:root\[data-theme="dark"\]\s*\{[\s\S]*?--ps-accent-text:var\(--forest-deep\)/);
assert.match(globals,/\.v2-site\s*\{[\s\S]*?--ps-accent:var\(--accent\)/,"New portal design system must map into semantic tokens");

const audited=[
 "app/account/account-dashboard.module.css",
 "app/account/my-podscape.module.css",
 "app/account/progress/progress.module.css",
 "app/admin/podbound/desk.module.css",
 "app/admin/spotlight/spotlight.module.css",
 "app/admin/updates/updates.module.css",
 "app/podbound/cards/gallery.module.css",
 "app/shop/vendors/vendors.module.css",
 "components/UpdateDetailDialog.module.css"
];
for(const path of audited){
 const css=read(path);
 assert.match(css,/var\(--ps-accent-text\)/,"Button contrast must derive from theme roles: "+path);
 assert.ok(!/background:var\(--forest\);color:(?:#fff[a-f\d]*|white)\b/i.test(css),"Hardcoded light text on dynamic forest accent: "+path);
}
const home=read("components/PodscapeHome.module.css");
for(const contract of [
 ".spotlightRail .tileCopy strong",
 ".spotlightRail .tileCopy small",
 ".recentRail>.recentCategoryCard",
 ".recentCategoryPrimary strong",
 ".recentCategoryPrimary>span",
 ".recentCategoryMore a,.recentCategoryMore button"
])assert.ok(home.includes(contract),"Missing text-overflow contract: "+contract);
assert.match(home,/\.spotlightRail>\.tile\{height:auto;min-height:184px\}/);
assert.match(home,/overflow-wrap:anywhere/);
assert.match(home,/var\(--ps-surface\)/);
assert.match(globals,/\.ps-clamp-2/);
assert.match(globals,/\.ps-card/);

// Inventory only: backgrounds and gradients used for photos, flags, chart series and
// illustrated heroes can legitimately be fixed. Review rather than blindly rewrite.
const hardcoded=sheets.map(path=>({
 path,count:(read(path).match(/(?:background(?:-color)?|color|border-color)\s*:\s*#[0-9a-f]{3,8}\b/gi)||[]).length
})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
console.log(`PodScape theme source gate passed: ${sheets.length} CSS stylesheets, semantic palette mapping, card overflow, and accent contrast.`);
console.log("Theme review inventory (fixed colors aren't automatically violations): "+
 JSON.stringify(hardcoded.slice(0,12)));

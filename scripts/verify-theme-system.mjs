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
const appearance=read("components/AppearancePreference.tsx");
const appearanceCss=read("components/AppearancePreference.module.css");
const themeToggle=read("components/ThemeToggle.tsx");
const layout=read("app/layout.tsx");
const splashCss=read("app/app/loading.module.css");
assert.match(globals,/:root\[data-theme="woodland"\]\s*\{/,"Woodland must have its own root palette");
assert.match(globals,/:root\[data-theme="woodland"\] \.v2-site/,"Woodland must cover portal theme roles");
for(const role of ["--canvas","#211a16","--paper","#30251f","--ink","#f5e9d7","--accent-contrast","#261a13"])assert.ok(globals.includes(role),"Missing Woodland palette detail "+role);
assert.match(appearance,/id:"woodland"/,"Woodland choice must be available in settings");
assert.match(appearance,/localStorage\.setItem\(KEY,next\)/,"Appearance must persist");
assert.match(appearanceCss,/grid-template-columns:repeat\(2/,"Theme picker should fit phone widths");
assert.match(themeToggle,/woodland/,"Quick theme toggle must support Woodland");
assert.match(layout,/saved === "woodland"/,"Early bootstrap must support Woodland");
assert.match(layout,/style\.colorScheme = theme === "light"/,"Woodland should use dark native control scheme");
assert.ok(!splashCss.includes(':global(html:not([data-theme="dark"]))'),"Woodland splash must not be treated as Light");
assert.match(splashCss,/:global\(html\[data-theme="woodland"\]\) \.page\s*\{[\s\S]*?--splash-bg:#211a16;[\s\S]*?--splash-ink:#f5e9d7;[\s\S]*?--splash-muted:#ccb8a4;[\s\S]*?--splash-accent:#d6ac76;/,
 "Woodland loading splash must use cocoa, parchment, and copper roles");


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
 "components/UpdateDetailDialog.module.css",
 "app/admin/products/products.module.css",
 "app/field-guide/field-guide-home.module.css",
 "components/ProductEditor.module.css",
 "app/keeper/collection/page.module.css",
 "app/ledger/discover.module.css"
];
for(const path of audited){
 const css=read(path);
 assert.match(css,/var\(--ps-accent-text\)/,"Button contrast must derive from theme roles: "+path);
 assert.ok(!/(?:background(?:-color)?\s*:\s*var\(--(?:forest|accent)\)[^}]*color\s*:\s*(?:#[0-9a-f]{3,8}|white)\s*(?:;|})|color\s*:\s*(?:#[0-9a-f]{3,8}|white)\s*;[^}]*background(?:-color)?\s*:\s*var\(--(?:forest|accent)\))/i.test(css),"Hardcoded foreground on dynamic accent: "+path);
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

// Woodland visual parity: legacy portal gradients must not remain fixed to Light/Forest.
const shopHome=read("app/shop/shop-home.module.css");
const keeperHome=read("app/keeper/page.module.css");
const homeSurface=read("components/PodscapeHome.module.css");
for(const [path,source,checks] of [
 ["Shop",shopHome,[".hero{",".hero h1{",".hero .previewTag{",".path:nth-child(2){",".path:nth-child(3){",".path:nth-child(4){",".feature{",".feature a{"]],
 ["Manager",keeperHome,[".managerHero{",".managerHero::after{",".managerHeroContent h1{",".managerHeroContent p{"]],
 ["Home",homeSurface,[".hero{",".hero:after{",".heroButton{",".spotlightRail .tileVisual:has(.tilePlaceholder){"]]
]){
 for(const selector of checks){
  assert.ok(source.includes(':global(html[data-theme="woodland"]) '+selector),
   "Missing Woodland portal override in "+path+": "+selector);
 }
}
assert.match(shopHome,/--portal-hero-button-text/,"Shop CTA must use role-based contrast");
assert.match(keeperHome,/--portal-hero-muted/,"Manager hero description must use Woodland contrast roles");
assert.match(homeSurface,/--portal-hero-button-bg/,"Home hero CTA must use semantic role");

// Inventory only: backgrounds and gradients used for photos, flags, chart series and
// illustrated heroes can legitimately be fixed. Review rather than blindly rewrite.
const hardcoded=sheets.map(path=>({
 path,count:(read(path).match(/(?:background(?:-color)?|color|border-color)\s*:\s*#[0-9a-f]{3,8}\b/gi)||[]).length
})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
console.log(`PodScape theme source gate passed: ${sheets.length} CSS stylesheets, semantic palette mapping, card overflow, and accent contrast.`);
console.log("Theme review inventory (fixed colors aren't automatically violations): "+
 JSON.stringify(hardcoded.slice(0,12)));

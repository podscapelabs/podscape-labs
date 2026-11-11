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
// Registry is the source of truth. Every registered appearance must supply
// both old and v2 palette roles plus loading screen styling.
const registry=read("lib/theme-registry.ts");
const registered=[...registry.matchAll(/\{id:"([a-z-]+)",title:"[^"]+",description:"[^"]+",scheme:"(light|dark)"/g)].map(m=>({id:m[1],scheme:m[2]}));
const themeIds=registered.map(theme=>theme.id);
assert.ok(themeIds.includes("light")&&themeIds.includes("dark"),"System requires Light/Dark fallbacks");
assert.equal(new Set(themeIds).size,themeIds.length,"Theme ids must be unique");
assert.ok(themeIds.length>=5,"Existing five themes must remain available");
for(const {id,scheme} of registered){
 const selector=id==="light"?":root":':root[data-theme="'+id+'"]';
 assert.ok(globals.includes(selector),"Missing root palette for "+id);
 const rootPalette=id==="light"?":root":selector;
 assert.ok(globals.includes(rootPalette),"Missing theme palette for "+id);
 for(const role of ["--theme-background","--theme-surface","--theme-portal-hero-start","--theme-portal-hero-button-text"]){
  assert.ok(themePalette(id).includes(role+":"),"Missing canonical portal token "+role+" in "+id);
 }
 assert.ok(!globals.includes(selector+" .v2-site"),"Duplicate per-theme v2 palette in "+id);
 assert.ok(splashCss.includes("--splash-bg:var(--canvas)")&&splashCss.includes("--splash-ink:var(--ink)")&&splashCss.includes("--splash-accent:var(--forest)"),
  "Loading screen must inherit shared theme roles");
 assert.ok(registry.includes('id:"'+id+'"'),"Missing theme metadata for "+id);
}
assert.match(appearance,/THEMES,SYSTEM_OPTION,THEME_STORAGE_KEY/,"Appearance picker must use the registry");
assert.match(themeToggle,/THEMES,THEME_IDS,isThemeId/,"Quick toggle must use the registry");
assert.match(layout,/THEMES,THEME_STORAGE_KEY/,"First paint must consume theme registry");
assert.match(layout,/JSON.stringify\(themeIds\)/,"First paint needs all registered ids");
assert.match(layout,/JSON.stringify\(themeSchemes\)/,"First paint must use registry-native colour schemes");
assert.match(appearance,/chooseThemePreference\(next\)/,"Appearance must use centralized theme persistence");
const themeRuntime=read("lib/theme-runtime.ts");
assert.match(themeRuntime,/localStorage\.setItem\(THEME_STORAGE_KEY,mode\)/,"Theme preferences must persist centrally");
assert.match(themeRuntime,/meta\[name="theme-color"\]/,"Browser chrome must follow chosen theme");
assert.match(themeToggle,/chooseThemePreference\(next\)/,"Quick toggle must use centralized theme runtime");
assert.match(appearanceCss,/grid-template-columns:repeat\(2/,"Theme picker should fit phone widths");

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

// Universal portal contracts: a theme is supplied as tokens, never a page-specific selector.
const shopHome=read("app/shop/shop-home.module.css");
const keeperHome=read("app/keeper/page.module.css");
const homeSurface=read("components/PodscapeHome.module.css");
for(const [page,source,roles] of [
 ["Shop",shopHome,["--portal-hero-glow","--portal-hero-start","--portal-hero-end","--portal-hero-button-bg","--portal-hero-button-text"]],
 ["Manager",keeperHome,["--portal-hero-start","--portal-hero-end","--portal-hero-text","--portal-hero-muted"]],
 ["Home",homeSurface,["--portal-hero-start","--portal-hero-end","--portal-hero-button-bg","--ps-surface-muted"]]
]){
 for(const role of roles)assert.ok(source.includes("var("+role+")"),page+" is missing semantic role "+role);
 assert.ok(!/html\[data-theme=/.test(source),page+" must not require theme-specific CSS overrides");
}
assert.match(shopHome,/\.feature a\{background:var\(--portal-hero-button-bg\);color:var\(--portal-hero-button-text\)\}/);
assert.match(keeperHome,/\.managerHeroContent h1\{color:var\(--portal-hero-text\)\}/);
assert.match(homeSurface,/\.heroButton\{background:var\(--portal-hero-button-bg\);color:var\(--portal-hero-button-text\)\}/);
// MarketingSite renders Home without .v2-site: its scoped theme adapter is mandatory.
// If absent, unresolved portal hero vars silently remove the hero card background.
const requiredHomeRoles=["start","end","glow","text","muted","soft","button-bg","button-text"];
for(const role of requiredHomeRoles){
 const cssName="--portal-hero-"+role;
 const rootName="--theme-portal-hero-"+role;
 assert.ok(homeSurface.includes(cssName+":var("+rootName+")"),
  "Home theme boundary must bridge "+rootName+" to "+cssName);
 for(const theme of themeIds){
  assert.ok(themePalette(theme).includes(rootName+":"),
   theme+" palette missing Home hero token "+rootName);
 }
}
assert.match(homeSurface,/\.hero\{\s*background:linear-gradient\(125deg,var\(--portal-hero-start\),var\(--portal-hero-end\)\)/,
 "Home hero must paint a themed gradient rather than falling through to transparent");


// Legacy portal closure: no green-only guide, QR actions or stale Lab front door.
const fieldGuide=read("app/field-guide/field-guide-home.module.css");
const podbound=read("app/podbound/page.module.css");
const singleQr=read("components/KeeperQrCreator.module.css");
const bulkQr=read("components/KeeperBulkQrCreator.module.css");
const labLanding=read("app/from-the-lab/page.tsx");
const labArticle=read("app/from-the-lab/[slug]/page.tsx");
const nav=read("components/navigation-customization.ts");
const platform=read("data/platform.ts");
for(const selector of [".hero{",".featured{",".topicArt{"]){
 assert.ok(fieldGuide.includes(selector),"Guide layout surface missing: "+selector);
}
assert.match(fieldGuide,/--portal-hero-start/,"Field Guide hero and feature need shared portal roles");
assert.match(fieldGuide,/--portal-hero-button-text/,"Featured guide CTA needs contrasting text");
assert.match(fieldGuide,/\.topic:nth-child\(3n\) \.topicArt\{background:linear-gradient\([^;]*var\(--surface/,"Guide topics must follow theme surfaces");
// PodBound must not keep separate fixed-green Light or Dark heroes.
for(const selector of [".hero{",".hero:after{",".kicker{",".heroCopy>p:not(.kicker){",".heroButton{"]){
 assert.ok(podbound.includes(selector),"PodBound semantic hero missing "+selector);
}
for(const role of ["--paper-strong","--paper","--ink","--muted","--forest","--ps-accent-text"]){
 assert.ok(podbound.includes("var("+role+")"),"PodBound must use theme role "+role);
}
assert.ok(!podbound.includes(':global(html[data-theme="woodland"]) .hero'),"PodBound must share one theme contract across all five");
assert.match(podbound,/\.cardFront\{[^}]*background:radial-gradient/,"PodBound game card art must retain its branding");
assert.match(singleQr,/\.step b\{background:var\(--ps-accent/,"QR steps must use the selected theme");
assert.match(singleQr,/\.primary\{background:var\(--ps-accent/,"QR primary action must use the selected theme");
assert.match(bulkQr,/\.printButton\{background:var\(--ps-accent/,"Bulk print button must use theme");
assert.match(singleQr,/@media print/,"QR print rules must remain intact");
assert.match(bulkQr,/@media print/,"Bulk QR print rules must remain intact");

/* Validate the foreground/background palette choices that power the
   Field Guide and QR Studio buttons in all five explicit themes. */
function luminance(hex){
 const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return values[0]*.2126+values[1]*.7152+values[2]*.0722;
}
function contrastRatio(a,b){
 const high=Math.max(luminance(a),luminance(b));
 const low=Math.min(luminance(a),luminance(b));
 return (high+.05)/(low+.05);
}
function themePalette(theme){
 const selector=theme==="light"?":root":':root[data-theme="'+theme+'"]';
 const withSpace=globals.indexOf(selector+" {");
 const compact=globals.indexOf(selector+"{");
 const start=withSpace>=0&&compact>=0?Math.min(withSpace,compact):Math.max(withSpace,compact);
 assert.ok(start>=0,"Missing theme palette "+theme);
 const opening=globals.indexOf("{",start);
 return globals.slice(opening+1,globals.indexOf("}",opening));
}
function hexToken(palette,role){
 const match=palette.match(new RegExp(role+"\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;"));
 assert.ok(match,"Palette colour role missing: "+role);
 return match[1];
}
for(const theme of themeIds){
 const palette=themePalette(theme);
 const background=hexToken(palette,"--forest");
 const foreground=theme==="light"?hexToken(palette,"--paper-strong")
  :theme==="dark"?hexToken(palette,"--forest-deep"):hexToken(palette,"--ps-accent-text");
 const ratio=contrastRatio(background,foreground);
 assert.ok(ratio>=4.5,theme+" controls fail WCAG AA text contrast: "+ratio.toFixed(2)+":1");
}
// The Field Guide consumes portal roles, so check both dark and light hero
// contrast from their real CSS definitions, not only primary action buttons.
function portalPalette(theme){
 // Light's root supplies defaults; each theme root overrides only its roles.
 const defaults=themePalette("light");
 const selected=theme==="light"?"":themePalette(theme);
 const values=new Map();
 for(const source of [defaults,selected]){
  for(const match of source.matchAll(/--theme-([\w-]+)\s*:\s*([^;]+);/g)){
   values.set(match[1],match[2].trim());
  }
 }
 return [...values.entries()].map(([name,value])=>"--"+name+":"+value+";").join("\n");
}
for(const theme of themeIds){
 const p=portalPalette(theme);
 for(const [name,bg,fg] of [
  ["hero","--portal-hero-start","--portal-hero-text"],
  ["hero button","--portal-hero-button-bg","--portal-hero-button-text"],
  ["surface","--surface","--text-primary"]
 ]){
  const ratio=contrastRatio(hexToken(p,bg),hexToken(p,fg));
  assert.ok(ratio>=4.5,theme+" "+name+" contrast too low: "+ratio.toFixed(2)+":1");
 }
}

assert.match(fieldGuide,/\.featured a\{background:var\(--portal-hero-button-bg/,"Field Guide CTA must follow theme");
assert.match(singleQr,/\.printLabel\{[^}]*background:white;color:black/,"QR print must retain black-on-white label");
assert.match(bulkQr,/\.previewLabel,\.printLabel\{[^}]*background:white;color:#142c20/,"Bulk print must retain dark-on-white labels");

assert.match(labLanding,/redirect\("\/updates"\)/,"Old Lab landing must forward to Updates");
assert.match(labArticle,/getLabRecord/,"Individual Lab articles must remain accessible");
assert.match(nav,/id:"lab",label:"Updates & Improvements",href:"\/updates"/,"Preserve saved navigation slot ID and repoint to archive");
assert.match(platform,/label: "Updates & Improvements", href: "\/updates"/,"Platform directory must use archive");
assert.ok(!platform.includes("https://www.podbound.net"),"PodBound is a single in-app destination");

// Full-environment parity: named themes must supply their own canvas, cards,
// secondary and raised surfaces. This catches accidental Light-mode fallbacks
// in portal areas that consume semantic tokens.
const environmentPalettes=new Map();
for(const theme of themeIds){
 const rootPalette=themePalette(theme);
 const portal=portalPalette(theme);
 const legacySurface=hexToken(rootPalette,"--paper");
 const canvas=hexToken(rootPalette,"--canvas");
 const surface=hexToken(portal,"--surface");
 const secondary=hexToken(portal,"--surface-secondary");
 const raised=hexToken(portal,"--surface-raised");
 const portalBackground=hexToken(portal,"--background");
 const text=hexToken(portal,"--text-primary");
 assert.notEqual(canvas,legacySurface,theme+" needs a distinct page and card layer");
 assert.notEqual(portalBackground,surface,theme+" portal background must not merge with cards");
 assert.notEqual(surface,secondary,theme+" needs a distinct secondary surface");
 assert.notEqual(surface,raised,theme+" needs raised card separation");
 assert.ok(contrastRatio(surface,text)>=4.5,theme+" surface text must meet WCAG AA");
 environmentPalettes.set(theme,canvas+"|"+surface+"|"+secondary+"|"+raised);
}
assert.equal(new Set(environmentPalettes.values()).size,themeIds.length,"Each registered theme must have a distinct surface environment");
const ledgerTheme=read("app/ledger/discover.module.css");
assert.match(ledgerTheme,/border:1px solid var\(--border\);[\s\S]*?background:radial-gradient\(circle at 84% 22%,var\(--portal-hero-glow\)/,
 "Leaf Ledger must not preserve a hardcoded green frame across themes");
assert.match(ledgerTheme,/\.heroDestinations a\.heroDestinationActive\{background:var\(--portal-hero-button-bg\)/,
 "Ledger actions must follow each theme's portal button role");
assert.match(home,/\.spotlightRail \.tileCopy,[\s\S]*?background:var\(--ps-surface\)/,
 "Home Spotlight must inherit theme card surfaces");

// Inventory only: backgrounds and gradients used for photos, flags, chart series and
// illustrated heroes can legitimately be fixed. Review rather than blindly rewrite.
const hardcoded=sheets.map(path=>({
 path,count:(read(path).match(/(?:background(?:-color)?|color|border-color)\s*:\s*#[0-9a-f]{3,8}\b/gi)||[]).length
})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
console.log(`PodScape theme source gate passed: ${sheets.length} CSS stylesheets, semantic palette mapping, card overflow, and accent contrast.`);
console.log("Theme review inventory (fixed colors aren't automatically violations): "+
 JSON.stringify(hardcoded.slice(0,12)));

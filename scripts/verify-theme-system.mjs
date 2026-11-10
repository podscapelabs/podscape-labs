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
assert.match(appearance,/id:"lilac"/,"Lilac choice must be available in settings");
assert.match(appearance,/id:"ember"/,"Ember choice must be available in settings");
assert.match(appearance,/value==="ember"/,"Ember must be an accepted saved appearance");
assert.match(appearance,/theme==="light"\|\|theme==="lilac"\|\|theme==="ember"/,"Ember uses light native controls");
assert.match(themeToggle,/ember:"Ember"/,"Quick theme toggle must name Ember");
assert.match(themeToggle,/\["light","dark","woodland","lilac","ember"\]/,"Explicit themes are frozen at five");
assert.match(themeToggle,/theme-icon-ember/,"Ember needs a unique icon glyph");
assert.match(layout,/saved === "ember"/,"First paint must restore Ember");
assert.match(globals,/:root\[data-theme="ember"\]\s*\{/,"Ember must have its own palette");
assert.match(globals,/:root\[data-theme="ember"\] \.v2-site/,"Ember must cover portal themes");
assert.match(globals,/--portal-hero-button-text:#fffaf3/,"Ember hero CTA needs legible contrast");
assert.match(splashCss,/:global\(html\[data-theme="ember"\]\) \.page\s*\{[\s\S]*?--splash-bg:#fff3e5;[\s\S]*?--splash-ink:#3e281d;[\s\S]*?--splash-accent:#a64c21;/,
 "Ember loading must be apricot, not dark forest green");

assert.match(appearance,/value==="lilac"/,"Lilac must be accepted as a saved appearance");
assert.match(appearance,/theme==="light"\|\|theme==="lilac"/,"Lilac should use native light controls");
assert.match(themeToggle,/lilac:"Lilac"/,"Quick toggle must name Lilac");
assert.match(themeToggle,/\["light","dark","woodland","lilac"\]/,"Quick toggle must cycle all four explicit appearances");
assert.match(themeToggle,/theme-icon-lilac/,"Quick toggle needs the lilac glyph");
assert.match(layout,/saved === "lilac"/,"Initial bootstrap must restore Lilac");
assert.match(globals,/:root\[data-theme="lilac"\]\s*\{/,"Lilac needs a dedicated root palette");
assert.match(globals,/:root\[data-theme="lilac"\] \.v2-site/,"Lilac must cover portal semantic roles");
assert.match(globals,/--portal-hero-button-text:#fffaff/,"Lilac hero buttons must have legible text");
assert.match(splashCss,/:global\(html\[data-theme="lilac"\]\) \.page\s*\{[\s\S]*?--splash-bg:#f4eff9;[\s\S]*?--splash-ink:#33223e;[\s\S]*?--splash-accent:#70418b;/,"Lilac splash must follow lavender palette");

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
for(const [name,source,selectors] of [
 ["Shop",shopHome,[".hero{",".hero h1{",".hero .previewTag{",".path:nth-child(2){",".path:nth-child(3){",".path:nth-child(4){",".feature{"]],
 ["Manager",keeperHome,[".managerHero{",".managerHero::after{",".managerHeroContent h1{"]],
 ["Home",homeSurface,[".hero{",".hero:after{",".heroButton{",".spotlightRail .tileVisual:has(.tilePlaceholder){"]]
]){
 for(const selector of selectors){
  assert.ok(source.includes(':global(html[data-theme="ember"]) '+selector),
   "Missing Ember portal override in "+name+": "+selector);
 }
}

for(const [name,source,selectors] of [
 ["Shop",shopHome,[".hero{",".hero h1{",".hero .previewTag{",".path:nth-child(2){",".path:nth-child(3){",".path:nth-child(4){",".feature{"]],
 ["Manager",keeperHome,[".managerHero{",".managerHero::after{",".managerHeroContent h1{"]],
 ["Home",homeSurface,[".hero{",".hero:after{",".heroButton{",".spotlightRail .tileVisual:has(.tilePlaceholder){"]]
]){
 for(const selector of selectors){
  assert.ok(source.includes(':global(html[data-theme="lilac"]) '+selector),
   "Missing Lilac portal override in "+name+": "+selector);
 }
}


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
for(const theme of ["light","dark","woodland","lilac","ember"]){
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
 const selector=theme==="light"?".v2-site":':root[data-theme="'+theme+'"] .v2-site';
 const spaced=globals.indexOf(selector+" {");
 const compact=globals.indexOf(selector+"{");
 const start=spaced>=0&&compact>=0?Math.min(spaced,compact):Math.max(spaced,compact);
 assert.ok(start>=0,"Missing portal palette "+theme);
 const brace=globals.indexOf("{",start);
 return globals.slice(brace+1,globals.indexOf("}",brace));
}
for(const theme of ["light","dark","woodland","lilac","ember"]){
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

// Inventory only: backgrounds and gradients used for photos, flags, chart series and
// illustrated heroes can legitimately be fixed. Review rather than blindly rewrite.
const hardcoded=sheets.map(path=>({
 path,count:(read(path).match(/(?:background(?:-color)?|color|border-color)\s*:\s*#[0-9a-f]{3,8}\b/gi)||[]).length
})).filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
console.log(`PodScape theme source gate passed: ${sheets.length} CSS stylesheets, semantic palette mapping, card overflow, and accent contrast.`);
console.log("Theme review inventory (fixed colors aren't automatically violations): "+
 JSON.stringify(hardcoded.slice(0,12)));

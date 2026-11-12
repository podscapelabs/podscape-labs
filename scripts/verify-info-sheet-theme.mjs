import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";

const read=path=>readFileSync(path,"utf8");
const dialog=read("components/PodscapeInfoDialog.tsx");
const css=read("components/PodscapeInfoDialog.module.css");
const updates=read("components/RecentCategoryCards.tsx");
const updatesCss=read("components/UpdateDetailDialog.module.css");
const rankingCss=read("components/RankingModal.module.css");
const exchange=read("app/fun-zone/pod-exchange/PodExchange.tsx");
const exchangeCss=read("app/fun-zone/pod-exchange/exchange.module.css");
const theme=read("lib/theme-registry.ts");
const ledgerCss=read("app/ledger/discover.module.css");
const managerCss=read("components/ManagerColonies.module.css");
const scannerCss=read("components/KeeperScanner.module.css");
const speciesCss=read("components/SpeciesProfile.module.css");
const shopCss=read("app/shop/shop-home.module.css");

for(const id of ["light","dark","woodland","ember","lilac"])
 assert.ok(theme.includes('id:"'+id+'"'),"Theme must stay registered: "+id);
assert.match(dialog,/dialog\.showModal\(\)/,"Shared sheet opens as a native focus-managed modal");
assert.match(dialog,/addEventListener\("cancel",onCancel\)/,"Shared sheet must close on Escape");
assert.match(dialog,/document\.body\.style\.overflow="hidden"/,"Background must not scroll with a sheet open");
assert.match(css,/\.dialog::backdrop\{background:color-mix\(in srgb,var\(--ps-bg/,"Backdrop colour follows current theme");
assert.match(css,/var\(--ps-surface/,"Dialog surface must follow current theme");
assert.match(css,/safe-area-inset-bottom/,"Mobile sheet must account for home indicator");
assert.doesNotMatch(css,/#(?:[0-9a-f]{3,8})\b|rgba\(10,25,19/i,"No literal palette or fixed green overlay in shared sheet");
assert.match(updates,/PodscapeInfoDialog/,"What's Improved must use shared information sheet");
assert.doesNotMatch(updatesCss,/\.backdrop|rgba\(10,25,19/,"No legacy green update backdrop");
assert.match(updatesCss,/var\(--ps-accent-text\)/,"Update actions use contrast-aware text");
assert.match(rankingCss,/\.dialog::backdrop\{background:color-mix\(in srgb,var\(--ps-bg/,"Rankings help uses same themed backdrop");
assert.match(exchange,/rulesOpen\?createPortal\(<PodscapeInfoDialog/,"Exchange rules use shared help sheet");
assert.match(exchange,/className=\{styles\.agendaFoot\}/,"Market event widget is condensed");
assert.doesNotMatch(exchange,/className=\{styles\.agendaNext\}/,"Remove redundant second event card");
assert.match(exchangeCss,/\.rulesShortcut/,"Exchange rules remain accessible");
assert.doesNotMatch(exchangeCss,/\.rulesBody\{/,"Old accordion rules CSS is removed");
// Portal-specific colour leaks that previously survived general theme checks.
const ledger=read("app/ledger/discover.module.css");
const manager=read("components/ManagerColonies.module.css");
const collection=read("app/keeper/collection/page.module.css");
const shop=read("app/shop/shop-home.module.css");
const species=read("components/SpeciesProfile.module.css");
const scanner=read("components/KeeperScanner.module.css");
assert.match(ledger,/\.heroShade\{[^}]*var\(--portal-hero-start\)/,"Ledger hero overlay must inherit current theme");
assert.match(ledger,/\.heroSearch\{[\s\S]*?background:var\(--surface\)/,"Ledger search must use a theme surface");
assert.doesNotMatch(ledger,/#(?!000(?:000)?\b)[0-9a-f]{3,8}\b/i,"Ledger page must not force an old green/cream palette; black photo masks are allowed");
assert.match(manager,/\.card\{background:var\(--surface\)/,"Manager colony cards must match the selected theme");
assert.doesNotMatch(manager,/#[0-9a-f]{3,8}\b/i,"Manager colony cards should not force a dark forest on every theme");
assert.match(collection,/\.page\{[^}]*background:var\(--background\)/,"Collection page must inherit semantic background");
assert.doesNotMatch(collection,/#[0-9a-f]{3,8}\b/i,"Old collection colour literals are obsolete");
assert.match(shop,/\.hero\{[\s\S]*?var\(--portal-hero-glow\)/,"Shop hero must follow shared palette");
assert.doesNotMatch(shop,/#[0-9a-f]{3,8}\b/i,"Remove dead fixed-green Shop colours");
assert.match(species,/\.researchDialog::backdrop\{background:color-mix\(in srgb,var\(--ps-bg/,"Research dialog must use current theme overlay");
assert.match(scanner,/\.binHero\{[^}]*var\(--portal-hero-start\)/,"Keeper scanner result hero must follow theme");
assert.ok(!["#102d23","#153c2b","#f6f1e6","#fffdf5"].some(token=>ledgerCss.toLowerCase().includes(token)),"Ledger hero and search must not use fixed green/cream palette");
assert.ok(ledgerCss.includes("var(--portal-hero-button-bg)"),"Ledger primary navigation uses theme palette");
assert.ok(!managerCss.includes(".card{background:#10271e"),"Manager tiles must not force dark green");
assert.ok(managerCss.includes(".card{background:var(--surface)"),"Manager tiles use theme surfaces");
assert.ok(!speciesCss.includes("researchDialog::backdrop{background:rgba(11,27,20"),"Species research has no fixed green backdrop");
assert.ok(scannerCss.includes("var(--portal-hero-start)"),"Scanner hero uses theme portal colour");
assert.ok(scannerCss.includes("var(--accent-contrast)"),"Scanner actions maintain contrast");
assert.ok(!shopCss.includes("background:#fffaf066")&&!shopCss.includes("color:#294535"),"Shop avoids fixed green foregrounds");

const styles=[];
function walk(dir){
 for(const item of readdirSync(dir,{withFileTypes:true})){
  const file=join(dir,item.name);
  if(item.isDirectory())walk(file);
  else if(item.name.endsWith(".css"))styles.push(file);
 }
}
walk("app");walk("components");
const inventory=styles.map(path=>{
 const code=read(path);
 // Advisory inventory: legitimate photography, charts and status semantics may be fixed.
 const literals=[...code.matchAll(/(?:background(?:-color)?|color|border-color)\s*:\s*(#[0-9a-f]{3,8}\b|rgba?\()/gi)].length;
 return {path,literals};
}).filter(row=>row.literals>0).sort((a,b)=>b.literals-a.literals);
assert.ok(styles.length>=68,"Audit must include app and component stylesheets");
console.log("Theme audit:",styles.length,"stylesheets;",inventory.reduce((n,x)=>n+x.literals,0),"literal colour declarations across",inventory.length,"stylesheets (advisory inventory; not all are defects).");
console.log("Largest fixed-colour debt:",inventory.slice(0,7).map(x=>x.path+" ("+x.literals+")").join(", "));
console.log("Shared information sheets, 5 themes, market rules and update backdrop checks passed.");

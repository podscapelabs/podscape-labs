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

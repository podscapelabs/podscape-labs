import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
const read=path=>readFileSync(path,"utf8");
const ui=read("app/fun-zone/pod-exchange/PodExchange.tsx");
const styles=read("app/fun-zone/pod-exchange/exchange.module.css");
const api=read("app/api/fun-zone/pod-exchange/route.ts");
const market=read("lib/psx-v3-market-server.ts");
assert.match(ui,/Leaf Street Exchange/,"The arcade release must have a distinct identity");
assert.match(ui,/marketPulse/,"Players need an at-a-glance market summary");
assert.match(ui,/Leaf Street Journal/,"Market news must be on the playable exchange");
assert.ok(ui.indexOf('aria-label="Leaf Street intelligence"')<ui.indexOf('className={styles.marketPulse}'),"Journal must appear before market pulse");
assert.ok(ui.indexOf('className={styles.marketPulse}')<ui.indexOf('className={styles.companyCarousel}'),"Market pulse before stock choices");
assert.ok(ui.indexOf('className={styles.companyCarousel}')<ui.indexOf('className={styles.balances}'),"Portfolio summary follows stocks, not news");
assert.ok(ui.indexOf('className={styles.balances}')<ui.indexOf('className={styles.tradeSection}'),"Trading desk remains after portfolio overview");
assert.match(ui,/className=\{styles\.journalHelp\} onClick=\{\(\)=>setRulesOpen\(true\)\}/,"Help must be available near the top");
assert.match(ui,/\*quote\(stock\.symbol\)/,"Holding values must use shared PSX 2.0 quotes");
for(const topic of ["Know your Duck Bucks","Read the news first","Find a company","Buy and sell","Watch trading fees","Build your strategy","Save your progress"]){
 assert.ok(ui.includes(topic),"New beginner field guide must explain: "+topic);
}

assert.match(ui,/intelligenceRumour/,"Rumour Mill must be part of the trading view");
assert.doesNotMatch(ui,/Fictional market listings/,"Do not duplicate six-stock listings in one screen");
assert.match(ui,/STOCKS\.map\(stock=>/,"All six companies must remain selectable");
assert.match(ui,/requestAnimationFrame\(\(\)=>tradeRef/,"Stock tap must navigate toward trade controls");
assert.match(ui,/disabled=\{!allowed\}/,"Trading controls must disable on stale quotes");
assert.match(ui,/marketFeed\.mode==="v3"\?marketFeed\.quotes\[symbol\]/,"Trades must use published V3 prices");
assert.match(ui,/if\(!saveLocalSnapshot\(result\.portfolio/,"Local trades must save safely");
assert.match(ui,/!response\.ok\|\|!data\.exists\|\|!data\.portfolio/,"Cloud failures must not overwrite saved holdings");
assert.match(api,/quoteForCycle\(engine,trade\.symbol,trade\.cycle\)/,"Server independently verifies trade prices");
assert.match(market,/priceAt\(symbol,cycle\)/,"Historical prices remain reproducible");
assert.ok(market.includes(`.in("state",["active","retired"])`),"Published prices must survive retired releases");
assert.ok(market.includes(`.lte("cutover_cycle",arcadeCycleAt(Date.now()))`),"Future cutovers must not begin early");
for(const className of ["marketPulse","intelligenceContent","intelligenceRumour","pulsePrimary"]){
 assert.ok(styles.includes("."+className+"{"),"Missing themed arcade style: "+className);
}
assert.match(styles,/@media\(max-width:720px\)/,"The arcade must stay phone friendly");
assert.match(styles,/var\(--surface\)/,"Use theme tokens, not theme-specific backgrounds");

const secret="CI-ONLY-PSX-SEED-NOT-FOR-PRODUCTION-0123456789";
const now=new Date(Date.now()+86_400_000);now.setUTCSeconds(0,0);
const env={...process.env,CUTOVER_UTC:now.toISOString(),PSX_V3_SECRET:secret};
const run=spawnSync(process.execPath,["scripts/prepare-psx-release.mjs"],{encoding:"utf8",env});
assert.equal(run.status,0,"Release manifest generator must succeed: "+run.stderr);
assert.ok(!run.stdout.includes(secret),"Secret must never appear in release manifest");
const manifest=JSON.parse(run.stdout);
assert.equal(manifest.version,"psx-v3-release-1");
assert.equal(manifest.state,"testing","Never auto-activate the market in preflight");
assert.equal(manifest.seed_fingerprint,createHash("sha256").update(secret).digest("hex"));
assert.deepEqual(Object.keys(manifest.opening_prices).sort(),["BLUE","CLOWN","DUCK","MOO","PANDA","TITAN"]);
for(const price of Object.values(manifest.opening_prices))assert.ok(Number.isFinite(price)&&price>0);
const missing=spawnSync(process.execPath,["scripts/prepare-psx-release.mjs"],{encoding:"utf8",env:{...env,PSX_V3_SECRET:""}});
assert.notEqual(missing.status,0,"Cannot stage without private seed");
const past=spawnSync(process.execPath,["scripts/prepare-psx-release.mjs"],{encoding:"utf8",env:{...env,CUTOVER_UTC:"2020-01-01T00:00:00Z"}});
assert.notEqual(past.status,0,"Past cutovers must be rejected");
console.log("Leaf Street playable arcade UI, guarded trading, and no-write future release manifest verified.");

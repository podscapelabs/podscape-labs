import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import ts from "typescript";

const source=readFileSync(resolve("lib/pod-exchange.ts"),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const market=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
assert.equal(market.STOCKS.length,6);
assert.equal(new Set(market.STOCKS.map(s=>s.symbol)).size,6);
assert.equal(market.MARKET_INTERVAL_MS,300000);
assert.equal(market.STARTING_BUCKS,10000);
for(const t of [0,1,18,100000,1234567]){
 for(const stock of market.STOCKS){
  const p=market.priceAt(stock.symbol,t);
  assert.ok(Number.isFinite(p)&&p>0,"valid positive price");
  assert.equal(p,market.priceAt(stock.symbol,t),"deterministic price");
 }
}
let wallet=market.defaultPortfolio();
assert.equal(market.totalValue(wallet,125000),10000);
const p=market.priceAt("DUCK",125000);
const buy=market.executeOrder(wallet,"DUCK","buy",2,125000);
assert.equal(buy.ok,true,"purchase succeeded");
if(!buy.ok)throw Error("buy failed");
wallet=buy.portfolio;
assert.equal(wallet.holdings.DUCK,2);
assert.equal(wallet.cash,market.money(10000-p*2));
assert.equal(market.executeOrder(wallet,"DUCK","sell",3,125000).ok,false);
assert.equal(market.executeOrder(wallet,"DUCK","buy",99999,125000).ok,false);
assert.equal(market.executeOrder(wallet,"DUCK","buy",1.1,125000).ok,false);
assert.equal(market.executeOrder(wallet,"INVALID","buy",1,125000).ok,false);
const sell=market.executeOrder(wallet,"DUCK","sell",2,125000);
assert.equal(sell.ok,true);
if(!sell.ok)throw Error("sell failed");
assert.equal(sell.portfolio.cash,10000,"same-tick round trip balances exactly");
assert.equal(sell.portfolio.holdings.DUCK,undefined);
assert.equal(market.sanitizePortfolio({cash:-8,holdings:{}}).cash,10000);
const ui=readFileSync(resolve("app/fun-zone/pod-exchange/PodExchange.tsx"),"utf8");
const styling=readFileSync(resolve("app/fun-zone/pod-exchange/exchange.module.css"),"utf8");
const listing=readFileSync(resolve("app/fun-zone/FunZoneLibrary.tsx"),"utf8");
assert.ok(ui.includes('const duck=(n:number)=>"🦆 "'),"literal duck currency icon");
assert.ok(ui.includes("Duck Bucks"),"all cash is Duck Bucks");
assert.ok(ui.includes('role="status"'),"trade confirmation is accessible");
assert.ok(ui.includes("STORAGE_KEY"),"persist to device");
assert.ok(listing.includes('href:"/fun-zone/pod-exchange"'),"listed in Fun Zone");
assert.ok(styling.includes("var(--surface)"),"semantic theme surfaces");
assert.ok(!ui.includes("pod_coins")&&!ui.includes("member_progress"),"no purchasable coin integration");
console.log("The Pod Exchange beta: pricing, purchase, selling, invalid trades, wallet, accessibility and integration checks passed.");

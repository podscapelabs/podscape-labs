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
for(let block=100;block<112;block++){
 const stories=Array.from({length:market.NEWS.length},(_,i)=>market.newsAt((block*market.NEWS.length+i)*3));
 assert.equal(new Set(stories.map(story=>story.headline)).size,market.NEWS.length,
  "A story deck must have no duplicate headlines");
 const previous=market.newsAt((block*market.NEWS.length-1)*3);
 assert.notEqual(stories[0].headline,previous.headline,"Adjacent bulletin decks must not repeat a story");
}

assert.equal(market.TRADE_FEE_RATE,.005);
assert.equal(market.tradeFee(1000),5);
assert.equal(market.tradeTotal(100,2,"buy"),201);
assert.equal(market.tradeTotal(100,2,"sell"),199);
assert.equal(market.tradeFee(.01),.01);
// The clock and market never restart when a browser or calendar day changes.
for(const date of ["2026-11-10T00:00:00Z","2032-01-01T00:00:00Z","2050-06-15T13:17:00Z"]){
 const cycle=market.cycleAt(Date.parse(date));
 assert.equal(market.priceAt("DUCK",cycle),market.priceAt("DUCK",cycle),"Prices remain deterministic across years");
 assert.ok(market.headlineAt(cycle).story.headline,"Every future cycle has a market bulletin");
}
assert.equal(market.decodeSavedPortfolio(null).isNew,true,"Only a genuinely missing wallet starts fresh");
assert.equal(market.decodeSavedPortfolio(JSON.stringify(market.defaultPortfolio())).isNew,false,"Persisted wallet remains existing");
assert.throws(()=>market.decodeSavedPortfolio("{broken json"),/No balance was reset/,"Malformed data must never silently reset");
assert.throws(()=>market.decodeSavedPortfolio(JSON.stringify({cash:-1,holdings:{},trades:[]})),/No balance was reset/);

for(const cycle of [0,1,2,3,4,5,12,30000]){
 const headline=market.headlineAt(cycle);
 assert.ok(headline.story.headline&&headline.story.detail,"Every market tick has news");
 assert.equal(headline.publishedCycle,cycle-cycle%3,"Headlines publish every three ticks");
 assert.equal(headline.story,market.headlineAt(cycle-cycle%3).story,"Story persists until the next bulletin");
}

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
for(const stock of market.STOCKS){
 for(let tick=100000;tick<102000;tick++){
  const p=market.priceAt(stock.symbol,tick);
  assert.ok(p>=market.money(stock.base*.55)-.01,"Stock may not crash below its game floor");
  assert.ok(p<=market.money(stock.base*1.6)+.01,"Stock may not spiral above its game ceiling");
  assert.equal(p,market.priceAt(stock.symbol,tick),"Same UTC tick returns identical price");
 }
}
for(const start of [0,3,30000,200001]){
 const headline=market.headlineAt(start).story;
 assert.ok(Math.abs(market.newsImpactAt(headline.symbol,start)-headline.effect)<1e-10);
 assert.ok(Math.abs(market.newsImpactAt(headline.symbol,start+1)-headline.effect*.62)<1e-10);
 assert.ok(Math.abs(market.newsImpactAt(headline.symbol,start+2)-headline.effect*.3)<1e-10);
 assert.equal(market.newsImpactAt(headline.symbol,start+3),market.newsAt(start+3)?.symbol===headline.symbol?market.newsAt(start+3).effect:0);
}

const p=market.priceAt("DUCK",125000);
const buy=market.executeOrder(wallet,"DUCK","buy",2,125000);
assert.equal(buy.ok,true,"purchase succeeded");
if(!buy.ok)throw Error("buy failed");
wallet=buy.portfolio;
assert.equal(wallet.holdings.DUCK,2);
assert.equal(wallet.cash,market.money(10000-market.tradeTotal(p,2,"buy")));
assert.equal(market.executeOrder(wallet,"DUCK","sell",3,125000).ok,false);
assert.equal(market.executeOrder(wallet,"DUCK","buy",99999,125000).ok,false);
assert.equal(market.executeOrder(wallet,"DUCK","buy",1.1,125000).ok,false);
assert.equal(market.executeOrder(wallet,"INVALID","buy",1,125000).ok,false);
const sell=market.executeOrder(wallet,"DUCK","sell",2,125000);
assert.equal(sell.ok,true);
if(!sell.ok)throw Error("sell failed");
assert.equal(sell.portfolio.cash,market.money(10000-market.tradeFee(market.money(p*2))*2),"same-tick round trip pays fees and cannot print free money");
assert.equal(sell.portfolio.holdings.DUCK,undefined);
assert.ok(sell.portfolio.cash<10000,"Rapid same-price flipping must lose money");
assert.equal(market.executeOrder(market.defaultPortfolio(),"DUCK","sell",1,125000).ok,false);
assert.equal(market.sanitizePortfolio({cash:-8,holdings:{}}).cash,10000);
const home=readFileSync(resolve("components/HomeWidgets.tsx"),"utf8");
const homeNews=readFileSync(resolve("components/HomeMarketNews.tsx"),"utf8");
const homeCss=readFileSync(resolve("components/HomeMarketNews.module.css"),"utf8");
assert.ok(home.includes('if(id==="marketNews")return <HomeMarketNews/>'),"Home widget available in dashboard");
assert.ok(home.includes('marketNews:{name:"Market News"'),"Home widget registered for add-widget library");
assert.ok(homeNews.includes('headlineAt(cycle)'),"Home widget uses persistent canonical headlines");
assert.ok(homeNews.includes('href="/fun-zone/pod-exchange"'),"Home news links to Exchange");
assert.ok(homeCss.includes('var(--paper)')&&homeCss.includes('var(--forest)'),"Home news inherits themes");
const ui=readFileSync(resolve("app/fun-zone/pod-exchange/PodExchange.tsx"),"utf8");
const styling=readFileSync(resolve("app/fun-zone/pod-exchange/exchange.module.css"),"utf8");
const listing=readFileSync(resolve("app/fun-zone/FunZoneLibrary.tsx"),"utf8");
const duckIcon=readFileSync(resolve("components/DuckBucks.tsx"),"utf8");
const watchlist=readFileSync(resolve("app/fun-zone/PodExchangeWatchlist.tsx"),"utf8");
assert.ok(duckIcon.includes('fill="none"')&&duckIcon.includes('stroke="currentColor"'),"currency icon must be an outline");
assert.ok(duckIcon.includes('export function DuckBuckIcon'),"reusable outline duck icon");
assert.ok(ui.includes('<DuckBucks amount=')&&watchlist.includes('<DuckBucks amount='),"all currency values use shared formatter");
assert.ok(!ui.includes("🦆")&&!watchlist.includes("🦆"),"no emoji currency in Exchange or watchlist");
assert.ok(ui.includes("Duck Bucks"),"all cash is Duck Bucks");
assert.ok(ui.includes("headlineAt(cycle).story"),"Exchange always displays current story");
assert.ok(ui.includes('id="exchange-rules"')&&ui.includes("How to Play"),"Exchange has collapsible rules");
assert.ok(styling.includes(".rulesBody"),"Rules styled with theme roles");
assert.ok(ui.includes("tradeFee(subtotal)")&&ui.includes("tradeTotal(price,count,side)"),"Trade desk must show server-matching fee");
assert.ok(ui.includes("newsImpactAt(news.symbol,cycle)"),"News bulletin must display actual mathematical impact");
const walletMigration=readFileSync(resolve("supabase/migrations/20261110234500_pod_exchange_persistent_portfolios.sql"),"utf8");
const feeMigration=readFileSync(resolve("supabase/migrations/20261111034000_pod_exchange_trade_fee_parity.sql"),"utf8");
assert.ok(walletMigration.includes("member_exchange_portfolios"),"Account wallets are created before fee repair");
assert.ok(feeMigration.includes("total_cost*0.005"),"Final database function must use same trade fee as local wallet");
assert.ok(feeMigration.includes("net_total>wallet.cash"),"Cloud purchases must include fees in affordability checks");
assert.ok(ui.includes('role="status"'),"trade confirmation is accessible");
assert.ok(ui.includes("STORAGE_KEY"),"persist to device");
assert.ok(listing.includes('href:"/fun-zone/pod-exchange"'),"listed in Fun Zone");
assert.ok(styling.includes("var(--surface)"),"semantic theme surfaces");
assert.ok(!ui.includes("pod_coins")&&!ui.includes("member_progress"),"no purchasable coin integration");
console.log("The Pod Exchange beta: pricing, purchase, selling, invalid trades, wallet, accessibility and integration checks passed.");

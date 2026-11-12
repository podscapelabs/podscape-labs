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

assert.equal(market.ARCADE_INTERVAL_MS,60000);
assert.ok(market.ARCADE_CYCLE_TAG>market.cycleAt(Date.now())*50);
assert.equal(market.arcadeCycleAt(market.ARCADE_START_MS-60000),market.cycleAt(market.ARCADE_START_MS-60000));
const arcadeStart=market.arcadeCycleAt(market.ARCADE_START_MS);
assert.equal(arcadeStart,market.ARCADE_CYCLE_TAG+Math.floor(market.ARCADE_START_MS/60000));
assert.equal(market.arcadeCycleAt(market.ARCADE_START_MS+60000),arcadeStart+1);
assert.equal(market.tickIntervalFor(arcadeStart),60000);
assert.equal(market.tickIntervalFor(market.cycleAt(market.ARCADE_START_MS-60000)),300000);
for(const offset of [0,1,2,4,5,60,359,360,700]){
 const tick=arcadeStart+offset;
 const session=market.marketSessionAt(tick);
 assert.equal(session.endCycle-session.startCycle,360,"Catalyst must remain six hours under minute cycles");
 assert.ok(session.startCycle<=tick&&tick<session.endCycle);
 assert.equal(market.sessionImpactAt(session.featured,session.startCycle),0);
 assert.equal(market.sessionImpactAt(session.featured,session.endCycle),0);
 const bulletin=market.headlineAt(tick);
 assert.equal(bulletin.publishedCycle,tick-((tick-market.ARCADE_CYCLE_TAG)%5));
 assert.ok(bulletin.story.headline);
 for(const stock of market.STOCKS){
  const price=market.priceAt(stock.symbol,tick);
  assert.ok(Number.isFinite(price)&&price>0);
  assert.equal(price,market.priceAt(stock.symbol,tick),"Shared price reproducible on every device");
 }
}
for(const offset of [0,1,5,10,15]){
 const tick=arcadeStart+offset;
 assert.equal(market.headlineAt(tick).story,market.headlineAt(tick+Math.min(4,4-offset%5)).story,"Bulletins stay for five minutes");
}
for(const symbol of ["DUCK","MOO","PANDA","BLUE","TITAN","CLOWN"]){
 const quotes=Array.from({length:30},(_,i)=>market.priceAt(symbol,arcadeStart+i));
 assert.ok(new Set(quotes).size>=12,"Fast arcade prices should actually change between minutes");
}
const newTrade=market.executeOrder(market.defaultPortfolio(),"MOO","buy",2,arcadeStart);
assert.ok(newTrade.ok,"Versioned market quotes allow ordinary trades");
const arcadeMigration=readFileSync(resolve("supabase/migrations/202611110010_pod_exchange_arcade_minute_settlement.sql"),"utf8");
assert.match(arcadeMigration,/1000000000\+floor\(extract\(epoch from now\(\)\)\/60\)/,"Database checks the minute clock");
assert.match(arcadeMigration,/floor\(extract\(epoch from now\(\)\)\/300\)/,"Old five-minute trades remain accepted");

for(let block=100;block<112;block++){
 const stories=Array.from({length:market.NEWS.length},(_,i)=>market.newsAt((block*market.NEWS.length+i)*3));
 assert.equal(new Set(stories.map(story=>story.headline)).size,market.NEWS.length,
  "A story deck must have no duplicate headlines");
 const previous=market.newsAt((block*market.NEWS.length-1)*3);
 assert.notEqual(stories[0].headline,previous.headline,"Adjacent bulletin decks must not repeat a story");
}

// Timed market events are shared and deterministic. Legacy pricing stays frozen.
assert.ok(market.MARKET_V2_START_CYCLE>market.cycleAt(Date.parse("2026-11-11T00:00:00Z")));
assert.equal(market.MARKET_SESSION_TICKS,72);
for(const tick of [market.MARKET_V2_START_CYCLE,market.MARKET_V2_START_CYCLE+59,market.MARKET_V2_START_CYCLE+250]){
 const session=market.marketSessionAt(tick);
 assert.ok(session.title&&session.detail&&session.featured);
 assert.equal(session.endCycle-session.startCycle,72);
 assert.deepEqual(session,market.marketSessionAt(tick));
 assert.equal(market.sessionImpactAt(session.featured,session.startCycle),0);
 assert.equal(market.sessionImpactAt(session.featured,session.endCycle),0);
 assert.ok(Math.abs(market.sessionImpactAt(session.featured,session.startCycle+36))>=.14);
 for(const stock of market.STOCKS){
  const quote=market.priceAt(stock.symbol,tick);
  assert.ok(quote>0&&Number.isFinite(quote));
  assert.equal(quote,market.priceAt(stock.symbol,tick));
 }
}
assert.equal(market.sessionImpactAt("DUCK",market.MARKET_V2_START_CYCLE-1),0);
for(const cash of [0,20,10000,100000]){
 const count=market.maxAffordableShares(146.29,cash);
 assert.ok(count>=0&&count<=999999);
 if(count>0)assert.ok(market.tradeTotal(146.29,count,"buy")<=cash);
 if(count<999999)assert.ok(market.tradeTotal(146.29,count+1,"buy")>cash);
}

assert.equal(market.TRADE_FEE_RATE,.005);
assert.equal(market.tradeFee(1000),5);
assert.equal(market.tradeTotal(100,2,"buy"),201);
assert.equal(market.tradeTotal(100,2,"sell"),199);
assert.equal(market.tradeFee(.01),.01);
assert.equal(market.tradeFee(3),.02,"3 Duck Bucks has a half-cent fee rounded up");
assert.equal(market.tradeFee(5),.03,"5 Duck Bucks has a half-cent fee rounded up");
assert.equal(market.tradeSubtotal(19.99,137),2738.63,"Large orders must use exact integer cents");
assert.equal(market.tradeTotal(19.99,137,"buy"),2752.32,"Buy amount includes the cent-exact trading fee");
assert.equal(market.tradeTotal(19.99,137,"sell"),2724.94,"Sell amount subtracts the same fee");

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
assert.ok(ui.includes("marketSessionAt(cycle)")&&ui.includes("sessionImpactAt("),"Six-hour market agenda uses deterministic prices");
assert.ok(ui.includes("chartHours")&&ui.includes("24h"),"Charts support a full-day view");
assert.ok(ui.includes("maxAffordableShares(price,portfolio.cash)"),"Quick-fill respects fees");
assert.ok(ui.indexOf('className={styles.marketLeadersLink}')>ui.indexOf('className={styles.columns}'),"Trading appears before secondary ranking navigation");
assert.ok(ui.includes("headlineAt(cycle).story"),"Exchange always displays current story");
assert.ok(ui.includes("rulesOpen?createPortal(")&&ui.includes("PodscapeInfoDialog")&&ui.includes("How to Play"),"Exchange rules use the shared information sheet");
assert.ok(styling.includes(".gameRules")&&styling.includes(".rulesShortcut"),"Shared rules shortcut uses theme roles");
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

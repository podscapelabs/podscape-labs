import "server-only";
import {createHash,timingSafeEqual} from "node:crypto";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {arcadeCycleAt,priceAt,STOCKS} from "@/lib/pod-exchange";
import {ENGINE_VERSION,SYMBOLS,quoteAt,publicMarketFrame,type PsxSymbol} from "@/lib/psx-v3-prototype.mjs";

export type ActivePsxV3={
 version:string;cutoverCycle:number;secret:string;openingPrices:Record<PsxSymbol,number>;
};
export type ChartRange="10m"|"30m"|"1h"|"24h";
const chartRanges:Record<ChartRange,{minutes:number;spacing:number}>={
 "10m":{minutes:10,spacing:1},"30m":{minutes:30,spacing:1},
 "1h":{minutes:60,spacing:1},"24h":{minutes:1440,spacing:15}
};
function validateOpeningPrices(value:unknown,cutoverCycle:number){
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("PSX V3 opening quotes unavailable");
 const prices={} as Record<PsxSymbol,number>;
 for(const symbol of SYMBOLS){
  const price=(value as Record<string,unknown>)[symbol];
  if(typeof price!=="number"||!Number.isFinite(price)||price<=0||
   Math.round(price*100)/100!==price||price!==priceAt(symbol,cutoverCycle-1))
   throw Error("PSX V3 opening quotes disagree with legacy market history");
  prices[symbol]=price;
 }
 return prices;
}
export async function getActivePsxV3():Promise<ActivePsxV3|null>{
 const admin=getSupabaseAdmin();
 if(!admin)return null;
 const {data,error}=await admin.from("psx_market_versions")
  .select("version,state,cutover_cycle,opening_prices,seed_fingerprint")
  .eq("version",ENGINE_VERSION).eq("state","active").maybeSingle();
 // Backward compatible while the opt-in additive migration has not been applied.
 if(error&&["42P01","PGRST205","PGRST116"].includes(error.code||""))return null;
 if(error)throw Error("PSX market version storage unavailable");
 if(!data)return null;
 const cutoverCycle=Number(data.cutover_cycle);
 if(!Number.isSafeInteger(cutoverCycle)||cutoverCycle<1_000_000_000)
  throw Error("Invalid PSX market cutover cycle");
 const secret=process.env.PSX_V3_SECRET;
 if(!secret||secret.length<32)throw Error("PSX V3 private market seed is unavailable");
 const calculated=createHash("sha256").update(secret).digest();
 const claimed=String(data.seed_fingerprint||"");
 if(!/^[0-9a-f]{64}$/.test(claimed)||!timingSafeEqual(calculated,Buffer.from(claimed,"hex")))
  throw Error("PSX V3 private market seed does not match the approved version");
 return {version:ENGINE_VERSION,cutoverCycle,secret,openingPrices:validateOpeningPrices(data.opening_prices,cutoverCycle)};
}
export function quoteForCycle(config:ActivePsxV3|null,symbol:string,cycle:number){
 if(!STOCKS.some(x=>x.symbol===symbol)||!Number.isSafeInteger(cycle))
  throw Error("Invalid PSX quote request");
 if(!config||cycle<config.cutoverCycle)return priceAt(symbol,cycle);
 return quoteAt({secret:config.secret,symbol:symbol as PsxSymbol,
  minute:cycle-config.cutoverCycle,openingPrice:config.openingPrices[symbol as PsxSymbol]});
}
export function quotesForCycle(config:ActivePsxV3|null,cycle:number){
 return Object.fromEntries(STOCKS.map(stock=>[stock.symbol,quoteForCycle(config,stock.symbol,cycle)])) as Record<PsxSymbol,number>;
}
export function portfolioWorthWithQuotes(
 cash:number,holdings:Record<string,number>,quotes:Record<string,number>
){
 return (Math.round(cash*100)+STOCKS.reduce((sum,stock)=>
  sum+Math.round(quotes[stock.symbol]*100)*(holdings[stock.symbol]||0),0))/100;
}
/** Shared read-only market feed; no client-side V3 future price calculations. */
export async function getPsxLiveMarket(range:ChartRange="30m",nowMs=Date.now()){
 const cycle=arcadeCycleAt(nowMs);
 const config=await getActivePsxV3();
 if(!config||cycle<config.cutoverCycle)return {mode:"legacy" as const,cycle};
 const minute=cycle-config.cutoverCycle;
 const current=publicMarketFrame({secret:config.secret,minute,openingPrices:config.openingPrices});
 const previous=quotesForCycle(config,cycle-1);
 const {minutes,spacing}=chartRanges[range];
 const history=Object.fromEntries(STOCKS.map(stock=>{
  const frames:Array<{cycle:number;price:number}>=[];
  for(let offset=minutes;offset>=0;offset-=spacing){
   const marketCycle=cycle-offset;
   frames.push({cycle:marketCycle,price:quoteForCycle(config,stock.symbol,marketCycle)});
  }
  if(frames.at(-1)?.cycle!==cycle)frames.push({cycle,price:current.prices[stock.symbol as PsxSymbol]});
  return [stock.symbol,frames];
 })) as Record<PsxSymbol,Array<{cycle:number;price:number}>>;
 return {mode:"v3" as const,cycle,quotes:current.prices,previous,history,range,
  major:current.major,bulletin:current.bulletin,rumour:current.rumour,
  rumourResolution:current.rumourResolution,minute,cutoverCycle:config.cutoverCycle};
}
export function isChartRange(value:string):value is ChartRange{return value==="10m"||value==="30m"||value==="1h"||value==="24h"}

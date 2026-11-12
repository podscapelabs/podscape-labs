import "server-only";
import {createHash,timingSafeEqual} from "node:crypto";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {arcadeCycleAt} from "@/lib/pod-exchange";
import {ENGINE_VERSION,SYMBOLS,publicMarketFrame,quoteAt,type PsxSymbol} from "@/lib/psx-v3-prototype.mjs";

const BACKFILL_WINDOW=1440;
type VersionRow={version:string;state:string;cutover_cycle:number|string;opening_prices:unknown;seed_fingerprint:string};
type PsxRange="10m"|"30m"|"1h"|"24h";
const ranges:Record<PsxRange,{minutes:number;step:number}>={
 "10m":{minutes:10,step:1},
 "30m":{minutes:30,step:1},
 "1h":{minutes:60,step:1},
 "24h":{minutes:1440,step:15}
};
function priceMap(value:unknown):Record<PsxSymbol,number>{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid PSX cutover prices");
 const prices={} as Record<PsxSymbol,number>;
 for(const symbol of SYMBOLS){
  const p=(value as Record<string,unknown>)[symbol];
  if(typeof p!=="number"||!Number.isFinite(p)||p<=0||Math.round(p*100)/100!==p)throw Error("Invalid PSX opening quote");
  prices[symbol]=p;
 }
 return prices;
}
function secretFor(row:VersionRow){
 const secret=process.env.PSX_V3_SECRET;
 if(!secret||secret.length<32)throw Error("Private PSX preview seed unavailable");
 const actual=createHash("sha256").update(secret).digest("hex");
 if(!/^[a-f0-9]{64}$/.test(row.seed_fingerprint)||!timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(row.seed_fingerprint,"hex")))
  throw Error("PSX version has an unmatched seed fingerprint");
 return secret;
}
/** Owner-only prototype. Does not change wallets, expose future quotes, or place trades. */
export async function getPsxV3Preview(range:PsxRange="30m",nowMs=Date.now()){
 if(process.env.PSX_V3_PREVIEW_ENABLED!=="true")return {available:false as const,reason:"Preview disabled"};
 const admin=getSupabaseAdmin();
 if(!admin)return {available:false as const,reason:"Server storage unavailable"};
 const {data,error}=await admin.from("psx_market_versions")
  .select("version,state,cutover_cycle,opening_prices,seed_fingerprint")
  .eq("version",ENGINE_VERSION).eq("state","testing").maybeSingle();
 if(error||!data)return {available:false as const,reason:"No staged market version"};
 const row=data as VersionRow;
 const cutover=Number(row.cutover_cycle);
 const cycle=arcadeCycleAt(nowMs);
 if(!Number.isSafeInteger(cycle)||!Number.isSafeInteger(cutover)||cycle<cutover)
  return {available:false as const,reason:"Market cutover not reached"};
 const minute=cycle-cutover;
 if(!Number.isSafeInteger(minute)||minute<0)return {available:false as const,reason:"Invalid market clock"};
 const secret=secretFor(row),openingPrices=priceMap(row.opening_prices);
 const frame=publicMarketFrame({secret,minute,openingPrices});
 const {minutes,step}=ranges[range];
 const from=Math.max(0,minute-Math.min(minutes,BACKFILL_WINDOW));
 const history=Object.fromEntries(SYMBOLS.map(symbol=>{
  const quotes:Array<{minute:number;price:number}>=[];
  for(let i=from;i<=minute;i+=step)quotes.push({minute:i,price:quoteAt({secret,symbol,minute:i,openingPrice:openingPrices[symbol]})});
  if(quotes.at(-1)?.minute!==minute)quotes.push({minute,price:frame.prices[symbol]});
  return [symbol,quotes];
 })) as Record<PsxSymbol,Array<{minute:number;price:number}>>;
 return {available:true as const,cycle,frame,history,range,clockSeconds:60};
}
export function isPsxRange(range:string):range is PsxRange{
 return range==="10m"||range==="30m"||range==="1h"||range==="24h";
}

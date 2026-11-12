import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {ARCADE_CYCLE_TAG} from "@/lib/pod-exchange";
import {ENGINE_VERSION,SYMBOLS,quoteAt,publicMarketFrame,type PsxSymbol} from "@/lib/psx-v3-prototype.mjs";

type HistoryInput={
 secret:string;version:string;cutoverCycle:number;
 openingPrices:Record<PsxSymbol,number>;
 firstMinute:number;lastMinute:number;nowCycle:number;
};
const MAX_MINUTES_PER_BATCH=30;
const MAX_MINUTES_PER_REQUEST=180;
const atTime=(cycle:number)=>new Date((cycle-ARCADE_CYCLE_TAG)*60_000).toISOString();
/**
 * Idempotently materialize **released** quotes and news.
 *
 * This is an optional bounded persistence task, not a prerequisite for the
 * continuous clock. Server-verified V3 prices can be reconstructed after long
 * idle periods; the minute calculation works even without a running cron.
 *
 * Mutations only target V3 tables and cannot change legacy orders or wallets.
 * Caller must load a verified market version and fingerprint-checked secret.
 */
export async function persistPublishedPsxV3Window(input:HistoryInput){
 const {secret,version,cutoverCycle,openingPrices,firstMinute,lastMinute,nowCycle}=input;
 if(version!==ENGINE_VERSION||!Number.isSafeInteger(cutoverCycle)||
  !Number.isSafeInteger(firstMinute)||!Number.isSafeInteger(lastMinute)||
  !Number.isSafeInteger(nowCycle)||firstMinute<0||lastMinute<firstMinute||
  lastMinute-firstMinute+1>MAX_MINUTES_PER_REQUEST||
  cutoverCycle+lastMinute>nowCycle)
  throw Error("Invalid or unpublished PSX V3 persistence window");
 const db=getSupabaseAdmin();
 if(!db)throw Error("PSX market storage unavailable");
 const summaries=new Map<string,{version:string;event_id:string;event_kind:string;symbol:string;headline:string;details:string;published_cycle:number;published_at:string;related_event_id?:string;resolution?:string}>();
 let storedMinutes=0;
 for(let start=firstMinute;start<=lastMinute;start+=MAX_MINUTES_PER_BATCH){
  const finish=Math.min(start+MAX_MINUTES_PER_BATCH-1,lastMinute);
  const rows:Array<{version:string;market_cycle:number;minute_index:number;symbol:string;price:number;observed_at:string}>=[];
  for(let minute=start;minute<=finish;minute++){
   const cycle=cutoverCycle+minute,observedAt=atTime(cycle);
   for(const symbol of SYMBOLS)rows.push({
    version,market_cycle:cycle,minute_index:minute,symbol,
    price:quoteAt({secret,symbol,minute,openingPrice:openingPrices[symbol]}),observed_at:observedAt
   });
   const frame=publicMarketFrame({secret,minute,openingPrices});
   const add=(id:string,kind:string,symbol:string,headline:string,details:string,releaseMinute:number,relatedId?:string,resolution?:string)=>{
    const publishedCycle=cutoverCycle+releaseMinute;
    if(publishedCycle>nowCycle)throw Error("Unreleased PSX event materialization blocked");
    summaries.set(id,{version,event_id:id,event_kind:kind,symbol,headline,details,published_cycle:publishedCycle,
     published_at:atTime(publishedCycle),related_event_id:relatedId,resolution});
   };
   add(frame.major.id,"major",frame.major.symbol,frame.major.headline,frame.major.detail,frame.major.publishedMinute);
   add(frame.bulletin.id,"bulletin",frame.bulletin.symbol,frame.bulletin.headline,frame.bulletin.detail,frame.bulletin.publishedMinute);
   if(frame.rumour)add(frame.rumour.id,"rumour",frame.rumour.symbol,frame.rumour.headline,frame.rumour.detail,frame.rumour.fromMinute);
   if(frame.rumourResolution){
    const reveal=frame.rumourResolution;
    const eventMinute=Math.floor(minute/360)*360;
    add("resolution:"+reveal.rumourId,"resolution",reveal.confirmedSymbol,
     "Rumour resolved: "+reveal.resolution,reveal.publishedHeadline,eventMinute,reveal.rumourId,reveal.resolution);
   }
  }
  const {error}=await db.from("psx_market_price_history")
   .upsert(rows,{onConflict:"version,minute_index,symbol",ignoreDuplicates:true});
  if(error)throw Error("Unable to persist PSX published prices safely");
  storedMinutes+=finish-start+1;
 }
 if(summaries.size){
  const events=[...summaries.values()];
  for(let start=0;start<events.length;start+=200){
   const {error}=await db.from("psx_market_event_history")
    .upsert(events.slice(start,start+200),{onConflict:"version,event_id",ignoreDuplicates:true});
   if(error)throw Error("Unable to persist published PSX events safely");
  }
 }
 return {ok:true,storedMinutes,eventCount:summaries.size,version};
}

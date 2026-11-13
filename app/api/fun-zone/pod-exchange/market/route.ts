import {after,NextRequest,NextResponse} from "next/server";
import {catchUpPublishedPsxV3History} from "@/lib/psx-v3-history-server";
import {getPsxLiveMarket,isChartRange} from "@/lib/psx-v3-market-server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"public, no-store, max-age=0"};
// An active server instance only needs to schedule one catch-up per published minute.
// Historical price reconstruction remains deterministic if an instance shuts down.
let lastScheduledHistoryCycle=-1;
/** Read-only shared quotes. Never accepts a future cycle or client-set price. */
export async function GET(request:NextRequest){
 const range=request.nextUrl.searchParams.get("range")||"30m";
 if(!isChartRange(range))return NextResponse.json({error:"Invalid chart range"},{status:400,headers});
 try{
  const snapshot=await getPsxLiveMarket(range);
  if(snapshot.mode==="v3"&&snapshot.cycle!==lastScheduledHistoryCycle){
   lastScheduledHistoryCycle=snapshot.cycle;
   after(async()=>{
   try{await catchUpPublishedPsxV3History(Date.now(),30)}
   catch(error){console.error("PSX published-history catch-up failed",error instanceof Error?error.name:"unknown")}
   });
  }
  return NextResponse.json(snapshot,{headers});
 }catch(error){
  console.error("PSX market quote error",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"Live market temporarily unavailable"},{status:503,headers});
 }
}

import {NextResponse} from "next/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {STARTING_BUCKS,cycleAt,isValidPortfolioSnapshot,totalValue,type Portfolio} from "@/lib/pod-exchange";
export const dynamic="force-dynamic";
// Once a week, only the server can create a baseline for next week's Movers board.
// Do not generate a retrospective baseline from user-selected values.
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)
  return NextResponse.json({error:"Unauthorized"},{status:401});
 const now=new Date();
 if(now.getUTCDay()!==1||now.getUTCHours()!==0)
  return NextResponse.json({skipped:true,reason:"Weekly snapshots run Monday at 00:10 UTC"});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Market storage unavailable"},{status:503});
 const weekStart=now.toISOString().slice(0,10),cycle=cycleAt(now.getTime());
 const previousWeek=new Date(now.getTime()-7*86400000).toISOString().slice(0,10);
 const candidates:Array<{userId:string;value:number;returnPct:number;weeklyPct:number|null}>=[];
 let created=0;
 for(let offset=0;offset<5000;offset+=500){
  const prefs=await admin.from("member_exchange_ranking_preferences")
   .select("user_id").eq("eligible",true).eq("public_enabled",true)
   .order("user_id",{ascending:true}).range(offset,offset+499);
  if(prefs.error)return NextResponse.json({error:"Failed to retrieve participants"},{status:503});
  if(!prefs.data?.length)break;
  const ids=prefs.data.map(p=>p.user_id);
  for(let i=0;i<ids.length;i+=150){
   const wallets=await admin.from("member_exchange_portfolios")
    .select("user_id,cash,holdings").in("user_id",ids.slice(i,i+150));
   if(wallets.error)return NextResponse.json({error:"Could not read portfolios"},{status:503});
   const prev=await admin.from("member_exchange_weekly_snapshots")
    .select("user_id,baseline_value").eq("week_start",previousWeek)
    .in("user_id",ids.slice(i,i+150));
   if(prev.error)return NextResponse.json({error:"Cannot verify previous week's market baselines"},{status:503});
   const oldBaselines=new Map((prev.data||[]).map(p=>[p.user_id,Number(p.baseline_value)]));
   const records=(wallets.data||[]).flatMap(w=>{
    const portfolio:Portfolio={cash:Number(w.cash),holdings:w.holdings as Record<string,number>,trades:[]};
    if(!isValidPortfolioSnapshot(portfolio))return [];
    const baseline=totalValue(portfolio,cycle);
    if(!Number.isFinite(baseline)||baseline<=0)return [];
    const previous=oldBaselines.get(w.user_id);
    candidates.push({userId:w.user_id,value:baseline,
     returnPct:(baseline-STARTING_BUCKS)/STARTING_BUCKS*100,
     weeklyPct:previous!==undefined&&previous>0?(baseline-previous)/previous*100:null});
    return [{user_id:w.user_id,week_start:weekStart,market_cycle:cycle,baseline_value:baseline}];
   });
   if(records.length){
    const result=await admin.from("member_exchange_weekly_snapshots").upsert(records,{
     onConflict:"user_id,week_start",ignoreDuplicates:true
    });
    if(result.error)return NextResponse.json({error:"Could not persist weekly baseline"},{status:503});
    created+=records.length;
   }
  }
  if(prefs.data.length<500)break;
 }
 // The settled Monday price checkpoint is the only source of market placement
 // achievements. Two eligible investors are required; awards are one-time.
 let awarded=0;
 if(candidates.length>=2){
  const bestWealth=Math.max(...candidates.map(c=>c.value));
  const bestReturn=Math.max(...candidates.map(c=>c.returnPct));
  const previousParticipants=candidates.filter(c=>c.weeklyPct!==null);
  const bestWeekly=previousParticipants.length>=2?
   Math.max(...previousParticipants.map(c=>c.weeklyPct!)):-Infinity;
  const honors=[
   {key:"exchange_market_mogul",winners:candidates.filter(c=>
    c.value===bestWealth&&c.value>STARTING_BUCKS)},
   {key:"exchange_sharp_trader",winners:candidates.filter(c=>
    c.returnPct===bestReturn&&c.returnPct>=10)},
   {key:"exchange_weekly_mover",winners:previousParticipants.filter(c=>
    c.weeklyPct===bestWeekly&&bestWeekly>=5)}
  ];
  for(const honor of honors)for(const winner of honor.winners){
   const result=await admin.rpc("award_exchange_market_achievement",{
    p_user_id:winner.userId,p_achievement_key:honor.key
   });
   if(result.error)return NextResponse.json({error:"Market achievement settlement unavailable"},{status:503});
   if(result.data===true)awarded++;
  }
 }
 return NextResponse.json({ok:true,weekStart,processed:created,achievementsAwarded:awarded},
  {headers:{"Cache-Control":"no-store"}});
}

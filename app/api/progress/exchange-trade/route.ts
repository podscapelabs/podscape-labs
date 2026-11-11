import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {achievementCatalog} from "@/data/achievement-catalog";
import {cycleAt,priceAt,STOCKS,type Trade} from "@/lib/pod-exchange";

/** The trade game remains local during beta. We independently verify the
 * market timestamp/price and grant capped, one-time participation milestones.
 * No Pod Coins, real value, or portfolio balance is ever sent to this endpoint.
 */
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>1800)
  return NextResponse.json({error:"Request too large"},{status:413});
 const db=await customerSupabase();
 if(!db)return NextResponse.json({error:"Sign-in required"},{status:401});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user?.id||!user.email||!user.email_confirmed_at)
  return NextResponse.json({error:"Verified account required"},{status:401});
 if(user.app_metadata?.role!=="owner"&&(await testerAccessStatus(user.email))!=="approved"&&!(await isAdminAuthenticated()))
  return NextResponse.json({error:"Early access approval required"},{status:403});
 let value:unknown;
 try{value=await request.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!value||typeof value!=="object")return NextResponse.json({error:"Invalid trade"},{status:400});
 const trade=(value as {trade?:unknown}).trade as Partial<Trade>|undefined;
 if(!trade||typeof trade!=="object"||typeof trade.id!=="string"||
  trade.id.length<12||trade.id.length>150||!/^\d+:(DUCK|MOO|PANDA|BLUE|TITAN|CLOWN):(buy|sell):\d+:[a-z0-9]+$/.test(trade.id)||
  typeof trade.symbol!=="string"||!STOCKS.some(s=>s.symbol===trade.symbol)||
  (trade.side!=="buy"&&trade.side!=="sell")||
  !Number.isSafeInteger(trade.shares)||Number(trade.shares)<1||Number(trade.shares)>1_000_000||
  !Number.isSafeInteger(trade.cycle)||typeof trade.unitPrice!=="number")
  return NextResponse.json({error:"Invalid trade details"},{status:400});
 const cycle=Number(trade.cycle);
 const submitted=trade.id.split(":");
 if(Number(submitted[0])!==cycle||submitted[1]!==trade.symbol||submitted[2]!==trade.side||
  Math.abs(cycleAt(Date.now())-cycle)>1||priceAt(trade.symbol,cycle)!==trade.unitPrice)
  return NextResponse.json({error:"Trade does not match the current simulated market"},{status:400});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Progress unavailable"},{status:503});
 const {data,error}=await admin.rpc("record_member_exchange_trade",{
  p_user_id:user.id,p_trade_id:trade.id,p_symbol:trade.symbol,p_side:trade.side,
  p_shares:trade.shares,p_market_cycle:cycle
 });
 if(error){console.error("Exchange achievement failed",error.code);return NextResponse.json({error:"Progress unavailable"},{status:503})}
 const unlocked=(Array.isArray(data)?data:[]).flatMap(row=>{
  const def=achievementCatalog.find(a=>a.key===row.achievement_key&&a.status==="available");
  return def?[{id:def.key,title:def.title,description:def.description,exp:def.exp,coins:0,hidden:def.hidden===true}]:[];
 });
 return NextResponse.json({saved:true,unlocked});
}

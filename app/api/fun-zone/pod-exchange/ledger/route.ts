import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {arcadeCycleAt,isValidPortfolioSnapshot} from "@/lib/pod-exchange";
import {getActivePsxV3,quoteForCycle,quotesForCycle} from "@/lib/psx-v3-market-server";
import {auditExchangeLedger} from "@/lib/exchange-ranking-audit";
import {calculatePsxPerformance,type PsxLedgerOrder} from "@/lib/psx-ledger";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
/** Read-only player-owned full-history FIFO report. Not part of trade settlement. */
export async function GET(){
 const client=await customerSupabase();
 if(!client)return NextResponse.json({error:"Authentication unavailable"},{status:503,headers});
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at||!user.email)
  return NextResponse.json({error:"Sign in to view market profits"},{status:401,headers});
 if(user.app_metadata?.role!=="owner"&&(await testerAccessStatus(user.email))!=="approved"&&!(await isAdminAuthenticated()))
  return NextResponse.json({error:"Early access approval required"},{status:403,headers});
 const db=getSupabaseAdmin();
 if(!db)return NextResponse.json({error:"Market storage unavailable"},{status:503,headers});
 try{
  const {data:wallet,error:walletError}=await db.from("member_exchange_portfolios")
   .select("cash,holdings").eq("user_id",user.id).maybeSingle();
  if(walletError)throw Error("Wallet read failed");
  if(!wallet)return NextResponse.json({available:false,reason:"Start trading to view your ledger"},{headers});
  const snapshot={cash:Number(wallet.cash),holdings:wallet.holdings as Record<string,number>,trades:[]};
  if(!isValidPortfolioSnapshot(snapshot))throw Error("Wallet validation failed");
  const orders:PsxLedgerOrder[]=[];
  for(let start=0;start<=5000;start+=1000){
   const result=await db.from("member_exchange_orders")
    .select("trade_id,cycle,symbol,side,shares,unit_price,created_at")
    .eq("user_id",user.id).order("cycle",{ascending:true})
    .order("created_at",{ascending:true}).range(start,start+999);
   if(result.error)throw Error("Full trade ledger read failed");
   orders.push(...(result.data||[]).map(row=>({
    trade_id:row.trade_id,cycle:Number(row.cycle),symbol:row.symbol,
    side:row.side as "buy"|"sell",shares:row.shares,
    unit_price:Number(row.unit_price),created_at:row.created_at
   })));
   if(!result.data||result.data.length<1000)break;
  }
  if(orders.length>5000)return NextResponse.json({available:false,reason:"Large historical ledger needs extended verification"},{headers});
  const engine=await getActivePsxV3();
  const audit=auditExchangeLedger(snapshot,orders,(symbol,cycle)=>quoteForCycle(engine,symbol,cycle));
  if(!audit.ok)return NextResponse.json({available:false,reason:"Historical portfolio needs reconciliation; no balances were changed"},{headers});
  const cycle=arcadeCycleAt(Date.now()),quotes=quotesForCycle(engine,cycle);
  const performance=calculatePsxPerformance(orders,snapshot,quotes);
  if(!performance.verified)return NextResponse.json({available:false,reason:performance.reason||"Ledger reconciliation incomplete"},{headers});
  return NextResponse.json({available:true,cycle,...performance,accounting:"FIFO; includes buy/sell fees; excludes hypothetical sale fees"},{headers});
 }catch(error){
  console.error("PSX private profit report unavailable",error instanceof Error?error.message:"unknown");
  return NextResponse.json({error:"Could not verify full market history; no data was changed"},{status:503,headers});
 }
}

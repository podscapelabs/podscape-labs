import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {STOCKS,STARTING_BUCKS,cycleAt,priceAt,isValidPortfolioSnapshot,sanitizePortfolio,type Portfolio,type Trade} from "@/lib/pod-exchange";
import {achievementCatalog} from "@/data/achievement-catalog";

async function account(){
 const db=await customerSupabase();
 if(!db)return {error:NextResponse.json({error:"Authentication unavailable"},{status:503})};
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user?.id||!user.email_confirmed_at||!user.email)
  return {error:NextResponse.json({error:"Sign in to sync your portfolio"},{status:401})};
 if(user.app_metadata?.role!=="owner"&&(await testerAccessStatus(user.email))!=="approved"&&!(await isAdminAuthenticated()))
  return {error:NextResponse.json({error:"Early access approval required"},{status:403})};
 const admin=getSupabaseAdmin();
 if(!admin)return {error:NextResponse.json({error:"Market storage unavailable"},{status:503})};
 return {user,admin};
}
async function readPortfolio(admin:NonNullable<Awaited<ReturnType<typeof getSupabaseAdmin>>>,userId:string){
 const {data:wallet,error}=await admin.from("member_exchange_portfolios")
  .select("cash,holdings,revision").eq("user_id",userId).maybeSingle();
 if(error)throw error;
 if(!wallet)return {exists:false as const,portfolio:null};
 const {data:orders,error:ordersError}=await admin.from("member_exchange_orders")
  .select("trade_id,cycle,symbol,side,shares,unit_price")
  .eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
 if(ordersError)throw ordersError;
 const snapshot={cash:Number(wallet.cash),holdings:wallet.holdings,trades:(orders||[]).map(item=>({
  id:item.trade_id,cycle:Number(item.cycle),symbol:item.symbol,side:item.side,shares:item.shares,unitPrice:Number(item.unit_price)
 }))};
 if(!isValidPortfolioSnapshot(snapshot))throw new Error("Stored wallet failed validation");
 const portfolio=sanitizePortfolio(snapshot);
 return {exists:true as const,portfolio,revision:Number(wallet.revision)};
}
export async function GET(){
 const auth=await account();
 if(auth.error)return auth.error;
 try{return NextResponse.json({...await readPortfolio(auth.admin!,auth.user!.id),userId:auth.user!.id},{headers:{"Cache-Control":"no-store"}})}
 catch(error){console.error("Exchange portfolio read failed",(error as {code?:string}).code);return NextResponse.json({error:"Unable to load your saved portfolio; nothing was reset"},{status:503})}
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>16000)return NextResponse.json({error:"Request too large"},{status:413});
 const auth=await account();
 if(auth.error)return auth.error;
 const {admin,user}=auth;
 let body:unknown;
 try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request"},{status:400});
 const data=body as Record<string,unknown>;
 if(data.action==="initialize"){
  // First account visit only: a local beta wallet can be migrated without
  // clobbering any existing cloud portfolio, even under concurrent logins.
  const legacy=data.legacy;
  const saved=legacy&&typeof legacy==="object"?legacy as Record<string,unknown>:null;
  if(saved && (!isValidPortfolioSnapshot(saved)||typeof saved.cash!=="number"||!Number.isFinite(saved.cash)||
    saved.cash<0||saved.cash>100000||Math.round(saved.cash*100)/100!==saved.cash||
    !saved.holdings||typeof saved.holdings!=="object"||Array.isArray(saved.holdings)||
    Object.entries(saved.holdings as Record<string,unknown>).some(([symbol,qty])=>!
     STOCKS.some(s=>s.symbol===symbol)||typeof qty!=="number"||!Number.isSafeInteger(qty)||qty<0||qty>1000)))
   return NextResponse.json({error:"This older beta wallet needs a manual migration review. Your local Duck Bucks and shares were not changed."},{status:400});
  const {data:initialized,error}=await admin!.rpc("initialize_member_exchange_portfolio",{
   p_user_id:user!.id,p_cash:saved?Number(saved.cash):STARTING_BUCKS,
   p_holdings:saved?.holdings||{},p_trades:Array.isArray(saved?.trades)?saved.trades:[]
  });
  if(error){console.error("Exchange initialization error",error.code);
   return NextResponse.json({error:"Could not sync portfolio; local data has been preserved"},{status:503})}
  // Every cloud wallet gets a ranking record. Legacy wallets are audited
  // automatically against server trade history before competitive inclusion.
  if(initialized===true){
   const {error:eligibleError}=await admin!.from("member_exchange_ranking_preferences").upsert({
    user_id:user!.id,eligible:!saved,verified_at:saved?null:new Date().toISOString(),
    public_enabled:true,hide_username:false,updated_at:new Date().toISOString()
   },{onConflict:"user_id",ignoreDuplicates:true});
   if(eligibleError)console.error("Exchange ranking registration failed",eligibleError.code);
  }
  try{return NextResponse.json({...await readPortfolio(admin!,user!.id),userId:user!.id},{headers:{"Cache-Control":"no-store"}})}
  catch{return NextResponse.json({error:"Could not read synchronized portfolio"},{status:503})}
 }
 if(data.action!=="trade")return NextResponse.json({error:"Unsupported action"},{status:400});
 const trade=data.trade as Partial<Trade>|undefined;
 if(!trade||typeof trade!=="object"||typeof trade.id!=="string"||
   !/^\d+:(DUCK|MOO|PANDA|BLUE|TITAN|CLOWN):(buy|sell):\d+:[a-z0-9]+$/.test(trade.id)||
   trade.id.length>150||typeof trade.symbol!=="string"||
   !STOCKS.some(s=>s.symbol===trade.symbol)||(trade.side!=="buy"&&trade.side!=="sell")||
   typeof trade.shares!=="number"||!Number.isSafeInteger(trade.shares)||trade.shares<1||trade.shares>1_000_000||
   typeof trade.cycle!=="number"||!Number.isSafeInteger(trade.cycle)||typeof trade.unitPrice!=="number")
  return NextResponse.json({error:"Invalid order"},{status:400});
 const segments=trade.id.split(":");
 if(Number(segments[0])!==trade.cycle||segments[1]!==trade.symbol||segments[2]!==trade.side||
   Math.abs(Date.now()-Number(segments[3]))>300000||
   Math.abs(cycleAt(Date.now())-trade.cycle)>0||
   priceAt(trade.symbol,trade.cycle)!==trade.unitPrice)
  return NextResponse.json({error:"Market price moved. Please review the updated quote and try again."},{status:409});
 const {data:result,error}=await admin!.rpc("execute_member_exchange_order",{
  p_user_id:user!.id,p_trade_id:trade.id,p_symbol:trade.symbol,p_side:trade.side,
  p_shares:trade.shares,p_cycle:trade.cycle,p_price:trade.unitPrice
 });
 if(error){console.error("Exchange order failed",error.code);
  return NextResponse.json({error:"Order not confirmed. Refresh your wallet before retrying."},{status:409})}
 // Rewards already committed transactionally; don't call a second achievement API.
 const unlocked=(Array.isArray(result?.unlocked)?result.unlocked:[]).flatMap((row:{achievement_key:string})=>{
  const item=achievementCatalog.find(a=>a.key===row.achievement_key&&a.status==="available");
  return item?[{id:item.key,title:item.title,description:item.description,exp:item.exp,hidden:item.hidden===true}]:[];
 });
 try{
  const state=await readPortfolio(admin!,user!.id);
  return NextResponse.json({...state,userId:user!.id,unlocked,duplicate:Boolean(result?.duplicate)},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Trade was saved, but refreshing the wallet failed. Reload to recover your balance."},{status:503})}
}

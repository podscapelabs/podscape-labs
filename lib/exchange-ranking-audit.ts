import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {STARTING_BUCKS,STOCKS,cycleAt,priceAt,tradeTotal} from "@/lib/pod-exchange";
type Order={symbol:string;side:string;shares:number;unit_price:number|string;cycle:number|string;created_at?:string};
type Wallet={cash:number|string;holdings:Record<string,number>};
const symbols=new Set(STOCKS.map(x=>x.symbol));
/** Automatic eligibility check: the saved portfolio must reconcile to its
 * server-recorded orders and a fair 10,000 Duck Bucks starting wallet.
 * Historical tick prices remain versioned and deterministic.
 */
export function auditExchangeLedger(wallet:Wallet,orders:Order[]){
 if(orders.length>5000)return {ok:false,reason:"Too many orders for automatic reconciliation"};
 let cashCents=STARTING_BUCKS*100;
 const held:Record<string,number>={};
 const ordered=[...orders].sort((a,b)=>Number(a.cycle)-Number(b.cycle)||
  (a.created_at||"").localeCompare(b.created_at||""));
 let lastCycle=-Infinity;
 for(const order of ordered){
  const cycle=Number(order.cycle),shares=Number(order.shares),unit=Number(order.unit_price);
  if(!Number.isSafeInteger(cycle)||cycle>cycleAt(Date.now())||
   cycle<lastCycle||!symbols.has(order.symbol)||!Number.isSafeInteger(shares)||
   shares<1||shares>1_000_000||(order.side!=="buy"&&order.side!=="sell")||
   !Number.isFinite(unit)||unit!==priceAt(order.symbol,cycle))
   return {ok:false,reason:"Invalid or unverifiable historical order"};
  lastCycle=cycle;
  const netCents=Math.round(tradeTotal(unit,shares,order.side)*100);
  const previous=held[order.symbol]||0;
  if(order.side==="buy"){
   if(netCents>cashCents)return {ok:false,reason:"An order exceeds the available starting cash"};
   cashCents-=netCents;held[order.symbol]=previous+shares;
  }else{
   if(previous<shares)return {ok:false,reason:"An order sells shares not previously owned"};
   cashCents+=netCents;held[order.symbol]=previous-shares;
  }
  if(held[order.symbol]>1_000_000)return {ok:false,reason:"Share limit exceeded"};
 }
 const reportedCash=Math.round(Number(wallet.cash)*100);
 if(reportedCash!==cashCents)return {ok:false,reason:"Saved cash does not reconcile with recorded orders"};
 for(const stock of STOCKS){
  const amount=wallet.holdings?.[stock.symbol]||0;
  if(!Number.isSafeInteger(amount)||amount!==(held[stock.symbol]||0))
   return {ok:false,reason:"Saved share holdings do not match recorded orders"};
 }
 if(Object.keys(wallet.holdings||{}).some(key=>!symbols.has(key)))
  return {ok:false,reason:"Unexpected stock symbol"};
 return {ok:true,reason:orders.length+" orders reconcile with a 10,000 Duck Bucks starting wallet"};
}

export async function auditStoredExchangeWallet(userId:string){
 const db=getSupabaseAdmin();
 if(!db)return {ok:false,reason:"Database unavailable",cash:0,orders:0};
 const {data:wallet,error:walletError}=await db.from("member_exchange_portfolios")
  .select("cash,holdings").eq("user_id",userId).maybeSingle();
 if(walletError||!wallet)return {ok:false,reason:"Portfolio unavailable",cash:0,orders:0};
 const orders:Order[]=[];
 for(let from=0;from<=5000;from+=1000){
  const result=await db.from("member_exchange_orders")
   .select("symbol,side,shares,unit_price,cycle,created_at")
   .eq("user_id",userId).order("cycle",{ascending:true})
   .order("created_at",{ascending:true}).range(from,from+999);
  if(result.error)return {ok:false,reason:"Trade history unavailable",cash:Number(wallet.cash),orders:0};
  orders.push(...(result.data||[]));
  if(!result.data||result.data.length<1000)break;
 }
 if(orders.length>5000)return {ok:false,reason:"Order history exceeds verification limit",cash:Number(wallet.cash),orders:orders.length};
 const audit=auditExchangeLedger({cash:wallet.cash,holdings:wallet.holdings as Record<string,number>},orders);
 return {...audit,cash:Number(wallet.cash),orders:orders.length};
}

import "server-only";
import {STARTING_BUCKS,STOCKS,cycleAt,priceAt,tradeTotal} from "@/lib/pod-exchange";
type Order={symbol:string;side:string;shares:number;unit_price:number|string;cycle:number|string;created_at?:string};
type Wallet={cash:number|string;holdings:Record<string,number>};
const symbols=new Set(STOCKS.map(x=>x.symbol));
/** A human owner must still review the request. This tests whether every
 * recorded order is compatible with a 10,000 DB starting wallet and the
 * historical deterministic market, with no negative cash or short selling.
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

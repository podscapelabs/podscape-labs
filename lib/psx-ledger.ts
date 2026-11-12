/** Pure, cent-exact FIFO accounting for the fictional Pod Exchange.
 * Only for reporting, NEVER for wallet settlement.
 * Sales consume earliest acquired lots; buy and sell fees are included.
 * The current market value excludes hypothetical future selling fees.
 */
export type PsxLedgerOrder={trade_id:string;cycle:number;symbol:string;side:"buy"|"sell";shares:number;unit_price:number;created_at?:string};
export type PsxLedgerWallet={cash:number;holdings:Record<string,number>};
export type PsxPerformance={verified:boolean;reason?:string;realized:number;unrealized:number;netWorth:number;holdingsValue:number;investedCost:number;tradeCount:number};
type Lot={remaining:number;costCents:number};
const toCents=(value:number)=>Math.round(value*100);
const toMoney=(cents:number)=>cents/100;
function feeCents(subtotalCents:number){return Math.max(1,Math.floor((subtotalCents+100)/200))}
function validMoney(value:number){return Number.isFinite(value)&&value>=0&&toMoney(toCents(value))===value}
function tradeTime(id:string){
 const timestamp=Number(id.split(":")[3]);
 return Number.isFinite(timestamp)?timestamp:0;
}
export function calculatePsxPerformance(
 orders:PsxLedgerOrder[],wallet:PsxLedgerWallet,quotes:Record<string,number>,startingBucks=10_000
):PsxPerformance{
 const invalid=(reason:string):PsxPerformance=>({verified:false,reason,realized:0,unrealized:0,netWorth:0,holdingsValue:0,investedCost:0,tradeCount:orders.length});
 if(!Array.isArray(orders)||!wallet||!validMoney(wallet.cash)||!validMoney(startingBucks)||!wallet.holdings||!quotes)
  return invalid("Invalid saved market ledger");
 const lots=new Map<string,Lot[]>();
 let cashCents=toCents(startingBucks),realizedCents=0;
 const ordered=[...orders].sort((a,b)=>a.cycle-b.cycle||tradeTime(a.trade_id)-tradeTime(b.trade_id)||(a.created_at||"").localeCompare(b.created_at||"")||a.trade_id.localeCompare(b.trade_id));
 for(const order of ordered){
  if(!order||typeof order.symbol!=="string"||!Object.prototype.hasOwnProperty.call(quotes,order.symbol)||
   !Number.isSafeInteger(order.cycle)||!Number.isSafeInteger(order.shares)||order.shares<1||order.shares>1_000_000||
   !Number.isFinite(order.unit_price)||order.unit_price<=0||toMoney(toCents(order.unit_price))!==order.unit_price||
   (order.side!=="buy"&&order.side!=="sell"))
    return invalid("Trade history contains an invalid record");
  const subtotalCents=toCents(order.unit_price)*order.shares;
  if(!Number.isSafeInteger(subtotalCents)||subtotalCents<=0)return invalid("Transaction exceeds accounting precision");
  const netCents=subtotalCents+(order.side==="buy"?feeCents(subtotalCents):-feeCents(subtotalCents));
  const queue=lots.get(order.symbol)||[];
  if(order.side==="buy"){
   if(netCents>cashCents)return invalid("Trade history exceeds the starting wallet");
   cashCents-=netCents;
   queue.push({remaining:order.shares,costCents:netCents});
  }else{
   let toSell=order.shares,costOfSoldCents=0;
   while(toSell>0){
    const lot=queue[0];
    if(!lot||lot.remaining<=0)return invalid("Trade history sells shares that are not owned");
    const consumed=Math.min(lot.remaining,toSell);
    const cost=consumed===lot.remaining?lot.costCents:Math.round(lot.costCents*consumed/lot.remaining);
    lot.costCents-=cost;lot.remaining-=consumed;toSell-=consumed;costOfSoldCents+=cost;
    if(lot.remaining===0)queue.shift();
   }
   cashCents+=netCents;
   realizedCents+=netCents-costOfSoldCents;
  }
  lots.set(order.symbol,queue);
  if(!Number.isSafeInteger(cashCents)||cashCents<0)return invalid("Ledger cash reconciliation failed");
 }
 if(cashCents!==toCents(wallet.cash))return invalid("Recorded cash does not reconcile with all historical trades");
 let investedCents=0,holdingsCents=0;
 for(const [symbol,quote] of Object.entries(quotes)){
  if(!Number.isFinite(quote)||quote<=0)return invalid("Current shared price unavailable");
  const remaining=lots.get(symbol)||[];
  const count=remaining.reduce((sum,lot)=>sum+lot.remaining,0);
  if(!Number.isSafeInteger(count)||count!==(wallet.holdings[symbol]||0))
   return invalid("Current shares do not reconcile with all historical trades");
  investedCents+=remaining.reduce((sum,lot)=>sum+lot.costCents,0);
  holdingsCents+=toCents(quote)*count;
 }
 if(Object.keys(wallet.holdings).some(symbol=>!(symbol in quotes)))return invalid("Unexpected holding");
 if(![investedCents,holdingsCents,realizedCents].every(Number.isSafeInteger))
  return invalid("Ledger exceeds precise accounting range");
 return {verified:true,realized:toMoney(realizedCents),
  unrealized:toMoney(holdingsCents-investedCents),netWorth:toMoney(cashCents+holdingsCents),
  holdingsValue:toMoney(holdingsCents),investedCost:toMoney(investedCents),tradeCount:orders.length};
}

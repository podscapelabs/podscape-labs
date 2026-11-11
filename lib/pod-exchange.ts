/** Pod Exchange — a fictional, deterministic five-minute parody market.
 * Prices are calculated from the clock, never real market data.
 * No real currency, purchased Pod Coins, EXP, or external transactions.
 */
export const MARKET_INTERVAL_MS=5*60*1000;
export const STARTING_BUCKS=10_000;
/** A small, symmetric fee discourages zero-risk flip-flopping every tick. */
export const TRADE_FEE_RATE=.005;
export const STORAGE_KEY="podscape:pod-exchange-beta-v1";
export type Stock={symbol:string;name:string;sector:string;summary:string;base:number;volatility:number;icon:string};
export type Trade={id:string;cycle:number;symbol:string;side:"buy"|"sell";shares:number;unitPrice:number};
export type Portfolio={cash:number;holdings:Record<string,number>;trades:Trade[]};
export type MarketNews={headline:string;detail:string;symbol:string;effect:number};
export const STOCKS:Stock[]=[
 {symbol:"DUCK",name:"Rubber Ducky Inc.",sector:"Luxury Moss",summary:"Premium moss penthouses and high-end hides.",base:148.20,volatility:1.3,icon:"🦆"},
 {symbol:"MOO",name:"Dairy Cow Dairy",sector:"Colony Foods",summary:"Rapid expansion. Very questionable dairy.",base:42.50,volatility:.7,icon:"🐄"},
 {symbol:"PANDA",name:"Panda King Holdings",sector:"Leaf Estates",summary:"A thriving empire in miniature real estate.",base:87.30,volatility:1,icon:"🐼"},
 {symbol:"BLUE",name:"Powder Blue Express",sector:"Leaf Delivery",summary:"Same-minute transport for tiny parcels.",base:21.60,volatility:1.2,icon:"💨"},
 {symbol:"TITAN",name:"Titan Heavy Industries",sector:"Cork Mining",summary:"Moving enormous pieces of very small cork.",base:112.40,volatility:.85,icon:"🪵"},
 {symbol:"CLOWN",name:"Clown Entertainment",sector:"Burrow Media",summary:"Strictly professional, very unserious.",base:36.80,volatility:1.5,icon:"🎪"}
];
export const NEWS:MarketNews[]=[
 {symbol:"DUCK",effect:.075,headline:"DUCK unveils luxury moss penthouses",detail:"Industry analysts call the development aggressively cozy."},
 {symbol:"MOO",effect:.065,headline:"MOO announces record-breaking manca boom",detail:"Investors are reportedly multiplying."},
 {symbol:"PANDA",effect:-.08,headline:"PANDA misplaces entire leaf shipment",detail:"Management says it was probably eaten."},
 {symbol:"BLUE",effect:.075,headline:"BLUE launches express leaf shipping",detail:"Delivery times have improved by at least three seconds."},
 {symbol:"TITAN",effect:.06,headline:"TITAN acquires enormous cork quarry",detail:"Size is relative, reports confirm."},
 {symbol:"CLOWN",effect:-.085,headline:"CLOWN shares tumble after bad joke",detail:"A company spokesperson refused to explain the punchline."},
 {symbol:"DUCK",effect:-.06,headline:"DUCK reports critical moss shortage",detail:"Customers may be forced to accept normal moss."},
 {symbol:"MOO",effect:-.05,headline:"MOO accused of excessive leaf consumption",detail:"The cows declined to comment while eating."},
 {symbol:"PANDA",effect:.06,headline:"PANDA opens new leaf-litter apartments",detail:"Every unit includes a complimentary hiding place."},
 {symbol:"BLUE",effect:-.06,headline:"BLUE couriers lose race to a springtail",detail:"Delivery schedules are being reassessed."},
 {symbol:"TITAN",effect:-.055,headline:"TITAN accidentally knocks over tiny crane",detail:"Damage estimated at three bark chips."},
 {symbol:"CLOWN",effect:.09,headline:"CLOWN sells out its world burrow tour",detail:"The comedy industry is delighted."}
];
export const cycleAt=(ms:number)=>Math.floor(ms/MARKET_INTERVAL_MS);
/** Market 2.0 activates at a fixed UTC boundary so all historical prices and
 * server-replayed trades before the launch stay exactly reproducible.
 * Do not move the boundary after trading begins in the new market.
 */
export const MARKET_V2_START_CYCLE=Math.floor(Date.parse("2026-11-20T00:00:00Z")/MARKET_INTERVAL_MS);
export const MARKET_SESSION_TICKS=72; // Six hours, four market sessions per UTC day.
export type MarketSession={title:string;detail:string;startCycle:number;endCycle:number;featured:string;direction:1|-1;intensity:number};
const MARKET_EVENTS=[
 {title:"The Great Moss Rush",detail:"Demand for premium habitats is heating up.",featured:"DUCK",direction:1 as const},
 {title:"The Cork Shortage",detail:"Supply disruption puts the cork trade under pressure.",featured:"TITAN",direction:-1 as const},
 {title:"Manca Mania",detail:"A colony boom shakes up the food sector.",featured:"MOO",direction:1 as const},
 {title:"Leaf Delivery Chaos",detail:"Shipping trouble rattles the fastest carriers.",featured:"BLUE",direction:-1 as const},
 {title:"The Burrow Boom",detail:"Investors are chasing tiny new properties.",featured:"PANDA",direction:1 as const},
 {title:"Comedy Crash",detail:"A disastrous tour sends entertainment shares tumbling.",featured:"CLOWN",direction:-1 as const},
 {title:"Luxury Moss Bust",detail:"The moss bubble faces a sharp correction.",featured:"DUCK",direction:-1 as const},
 {title:"Cork Gold Rush",detail:"A surprise quarry discovery sparks speculation.",featured:"TITAN",direction:1 as const},
 {title:"Leaf Estate Slump",detail:"Demand for miniature property suddenly cools.",featured:"PANDA",direction:-1 as const},
 {title:"Express Delivery Surge",detail:"New contracts send courier demand soaring.",featured:"BLUE",direction:1 as const}
];
export function marketSessionAt(cycle:number):MarketSession{
 const session=Math.floor(cycle/MARKET_SESSION_TICKS);
 const index=Math.floor(random(session*347+119)*MARKET_EVENTS.length);
 const event=MARKET_EVENTS[index];
 return {...event,startCycle:session*MARKET_SESSION_TICKS,endCycle:(session+1)*MARKET_SESSION_TICKS,
  intensity:.14+random(session*67+503)*.11};
}
/** A six-hour catalyst rises and fades instead of resetting the market at each boundary. */
export function sessionImpactAt(symbol:string,cycle:number):number{
 if(cycle<MARKET_V2_START_CYCLE)return 0;
 const event=marketSessionAt(cycle);
 if(event.featured!==symbol)return 0;
 const progress=(cycle-event.startCycle)/MARKET_SESSION_TICKS;
 if(progress<=0||progress>=1)return 0;
 return event.direction*event.intensity*Math.sin(Math.PI*progress)**2;
}

export const money=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
function random(seed:number){let n=(seed|0)^0x9e3779b9;n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return ((n^(n>>>15))>>>0)/4294967296;}
/** One shuffled deck of twelve stories every three hours, reshuffled forever.
 * Adjacent headlines cannot repeat, even where two decks meet. Fully shared
 * and reproducible without storing an ever-growing stream of news events.
 */
function newsOrder(block:number):number[]{
 const sequence=NEWS.map((_,i)=>i);
 for(let i=sequence.length-1;i>0;i--){
  const j=Math.floor(random(block*1207+i*193+431)* (i+1));
  [sequence[i],sequence[j]]=[sequence[j],sequence[i]];
 }
 return sequence;
}
export function newsAt(cycle:number):MarketNews|null{
 if(cycle%3!==0)return null;
 const issue=Math.floor(cycle/3);
 const block=Math.floor(issue/NEWS.length);
 const offset=((issue%NEWS.length)+NEWS.length)%NEWS.length;
 const order=newsOrder(block);
 const previous=newsOrder(block-1);
 if(order[0]===previous[NEWS.length-1]){
  [order[0],order[1]]=[order[1],order[0]];
 }
 return NEWS[order[offset]];
}
/** Persistent bulletin: the latest headline remains visible through all three ticks.
 * priceAt still uses newsAt so the actual price catalyst applies on publication only.
 */
export function headlineAt(cycle:number):{story:MarketNews;publishedCycle:number}{
 const publishedCycle=cycle-((cycle%3+3)%3);
 const story=newsAt(publishedCycle);
 if(!story)throw Error("Missing market bulletin");
 return {story,publishedCycle};
}
/** Pure, bounded market: any future UTC tick reproduces the same result.
 * Daily regimes blend continuously, avoiding midnight jumps or server jobs.
 * Trade activity currently does not alter shared prices (beta game rules).
 */
const smoothstep=(n:number)=>{const x=Math.max(0,Math.min(1,n));return x*x*(3-2*x);};
const blend=(a:number,b:number,t:number)=>a+(b-a)*t;
function marketMood(index:number,cycle:number):number{
 const day=Math.floor(cycle/288),fraction=(cycle%288+288)%288/288;
 const phase=smoothstep(fraction);
 const yesterday=(random(day*31+index*811)-.5)*.14;
 const tomorrow=(random((day+1)*31+index*811)-.5)*.14;
 return blend(yesterday,tomorrow,phase);
}
function priceNoise(index:number,cycle:number):number{
 // Mix a slowly changing wobble with a small tick-to-tick surprise.
 const window=Math.floor(cycle/6),fraction=((cycle%6)+6)%6/6;
 const a=random(window*97+index*1409)-.5;
 const b=random((window+1)*97+index*1409)-.5;
 return blend(a,b,smoothstep(fraction))*.043+(random(cycle*7919+index*1013)-.5)*.018;
}
/** Event impact fades over three five-minute ticks; story stays visible. */
export function newsImpactAt(symbol:string,cycle:number):number{
 const {story,publishedCycle}=headlineAt(cycle);
 if(story.symbol!==symbol)return 0;
 const age=cycle-publishedCycle;
 return story.effect*(cycle>=MARKET_V2_START_CYCLE?1.35:1)*([1,.62,.3][age]??0);
}
/** No runaway compounding or predictable fixed-period sine-wave profit. */
export function priceAt(symbol:string,cycle:number):number{
 const stock=STOCKS.find(item=>item.symbol===symbol);
 if(!stock||!Number.isSafeInteger(cycle))return 0;
 const index=STOCKS.findIndex(item=>item.symbol===symbol)+1;
 // Company character stays distinct; all movement is mathematically bounded.
 const modern=cycle>=MARKET_V2_START_CYCLE;
 const regime=marketMood(index,cycle)*stock.volatility*(modern?1.45:1);
 const shortTerm=priceNoise(index,cycle)*stock.volatility*(modern?1.8:1);
 const seasonal=Math.sin(cycle/113+index*3.7)*.028*stock.volatility*(modern?1.25:1);
 const impact=newsImpactAt(symbol,cycle)+sessionImpactAt(symbol,cycle);
 const raw=stock.base*(1+regime+shortTerm+seasonal+impact);
 return money(Math.min(stock.base*1.6,Math.max(stock.base*.55,raw)));
}
/** The displayed estimate is also the charge used by both local and cloud trades. */
/** Keep both the client and PostgreSQL settlement in integer cents.
 * 0.5% = one cent per 200 cents, with half-cents rounded upward.
 */
export function tradeSubtotal(price:number,shares:number):number{
 return (Math.round(price*100)*shares)/100;
}
export function tradeFee(subtotal:number):number{
 if(!Number.isFinite(subtotal)||subtotal<=0)return 0;
 const cents=Math.round(subtotal*100);
 return Math.max(1,Math.floor((cents+100)/200))/100;
}
export function tradeTotal(price:number,shares:number,side:"buy"|"sell"):number{
 const cents=Math.round(price*100)*shares;
 const feeCents=Math.max(1,Math.floor((cents+100)/200));
 return (cents+(side==="buy"?feeCents:-feeCents))/100;
}
/** Exact cent-safe largest whole-share purchase, including the server's 0.5% fee. */
export function maxAffordableShares(price:number,cash:number):number{
 if(!Number.isFinite(price)||price<=0||!Number.isFinite(cash)||cash<0)return 0;
 let low=0,high=Math.min(999999,Math.floor(cash/price));
 while(low<high){
  const mid=Math.ceil((low+high)/2);
  if(tradeTotal(price,mid,"buy")<=cash)low=mid;else high=mid-1;
 }
 return low;
}
export function defaultPortfolio():Portfolio{return {cash:STARTING_BUCKS,holdings:{},trades:[]};}
/** Distinguish a legitimately new wallet from corrupt or unreadable saved data.
 * Never turn a malformed existing portfolio silently into starting funds.
 */
export function isValidPortfolioSnapshot(value:unknown):value is Portfolio{
 if(!value||typeof value!=="object")return false;
 const p=value as Partial<Portfolio>;
 if(typeof p.cash!=="number"||!Number.isFinite(p.cash)||p.cash<0||p.cash>1e13||
    money(p.cash)!==p.cash||!p.holdings||typeof p.holdings!=="object"||Array.isArray(p.holdings))return false;
 for(const [symbol,qty] of Object.entries(p.holdings)){
  if(!STOCKS.some(s=>s.symbol===symbol)||!Number.isSafeInteger(qty)||qty<0||qty>1_000_000)return false;
 }
 return !("trades" in p)||Array.isArray(p.trades);
}
export function decodeSavedPortfolio(raw:string|null):{portfolio:Portfolio;isNew:boolean}{
 if(raw===null)return {portfolio:defaultPortfolio(),isNew:true};
 let parsed:unknown;
 try{parsed=JSON.parse(raw)}catch{throw new Error("Your saved Duck Bucks wallet could not be read. No balance was reset.");}
 if(!isValidPortfolioSnapshot(parsed))throw new Error("Your saved Duck Bucks wallet needs recovery. No balance was reset.");
 return {portfolio:sanitizePortfolio(parsed),isNew:false};
}
export function sanitizePortfolio(value:unknown):Portfolio{
 if(!value||typeof value!=="object")return defaultPortfolio();
 const x=value as Partial<Portfolio>;
 if(typeof x.cash!=="number"||!Number.isFinite(x.cash)||x.cash<0||x.cash>1e13)return defaultPortfolio();
 const holdings:Record<string,number>={};
 for(const stock of STOCKS){
  const q=x.holdings?.[stock.symbol]??0;
  if(typeof q!=="number"||!Number.isSafeInteger(q)||q<0||q>1_000_000)return defaultPortfolio();
  if(q)holdings[stock.symbol]=q;
 }
 const trades:Array<Trade>=Array.isArray(x.trades)?x.trades.filter((t):t is Trade=>
  Boolean(t&&typeof t.id==="string"&&typeof t.symbol==="string"&&STOCKS.some(st=>st.symbol===t.symbol)&&
   (t.side==="buy"||t.side==="sell")&&Number.isSafeInteger(t.shares)&&t.shares>0&&
   typeof t.unitPrice==="number"&&Number.isFinite(t.unitPrice)&&t.unitPrice>0&&
   Number.isSafeInteger(t.cycle))).slice(0,50):[];
 return {cash:money(x.cash),holdings,trades};
}
export function totalValue(portfolio:Portfolio,cycle:number):number{
 return (Math.round(portfolio.cash*100)+STOCKS.reduce((sum,stock)=>sum+Math.round(priceAt(stock.symbol,cycle)*100)*(portfolio.holdings[stock.symbol]||0),0))/100;
}
export type OrderResult={ok:true;portfolio:Portfolio}|{ok:false;error:string};
export function executeOrder(portfolio:Portfolio,symbol:string,side:"buy"|"sell",shares:number,cycle:number):OrderResult{
 if(!STOCKS.some(s=>s.symbol===symbol))return {ok:false,error:"Unknown company."};
 if(!Number.isSafeInteger(shares)||shares<1||shares>1_000_000)return {ok:false,error:"Choose a valid number of whole shares."};
 const price=priceAt(symbol,cycle),subtotal=tradeSubtotal(price,shares),charge=tradeTotal(price,shares,side);
 if(!Number.isFinite(charge)||charge<=0||!Number.isFinite(subtotal)||subtotal<=0)return {ok:false,error:"Unable to price this trade."};
 const owned=portfolio.holdings[symbol]||0;
 if(side==="buy"&&charge>portfolio.cash)return {ok:false,error:"Not enough Duck Bucks for this trade."};
 if(side==="sell"&&shares>owned)return {ok:false,error:"You don't own that many shares."};
 const cash=(Math.round(portfolio.cash*100)+(side==="buy"?-1:1)*Math.round(charge*100))/100;
 const qty=owned+(side==="buy"?shares:-shares);
 if(qty>1_000_000)return {ok:false,error:"The share limit for this company is one million."};
 const holdings={...portfolio.holdings};
 if(qty===0)delete holdings[symbol];else holdings[symbol]=qty;
 const trade:Trade={id:cycle+":"+symbol+":"+side+":"+Date.now()+":"+Math.random().toString(36).slice(2,8),cycle,symbol,side,shares,unitPrice:price};
 return {ok:true,portfolio:{cash,holdings,trades:[trade,...portfolio.trades].slice(0,50)}};
}

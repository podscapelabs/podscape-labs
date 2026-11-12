/**
 * PSX V3 — SERVER-PRIVATE, UNRELEASED ARCADE ENGINE PROTOTYPE.
 *
 * NOT wired into live trading, rankings, wallet balances or public components.
 * Node-only HMAC secret must stay in server env/DB; never import into client code.
 * Time is integer minutes since a future, immutable release cutover; the caller
 * supplies each stock's historical closing price at that boundary.
 */
import {createHmac} from "node:crypto";

export const ENGINE_VERSION="psx-v3-prototype-1";
export const TICK_MS=60_000;
export const MAJOR_MINUTES=360;
export const MINOR_MINUTES=5;
export const COMPANY_PROFILES=Object.freeze({
 MOO:{name:"Dairy Cow Industries",sector:"Colony Foods",volatility:.55,trendMinutes:18,range:.12,recovery:.9},
 PANDA:{name:"Panda King Holdings",sector:"Leaf Estate",volatility:.85,trendMinutes:17,range:.17,recovery:.85},
 BLUE:{name:"Powder Blue Logistics",sector:"Distribution",volatility:1.13,trendMinutes:11,range:.20,recovery:.80},
 TITAN:{name:"Titan Heavy Industries",sector:"Cork Infrastructure",volatility:1.14,trendMinutes:21,range:.22,recovery:.74},
 CLOWN:{name:"Clown Capital",sector:"Hype and Entertainment",volatility:1.49,trendMinutes:9,range:.24,recovery:.68},
 DUCK:{name:"Rubber Ducky Inc.",sector:"Suspicious Luxury",volatility:1.72,trendMinutes:10,range:.27,recovery:.66}
});
export const SYMBOLS=Object.freeze(Object.keys(COMPANY_PROFILES));

const STORIES=Object.freeze({
 MOO:[
  ["Massive manca boom overwhelms Dairy Cow headquarters",1,"Demand for colony snacks reaches historic levels."],
  ["MOO lettuce audit uncovers missing emergency supplies",-1,"An executive insists somebody must have eaten the evidence."],
  ["MOO unveils tiny new food processing plant",1,"Analysts expect several more mouths to feed."],
  ["Dairy Cow distribution stalls after cucumber dispute",-1,"Shareholders are demanding a vegetable-based explanation."]
 ],
 PANDA:[
  ["Panda King announces premium leaf-litter condominiums",1,"Every penthouse comes with its own decaying oak leaf."],
  ["Leaf Estate Authority investigates inflated cork rent",-1,"Management blames a local springtail housing boom."],
  ["PANDA unveils luxury burrow expansion",1,"New units are already disappearing under the substrate."],
  ["PANDA development halted by underground tunnel collapse",-1,"Structural consultants were last seen rolling into a ball."]
 ],
 BLUE:[
  ["Powder Blue wins continent-wide express shipment contract",1,"Management promises delivery within one molt."],
  ["BLUE delivery fleet delayed by cucumber checkpoint",-1,"Dispatchers are negotiating with a particularly stubborn snail."],
  ["Powder Blue announces next-generation leaf conveyor",1,"Investors praise its unprecedented speed of several centimetres."],
  ["BLUE loses largest customer to a springtail courier",-1,"The board has opened an emergency race committee."]
 ],
 TITAN:[
  ["Titan secures gigantic artificial cork bark project",1,"The project is estimated at seventeen bark chips."],
  ["Titan crane snaps under suspiciously heavy cucumber",-1,"Engineers insist the cucumber was within specification."],
  ["TITAN discovers vast new cork quarry",1,"Shares surge as contractors order extremely small excavators."],
  ["Titan infrastructure delays threaten flagship construction",-1,"The company's executive team is trapped beneath a leaf."]
 ],
 CLOWN:[
  ["Clown Capital claims party hats are an emerging asset class",1,"Forty thousand hats were purchased for strategic reasons."],
  ["CLOWN marketing campaign under investigation",-1,"The regulator asks whether confetti counts as disclosure."],
  ["Clown CEO announces revolutionary invisible product",1,"Investors cannot confirm what it does but they love it."],
  ["CLOWN shares shake after disastrous joke at shareholder meeting",-1,"The punchline remains classified."]
 ],
 DUCK:[
  ["Rubber Ducky unveils diamond-encrusted limestone retreat",1,"Luxury buyers are paying extra to feel naturally hydrated."],
  ["DUCK CEO missing during cork bark board meeting",-1,"The executive was last seen beneath a suspiciously comfortable hide."],
  ["Rubber Ducky discovers lost CEO under cork bark",1,"The company expects a rapid, completely dignified recovery."],
  ["DUCK accused of speculative limestone derivatives",-1,"Executives argue limestone has tremendous emotional value."],
  ["Rubber Ducky announces wildly overpriced moss spa",1,"The waiting list now exceeds the number of available hides."],
  ["DUCK luxury portfolio downgraded after shell inspection",-1,"Auditors request immediate clarification of the word 'prestigious'."]
 ]
});

const MAJOR_HEADLINES=Object.freeze({
 MOO:[["Dairy Cow population boom ignites food demand",1],["Cucumber shortage brings Dairy Cow production to a halt",-1]],
 PANDA:[["The Great Burrow Boom transforms the Leaf Estate market",1],["Leaf property bubble bursts amid rent scandal",-1]],
 BLUE:[["Powder Blue wins emergency distribution monopoly",1],["Continental logistics shutdown strikes BLUE",-1]],
 TITAN:[["Titan launches the world's largest cork infrastructure project",1],["Titan mega-project suffers spectacular structural failure",-1]],
 CLOWN:[["Clown Capital hype campaign captures investor imagination",1],["Clown Capital party-hat scandal erupts",-1]],
 DUCK:[["Rubber Ducky announces extravagant luxury expansion",1],["Rubber Ducky executive corruption scandal breaks",-1]]
});

function validate(secret,minute){
 if(typeof secret!=="string"||secret.length<32)throw Error("PSX V3 requires a private server secret of at least 32 characters.");
 if(!Number.isSafeInteger(minute)||minute<0)throw Error("PSX minute must be a nonnegative integer.");
}
function rand(secret,...parts){
 const d=createHmac("sha256",secret).update(ENGINE_VERSION+"|"+parts.join("|")).digest();
 return d.readUIntBE(0,6)/281474976710656;
}
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const round=value=>Math.round((value+Number.EPSILON)*100)/100;

function interpolated(secret,symbol,stream,minute,windowSize){
 const block=Math.floor(minute/windowSize),phase=minute%windowSize/windowSize;
 const lo=rand(secret,symbol,stream,block)*2-1;
 const hi=rand(secret,symbol,stream,block+1)*2-1;
 return mix(lo,hi,smooth(phase));
}
function orderForSession(secret,group){
 const order=[...SYMBOLS];
 for(let i=order.length-1;i>0;i--){
  const j=Math.floor(rand(secret,"major-order",group,i)*(i+1));
  [order[i],order[j]]=[order[j],order[i]];
 }
 return order;
}
/** One spotlight per company in a six-session (~36h) block. */
export function majorEventAt(secret,sessionIndex){
 validate(secret,sessionIndex);
 const symbol=orderForSession(secret,Math.floor(sessionIndex/6))[sessionIndex%6];
 const stories=MAJOR_HEADLINES[symbol],choice=Math.floor(rand(secret,"major-story",sessionIndex)*stories.length);
 const [headline,direction]=stories[choice];
 return {id:"major:"+sessionIndex,symbol,startMinute:sessionIndex*MAJOR_MINUTES,
  endMinute:(sessionIndex+1)*MAJOR_MINUTES,
  headline,detail:direction===1?"Corporate optimism spreads rapidly across the substrate.":"The board is scrambling to contain an exceptionally tiny crisis.",
  direction,strength:(.085+rand(secret,"major-strength",sessionIndex)*.10)*COMPANY_PROFILES[symbol].volatility/1.4};
}
/** One unique company is covered per five-minute bulletin within each 30m block. */
export function minorNewsAt(secret,bulletinIndex){
 validate(secret,bulletinIndex);
 const symbol=orderForSession(secret,10_000_000+Math.floor(bulletinIndex/6))[bulletinIndex%6];
 const stories=STORIES[symbol],choice=Math.floor(rand(secret,"minor-story",bulletinIndex)*stories.length);
 const [headline,direction,detail]=stories[choice];
 return {id:"bulletin:"+bulletinIndex,symbol,startMinute:bulletinIndex*MINOR_MINUTES,
  headline,detail,direction,strength:(.018+rand(secret,"minor-strength",bulletinIndex)*.022)*COMPANY_PROFILES[symbol].volatility};
}
/**
 * Rumours appear in the final 40m before a major event. They NEVER reveal the
 * signed outcome until publication. Accurate, partial and false statuses remain
 * entirely server-private until the event actually starts.
 */
export function rumourAt(secret,minute){
 validate(secret,minute);
 const nextSession=Math.floor(minute/MAJOR_MINUTES)+1;
 const boundary=nextSession*MAJOR_MINUTES,lead=boundary-minute;
 if(lead>40||lead<5||rand(secret,"rumour-appear",nextSession)<.25)return null;
 const upcoming=majorEventAt(secret,nextSession);
 const variant=Math.floor(rand(secret,"rumour-kind",nextSession)*3);
 const decoy=SYMBOLS[(SYMBOLS.indexOf(upcoming.symbol)+1+Math.floor(rand(secret,"rumour-decoy",nextSession)*5))%6];
 const rumouredSymbol=variant===2?decoy:upcoming.symbol;
 return {id:"rumour:"+nextSession,symbol:rumouredSymbol,fromMinute:boundary-40,
  expiresMinute:boundary,
  headline:variant===0?"Anonymous report hints at a major "+rumouredSymbol+" announcement":
   variant===1?"Unverified leak suggests turmoil around "+rumouredSymbol+" management":
   "The Cork Whisperer claims "+rumouredSymbol+" is preparing something enormous",
  status:"UNVERIFIED",detail:"Market gossip only. Nobody has confirmed a thing."};
}
/** Resolution is server-only and must not be returned before the scheduled major event. */
export function resolveRumour(secret,sessionIndex,asOfMinute){
 validate(secret,sessionIndex);validate(secret,asOfMinute);
 if(asOfMinute<sessionIndex*MAJOR_MINUTES)return null;
 const kind=["accurate","partial","false"][Math.floor(rand(secret,"rumour-kind",sessionIndex)*3)];
 return {rumourId:"rumour:"+sessionIndex,majorEventId:"major:"+sessionIndex,resolution:kind};
}
function minorImpact(secret,symbol,minute){
 let effect=0;
 const current=Math.floor(minute/MINOR_MINUTES);
 for(let i=0;i<7;i++){
  const issue=current-i;if(issue<0)break;
  const story=minorNewsAt(secret,issue);
  if(story.symbol!==symbol)continue;
  const age=minute-story.startMinute;
  const response=(.45+.55*(1-Math.exp(-age/3)))*Math.exp(-age/10);
  effect+=story.direction*story.strength*response;
 }
 return effect;
}
function majorImpact(secret,symbol,minute){
 const session=Math.floor(minute/MAJOR_MINUTES);
 const major=majorEventAt(secret,session);
 if(major.symbol!==symbol)return 0;
 const age=minute-major.startMinute;
 const entry=1-Math.exp(-(age+1)/10);
 const decay=Math.exp(-age/96);
 const finish=1-smooth((age-280)/80);
 return major.direction*major.strength*entry*decay*finish;
}
function rumourImpact(secret,symbol,minute){
 const rumour=rumourAt(secret,minute);
 if(!rumour||rumour.symbol!==symbol)return 0;
 const until=rumour.expiresMinute-minute;
 const trend=(1-smooth((until-5)/35))*.008*COMPANY_PROFILES[symbol].volatility;
 const sign=rand(secret,"rumour-direction",rumour.id)>.5?1:-1;
 return sign*trend;
}
/** Constant-time quote for any past or current minute; never expose secret to clients. */
export function quoteAt({secret,symbol,minute,openingPrice}){
 validate(secret,minute);
 const p=COMPANY_PROFILES[symbol];
 if(!p||!Number.isFinite(openingPrice)||openingPrice<=0)throw Error("Invalid company or release opening price.");
 if(minute===0)return round(openingPrice);
 // These layers have bounded, continuous momentum without exponential wealth drift.
 const slow=interpolated(secret,symbol,"long-trend",minute,83)*p.range*.65;
 const mid=interpolated(secret,symbol,"medium-trend",minute,p.trendMinutes)*p.range*.43;
 const short=interpolated(secret,symbol,"short-trend",minute,4)*.015*p.volatility;
 const noise=(rand(secret,symbol,"minute-jitter",minute)-.5)*.012*p.volatility;
 const story=minorImpact(secret,symbol,minute);
 const event=majorImpact(secret,symbol,minute);
 const chatter=rumourImpact(secret,symbol,minute);
 const offset=slow+mid+short+noise+story+event+chatter;
 return round(clamp(openingPrice*Math.exp(offset),openingPrice*.48,openingPrice*2.05));
}
/**
 * Only publish events at or before the requested minute.
 * No future signed directions, strengths, stories or rumour outcomes leak.
 */
export function publicMarketFrame({secret,minute,openingPrices}){
 validate(secret,minute);
 if(!openingPrices||typeof openingPrices!=="object")throw Error("Opening prices required");
 const prices=Object.fromEntries(SYMBOLS.map(symbol=>[symbol,quoteAt({secret,symbol,minute,openingPrice:openingPrices[symbol]})]));
 const major=majorEventAt(secret,Math.floor(minute/MAJOR_MINUTES));
 const news=minorNewsAt(secret,Math.floor(minute/MINOR_MINUTES));
 const rumour=rumourAt(secret,minute);
 return {version:ENGINE_VERSION,minute,prices,
  major:{id:major.id,symbol:major.symbol,headline:major.headline,detail:major.detail,publishedMinute:major.startMinute},
  bulletin:{id:news.id,symbol:news.symbol,headline:news.headline,detail:news.detail,publishedMinute:news.startMinute},
  rumour};
}

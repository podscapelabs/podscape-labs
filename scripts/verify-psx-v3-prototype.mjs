import assert from "node:assert/strict";
import {COMPANY_PROFILES,SYMBOLS,TICK_MS,MAJOR_MINUTES,MINOR_MINUTES,quoteAt,majorEventAt,minorNewsAt,rumourAt,resolveRumour,publicMarketFrame} from "../lib/psx-v3-prototype.mjs";

const secretA="PSX-V3-ISOLATED-NODE-SIMULATION-KEY-ALPHA-NEVER-USE-IN-PRODUCTION";
const secretB="PSX-V3-ISOLATED-NODE-SIMULATION-KEY-BETA-NEVER-USE-IN-PRODUCTION";
const opening={MOO:42.50,PANDA:87.30,BLUE:21.60,TITAN:112.40,CLOWN:36.80,DUCK:148.20};
assert.equal(SYMBOLS.length,6);
assert.equal(new Set(SYMBOLS).size,6);
assert.equal(TICK_MS,60_000);
assert.equal(MAJOR_MINUTES,360);
assert.equal(MINOR_MINUTES,5);
assert.deepEqual(new Set(SYMBOLS),new Set(Object.keys(opening)));
assert.throws(()=>quoteAt({secret:"short",symbol:"DUCK",minute:0,openingPrice:100}),/secret/);
assert.throws(()=>quoteAt({secret:secretA,symbol:"DUCK",minute:-1,openingPrice:100}),/nonnegative/);
assert.throws(()=>quoteAt({secret:secretA,symbol:"fake",minute:100,openingPrice:100}),/Invalid company/);

for(const seed of [secretA,secretB]){
 const prices={};
 for(const symbol of SYMBOLS)assert.equal(quoteAt({secret:seed,symbol,minute:0,openingPrice:opening[symbol]}),opening[symbol],"Historical closing price must survive cutover");
 for(let group=0;group<10;group++){
  const covered=new Set();
  for(let s=0;s<6;s++){
   const e=majorEventAt(seed,group*6+s);
   covered.add(e.symbol);
   assert.equal(e.startMinute,(group*6+s)*360);
   assert.ok(e.headline&&e.detail);
  }
  assert.equal(covered.size,6,"Every company appears as a major headline within 36h");
 }
 for(let t of [0,1,4,5,60,359,360,361,719,720,1000,1440,20000,43199]){
  const frame=publicMarketFrame({secret:seed,minute:t,openingPrices:opening});
  assert.equal(frame.minute,t);
  assert.ok(!("direction" in frame.major)&&!("strength" in frame.major),"Future internal market magnitudes must not leak");
  assert.ok(!("direction" in frame.bulletin)&&!("strength" in frame.bulletin));
  const sessionIndex=Math.floor(t/MAJOR_MINUTES);
  if(sessionIndex===0||t%MAJOR_MINUTES>=20)assert.equal(frame.rumourResolution,null,"No future or expired rumour resolution");
  else {
   const expected=resolveRumour(seed,sessionIndex,t);
   assert.deepEqual(frame.rumourResolution,expected,"A rumour resolves only after the related six-hour announcement");
  }
  assert.equal(frame.major.publishedMinute,Math.floor(t/360)*360);
  assert.equal(frame.bulletin.publishedMinute,Math.floor(t/5)*5);
  for(const symbol of SYMBOLS){
   const price=quoteAt({secret:seed,symbol,minute:t,openingPrice:opening[symbol]});
   assert.equal(frame.prices[symbol],price);
   assert.equal(price,quoteAt({secret:seed,symbol,minute:t,openingPrice:opening[symbol]}));
   assert.ok(price>=opening[symbol]*.48-.01&&price<=opening[symbol]*2.05+.01);
  }
 }
 for(let session=1;session<=18;session++){
  assert.equal(resolveRumour(seed,session,session*360-1),null,"Rumour truth must remain hidden until event");
  const early=rumourAt(seed,session*360-20);
  const outcome=resolveRumour(seed,session,session*360);
  if(early){assert.ok(outcome&&["accurate","partial","false"].includes(outcome.resolution));assert.equal(outcome.majorEventId,"major:"+session);}
  else assert.equal(outcome,null);
 }
 let opportunityWindows=0,totalWindows=0;
 for(let minute=0;minute<=10080;minute+=5){
  for(const symbol of SYMBOLS){
   const price=quoteAt({secret:seed,symbol,minute,openingPrice:opening[symbol]});
   assert.ok(price>0&&Number.isFinite(price),"7-day sampled quotes never collapse");
  }
  if(minute>=5){
   totalWindows++;
   if(SYMBOLS.some(symbol=>{
    const current=quoteAt({secret:seed,symbol,minute,openingPrice:opening[symbol]});
    const earlier=quoteAt({secret:seed,symbol,minute:minute-5,openingPrice:opening[symbol]});
    return Math.abs((current/earlier-1)*100)>=1.2;
   }))opportunityWindows++;
  }
 }
 assert.ok(opportunityWindows/totalWindows>.55,"Most five-minute sessions should offer a visible market decision");
 const measurements=[];
 for(const symbol of SYMBOLS){
  const points=[];
  for(let m=0;m<1440;m++)points.push(quoteAt({secret:seed,symbol,minute:m,openingPrice:opening[symbol]}));
  const change=points.slice(1).map((v,i)=>Math.abs(v/points[i]-1)*100);
  assert.ok(change[0]<1,"Cutover cannot instantly shock a player's old holdings");
  assert.ok(Math.max(...change)<10,"Regular minute moves must not be unbounded");
  const meanAbs=change.reduce((a,b)=>a+b,0)/change.length;
  measurements.push([symbol,meanAbs]);
 }
 const risk=Object.fromEntries(measurements);
 assert.ok(risk.MOO<risk.CLOWN&&risk.MOO<risk.DUCK,"Stable company should move less than hype and luxury stocks");
 console.log("PSX V3 seven-day spot market:",seed.slice(0,14),{opportunityRate:+(100*opportunityWindows/totalWindows).toFixed(1),minuteRisk:measurements.map(([symbol,v])=>[symbol,+v.toFixed(3)])});
}
// Thirty-day sampled history, independent of page visits and wallet actions.
for(let minute=0;minute<=43200;minute+=30){
 for(const symbol of SYMBOLS){
  const v=quoteAt({secret:secretA,symbol,minute,openingPrice:opening[symbol]});
  assert.ok(Number.isFinite(v)&&v>0);
 }
}
assert.notEqual(minorNewsAt(secretA,1).id,minorNewsAt(secretA,2).id);
assert.ok(Object.values(COMPANY_PROFILES).every(p=>p.trendMinutes>5&&p.volatility>0));
console.log("PSX V3 prototype verification passed. No DB writes, market cutovers, or live transactions.");

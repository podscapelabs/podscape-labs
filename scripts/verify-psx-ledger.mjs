import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const source=readFileSync("lib/psx-ledger.ts","utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {calculatePsxPerformance}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
const quotes={MOO:120,PANDA:87.30,BLUE:21.60,TITAN:112.40,CLOWN:36.80,DUCK:148.20};
const order=(id,side,shares,unit_price)=>({trade_id:id,cycle:1000000001+Number(id.split(":")[0]),symbol:"MOO",side,shares,unit_price});
const zero=calculatePsxPerformance([],{cash:10000,holdings:{}},quotes);
assert.equal(zero.verified,true);assert.equal(zero.realized,0);assert.equal(zero.unrealized,0);assert.equal(zero.netWorth,10000);

const bought=calculatePsxPerformance([order("0:buy", "buy",10,100)],{cash:8995,holdings:{MOO:10}},quotes);
assert.equal(bought.verified,true);assert.equal(bought.realized,0);assert.equal(bought.investedCost,1005);
assert.equal(bought.unrealized,195);assert.equal(bought.netWorth,10195);

const firstSale=calculatePsxPerformance([
 order("0:buy","buy",10,100),order("1:sell","sell",4,110)
],{cash:9432.8,holdings:{MOO:6}},quotes);
assert.equal(firstSale.verified,true);assert.equal(firstSale.realized,35.8);
assert.equal(firstSale.investedCost,603);assert.equal(firstSale.unrealized,117);
assert.equal(firstSale.netWorth,10152.8);

const finalSale=calculatePsxPerformance([
 order("0:buy","buy",10,100),order("1:sell","sell",4,110),order("2:sell","sell",6,120)
],{cash:10149.2,holdings:{}},quotes);
assert.equal(finalSale.verified,true);assert.equal(finalSale.realized,149.2);
assert.equal(finalSale.unrealized,0);assert.equal(finalSale.investedCost,0);assert.equal(finalSale.netWorth,10149.2);

const otherLots=calculatePsxPerformance([
 order("0:buy","buy",2,40),order("1:buy","buy",3,50),order("2:sell","sell",3,60)
],{cash:9947.95,holdings:{MOO:2}},quotes);
assert.equal(otherLots.verified,true,"FIFO consumes oldest shares first");
assert.equal(otherLots.realized,48.45);
assert.equal(otherLots.investedCost,100.5);
assert.equal(otherLots.unrealized,139.5);

const broken=calculatePsxPerformance([order("0:buy","buy",10,100)],{cash:10000,holdings:{MOO:10}},quotes);
assert.equal(broken.verified,false,"Never report false profit when cash cannot be reconciled");
const noShort=calculatePsxPerformance([order("0:sell","sell",5,100)],{cash:10000,holdings:{}},quotes);
assert.equal(noShort.verified,false,"Never accept selling shares not owned");
const tampered=calculatePsxPerformance([order("0:buy","buy",10,100)],{cash:8995,holdings:{MOO:9}},quotes);
assert.equal(tampered.verified,false,"Never trust stored share counts without reconciliation");
console.log("PSX fee-inclusive FIFO accounting, sales, partial lots, and tamper checks passed.");

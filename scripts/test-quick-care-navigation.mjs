import assert from "node:assert/strict";
import {orderCareBins,nextCareBinId} from "../lib/quick-care-navigation.mjs";
const bins=Array.from({length:17},(_,i)=>({id:String(i),species:String(i%3),name:String(i)}));
const ordered=orderCareBins(bins);
for(const start of ordered){
 const seen=new Set();let id=start.id;
 for(let i=0;i<17;i++){seen.add(id);id=nextCareBinId(ordered,id);}
 assert.equal(seen.size,17);assert.equal(id,start.id);
}
assert.equal(nextCareBinId([], "missing"),undefined);
assert.equal(nextCareBinId([bins[0]],bins[0].id),undefined);
assert.equal(nextCareBinId(ordered,"missing"),undefined);
console.log("PASS: all 17 bins reachable from every starting bin");

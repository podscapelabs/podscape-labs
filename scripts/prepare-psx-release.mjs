/** Produce a no-write PSX release manifest for a chosen future UTC minute.
 * Run only in a trusted release environment; never commit the seed or manifest.
 * Example: CUTOVER_UTC=2026-11-16T18:00:00Z PSX_V3_SECRET=... node scripts/prepare-psx-release.mjs
 */
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {ENGINE_VERSION,SYMBOLS} from "../lib/psx-v3-prototype.mjs";
const utc=process.env.CUTOVER_UTC;
const secret=process.env.PSX_V3_SECRET;
if(!utc||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(utc)){
 console.error("CUTOVER_UTC must be an exact minute in UTC, e.g. 2026-11-16T18:00:00Z");
 process.exit(1);
}
const date=new Date(utc),cutoverMs=date.getTime();
if(!Number.isFinite(cutoverMs)||date.toISOString()!==utc.replace("Z",".000Z").replace(".000.000Z",".000Z")||cutoverMs<Date.now()+15*60_000){
 console.error("Cutover must be a valid UTC date at least 15 minutes in the future.");
 process.exit(1);
}
if(!secret||secret.length<32){
 console.error("PSX_V3_SECRET is missing or too short; production seed stays server-private.");
 process.exit(1);
}
const source=readFileSync(new URL("../lib/pod-exchange.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const market=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
const cycle=market.arcadeCycleAt(cutoverMs);
if(!Number.isSafeInteger(cycle)||cycle<1_000_000_000||market.tickIntervalFor(cycle)!==60_000)throw Error("Invalid arcade minute cutover");
const prices=Object.fromEntries(SYMBOLS.map(symbol=>[symbol,market.priceAt(symbol,cycle-1)]));
for(const price of Object.values(prices))if(!Number.isFinite(price)||price<=0||Math.round(price*100)/100!==price)throw Error("Invalid opening price");
const manifest={version:ENGINE_VERSION,state:"testing",cutover_at:date.toISOString(),cutover_cycle:cycle,opening_prices:prices,seed_fingerprint:createHash("sha256").update(secret).digest("hex")};
console.log(JSON.stringify(manifest,null,2));

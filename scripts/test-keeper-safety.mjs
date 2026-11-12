import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const calls=[];
let user={id:"keeper-a"}, result={data:{id:"12345678-1234-1234-1234-123456789abc"},error:null};
let binResult={data:[],error:null};
const db={
 auth:{getUser:async()=>({data:{user},error:null})},
 from(table){
  const query={};
  for(const method of ["delete","insert","select","eq","limit","maybeSingle"]){
   query[method]=(...args)=>{calls.push({table,method,args});return query;};
  }
  query.then=(resolve,reject)=>Promise.resolve(table==="member_achievements"?{data:[],error:null}:table==="keeper_enclosures"&&calls.some(c=>c.table===table&&c.method==="limit")?binResult:result).then(resolve,reject);
  return query;
 }
};
function load(path){
 const compiled=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(compiled,{exports:module.exports,module,console,require(name){
  if(name==="@/lib/collection-achievements")return{collectionAchievementCatalog:()=>[]};
  if(name==="next/cache")return{revalidatePath(){}};
  if(name==="@/lib/keeper")return{keeperContext:async()=>({db,user})};
  if(name==="@/lib/customer-auth/access")return{requireCustomerPreviewAccess:async()=>{}};
  if(name==="@/lib/customer-auth/server")return{customerSupabase:async()=>db};
  if(name==="@/lib/species-store")return{getSpeciesRecords:async()=>[{id:"species-a",kind:"species",status:"published"}]};
  if(name==="@/data/species")return{isSpeciesRecordActive:()=>true};
  if(name==="@/data/collection")return{};
  throw Error(name);
 }});
 return module.exports;
}
const {deleteEnclosure}=load("app/keeper/actions.ts");
const {setSpeciesCollected}=load("app/ledger/collection/actions.ts");
const id="12345678-1234-1234-1234-123456789abc";
assert.equal((await deleteEnclosure({id,confirmed:false})).success,false);
assert.equal(calls.length,0,"Unconfirmed deletion must not reach the database");
user=null;
assert.equal((await deleteEnclosure({id,confirmed:true})).success,false);
assert.equal(calls.length,0,"Signed-out deletion must not reach the database");
user={id:"keeper-a"};
assert.equal((await deleteEnclosure({id,confirmed:true})).success,true);
assert.ok(calls.some(c=>c.method==="eq"&&c.args[0]==="user_id"&&c.args[1]==="keeper-a"),"Delete must be scoped to the current user");
assert.ok(calls.some(c=>c.method==="eq"&&c.args[0]==="id"&&c.args[1]===id));
calls.length=0;result={data:null,error:null};
assert.equal((await deleteEnclosure({id,confirmed:true})).success,false,"Missing/foreign bins must not report success");
calls.length=0;
assert.equal((await setSpeciesCollected("species-a",false)).success,false);
assert.ok(!calls.some(c=>c.method==="delete"),"Removal requires explicit confirmation");
calls.length=0;binResult={data:[{id,is_archived:true}],error:null};
assert.equal((await setSpeciesCollected("species-a",false,true)).success,false);
assert.ok(!calls.some(c=>c.method==="delete"),"Archived bins must protect the collection");
calls.length=0;binResult={data:[],error:{code:"503"}};
assert.equal((await setSpeciesCollected("species-a",false,true)).success,false);
assert.ok(!calls.some(c=>c.method==="delete"),"Bin lookup failures must fail closed");
calls.length=0;result={data:{species_id:"species-a"},error:null};binResult={data:[],error:null};
assert.equal((await setSpeciesCollected("species-a",false,true)).success,true);
assert.ok(calls.some(c=>c.table==="member_species_collection"&&c.method==="delete"));
calls.length=0;
assert.equal((await setSpeciesCollected("species-a",true)).success,true);
assert.ok(calls.some(c=>c.table==="member_species_collection"&&c.method==="insert"));
assert.ok(!calls.some(c=>c.table==="keeper_enclosures"),"Collecting must only save a species bookmark");
console.log("Keeper deletion ownership, confirmation, archived-bin protection and bookmark-only collection tests passed.");

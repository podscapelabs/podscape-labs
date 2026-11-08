import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

function loadPureHelper(path){
  const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  runInNewContext(js,{module,exports:module.exports});
  return module.exports;
}

const {generateSpeciesSearchTags}=loadPureHelper("lib/species-search-tags.ts");
const {speciesReadiness}=loadPureHelper("lib/species-readiness.ts");

const dairy={
  commonName:"Dairy Cow",scientificName:'Porcellio cf. laevis "Dairy Cow"',
  genus:"Porcellio",species:"cf. laevis",morph:"Dairy Cow",slug:"dairy-cow",
};
const tags=generateSpeciesSearchTags(dairy);
assert.ok(tags.includes("Dairy Cow"));
assert.ok(tags.includes("Porcellio"));
assert.ok(tags.some(tag=>tag.includes("cf. laevis")));
assert.equal(tags.length,new Set(tags.map(tag=>tag.toLowerCase())).size,"search tags must be deduplicated");
assert.ok(!tags.includes("Prolific breeder"),"search indexing must not infer husbandry claims");
assert.deepEqual(Array.from(generateSpeciesSearchTags({...dairy,commonName:"",scientificName:"",genus:"",species:"",morph:"",slug:"draft-1"})),["draft 1"]);

const blank={...dairy,identityStatus:"unassigned",about:"",summary:"",careLevel:"",moistureProfile:"",image:null};
const missing=speciesReadiness(blank);
assert.equal(missing.ready,false);
assert.ok(missing.missing.includes("photo"));
assert.ok(missing.missing.includes("care level"));
const complete=speciesReadiness({...blank,identityStatus:"provisional",about:"A general description",careLevel:"Beginner",moistureProfile:"balanced",image:"/photo.webp"});
assert.equal(complete.ready,true);
assert.equal(complete.missing.length,0);
console.log("Leaf Ledger regression checks passed: indexing aliases and completion hints.");

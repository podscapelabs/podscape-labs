/** Optional, evidence-led Leaf Ledger fields. Missing information must remain blank. */
export const speciesResearchGroups=[
 {id:"identity",title:"Taxonomy & origin",fields:[
  ["taxonomicStatus","Taxonomic status",120],["taxonomicSynonyms","Synonyms / historic names",300],
  ["nativeDistribution","Native distribution",300],["naturalMicrohabitat","Natural microhabitat",300],
  ["morphOrigin","Captive morph origin",240],["identificationNotes","Identification notes & lookalikes",500],
  ["adultSizeMm","Typical adult length (mm)",40],["lifespan","Lifespan (if established)",100]
 ]},
 {id:"environment",title:"Moisture & habitat",fields:[
  ["humidityMin","RH lower bound (%)",3],["humidityMax","RH upper bound (%)",3],
  ["moistZoneCoverage","Approximate moist-zone coverage (% of floor area)",3],
  ["moistRefugeCondition","Moist-refuge substrate condition",120],
  ["moistureGradientGuidance","Moisture gradient / dry-side guidance",350],
  ["substrateDepth","Substrate depth",100],["enclosureGuidance","Enclosure setup guidance",350]
 ]},
 {id:"breeding",title:"Breeding & development",fields:[
  ["broodAverage","Average young per brood",8],["broodMin","Observed brood minimum",8],["broodMax","Observed brood maximum",8],
  ["incubationPeriod","Incubation / brooding period",100],["maturityAge","Age at maturity",100],["breedingSeason","Breeding season",120]
 ]},
 {id:"nutrition",title:"Feeding & ecology",fields:[
  ["stapleDiet","Staple diet",300],["proteinGuidance","Protein guidance",240],
  ["calciumGuidance","Calcium guidance",200],["dietaryCautions","Dietary cautions",240],
  ["defensiveBehaviour","Defensive behaviour",200],["visibilityNotes","Visibility & activity notes",200],
  ["bioactiveSuitability","Bioactive suitability",240]
 ]},
 {id:"evidence",title:"Evidence & editorial review",fields:[
  ["researchSources","Research sources (one URL per line)",2400],
  ["evidenceScope","Evidence scope: species-level / morph-specific / mixed",30],
  ["evidenceQuality","Evidence basis: scientific / breeder consensus / limited",30],
  ["evidenceNotes","Evidence mapping & uncertainties (cite field and source)",2000],
  ["lastReviewed","Last reviewed (YYYY-MM-DD)",10]
 ]}
] as const;
export type SpeciesResearchField=(typeof speciesResearchGroups)[number]["fields"][number][0];
export const flatSpeciesResearchFields=speciesResearchGroups.flatMap(group=>group.fields.map(field=>({name:field[0],label:field[1],limit:field[2],group:group.title})));
export const speciesResearchFieldNames=new Set<string>(flatSpeciesResearchFields.map(field=>field.name));
export function validateSpeciesResearchField(name:string,value:string):string|null{
 if(!value)return null;
 if(["humidityMin","humidityMax","moistZoneCoverage"].includes(name)){
  if(!/^(?:100|[1-9]?\d)$/.test(value))return "Expected a whole-number percentage from 0 to 100.";
 }
 if(["broodAverage","broodMin","broodMax"].includes(name)){
  if(!/^\d{1,6}$/.test(value))return "Expected a nonnegative whole number.";
 }
 if(name==="adultSizeMm"&&!/^(?:\d{1,3})(?:\.\d{1,2})?$/.test(value))return "Expected a millimetre measurement, such as 12 or 12.5.";
 if(name==="lastReviewed"&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return "Expected date YYYY-MM-DD.";
 if(name==="evidenceScope"&&!["species-level","morph-specific","mixed"].includes(value))return "Unsupported evidence scope.";
 if(name==="evidenceQuality"&&!["scientific","breeder-consensus","limited"].includes(value))return "Unsupported evidence basis.";
 if(name==="researchSources"){
  const lines=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.some(x=>{try{return !["https:","http:"].includes(new URL(x).protocol)}catch{return true}}))return "Sources must be full HTTP(S) URLs, one per line.";
 }
 return null;
}

import {flatSpeciesResearchFields,validateSpeciesResearchField} from "@/lib/species-research-fields";
import {normalizeSpeciesTrait,SPECIES_TRAIT_REGISTRY} from "@/lib/species-traits";
/** Safe, editorial-only import contract for the owner Ledger Desk.
 * Never accept status, identity verification, record ID, slug, catalogue number or image uploads.
 */
export const IMPORT_FIELDS=[
 ["commonName","Common name",120],
 ["scientificName","Scientific name",160],
 ["genus","Genus",100],
 ["species","Species",100],
 ["morph","Morph / variety",120],
 ["about","About",4000],
 ["careLevel","Care level",100],
 ["moistureRangeStart","Moisture · drier end",1],
 ["moistureRangeEnd","Moisture · damper end",1],
 ["temperature","Temperature",160],
 ["ventilation","Ventilation",160],
 ["activity","Activity",100],
 ["reproduction","Reproduction",100],
 ["feeding","Feeding overview",300],
 ["substrate","Substrate overview",300],
 ["keeperNotes","Keeper notes",4000],
 ["fieldGuideLinks","Field Guide links",1000],
 ["notableTraits","Notable traits",1000],
 ...flatSpeciesResearchFields.map(item=>[item.name,item.label,item.limit] as const),
] as const;
export type ImportField=(typeof IMPORT_FIELDS)[number][0];
export type ImportEntry={field:ImportField;label:string;value:string;existing:string;willReplace:boolean};
export type ParsedImport={values:Partial<Record<ImportField,string>>;warnings:string[];error:string|null};

const options:Partial<Record<ImportField,readonly string[]>>={
 careLevel:["Beginner","Intermediate","Advanced","Expert"],
 ventilation:["Low","Moderate","High"],
 activity:["Shy","Moderate","Active","Very Active"],
 reproduction:["Slow","Moderate","Fast","Prolific"]
};
export const IMPORT_MAX_CHARACTERS=100000;
export const IMPORT_RESEARCH_PROMPT=[
 "PodScape Leaf Ledger — COMPLETE species Quick Import research.",
 "Research EVERY applicable field listed below; return ONE valid JSON object using exactly these keys and allowed values.",
 "Research at least 15 relevant, independently checked sources. Prioritize taxonomy databases and peer-reviewed scientific studies, then reputable captive-care literature. Sources must be real, relevant, accessible HTTP(S) URLs, one per line in researchSources; do not invent links or pad with duplicates.",
 "Separate species-level science from hobby morph observations and breeder recommendations in evidenceNotes. Do not invent exact numerical ranges. Omit genuinely unsupported values; no placeholders, guesses or generic disclaimers inside temperature.",
 "Temperature format ONLY: 20–26°C (68–79°F) using appropriate researched range and correct conversion, without extra commentary. About should be approximately 40–45 words.",
 "Use only canonical Notable Traits (up to five); supported dropdowns only: careLevel Beginner/Intermediate/Advanced/Expert; ventilation Low/Moderate/High; activity Shy/Moderate/Active/Very Active; reproduction Slow/Moderate/Fast/Prolific.",
 "moistureRangeStart/moistureRangeEnd are each integers 1–5; moistRefugeCondition is Lightly damp/Moist/Very moist; evidenceScope is species-level/morph-specific/mixed; evidenceQuality is scientific/breeder-consensus/limited.",
 "Output valid JSON without markdown fences. Do not abbreviate text mid-word, truncate any source URL or place research essays into quick-glance fields.",
 "Canonical Notable Traits: "+SPECIES_TRAIT_REGISTRY.map(trait=>trait.label).join("; "),
 "Exact field names and maximum lengths (characters):",
 ...IMPORT_FIELDS.map(([key,label,limit])=>key+" — "+label+" — max "+limit),
 "Skip record identity verification, photos, publication status, slug and catalogue ID. Imported values are reviewed before saving."
].join("\n");
export const IMPORT_TEMPLATE=JSON.stringify({
 commonName:"",scientificName:"",genus:"",species:"",morph:"",
 about:"",careLevel:"",temperature:"",ventilation:"",
 activity:"",reproduction:"",
 moistureRangeStart:null,moistureRangeEnd:null,
 feeding:"",substrate:"",notableTraits:[],keeperNotes:"",fieldGuideLinks:[],
 ...Object.fromEntries(flatSpeciesResearchFields.map(item=>[item.name,""]))
},null,2);

/** Treat all imported values as untrusted, even when they came from an assistant. */
export function parseSpeciesImport(source:string):ParsedImport{
 const warnings:string[]=[];
 if(source.length>IMPORT_MAX_CHARACTERS)return {values:{},warnings,error:"Import exceeds the "+IMPORT_MAX_CHARACTERS.toLocaleString("en-CA")+" character limit. No fields were applied."};
 let decoded:unknown;
 try{
  let trimmed=source.trim();
  if(trimmed.startsWith("```")){
   trimmed=trimmed.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
  }
  decoded=JSON.parse(trimmed);
 }catch{return {values:{},warnings,error:"Paste a valid JSON object. You can ask ChatGPT for a PodScape species Quick Import JSON block."};}
 if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))return {values:{},warnings,error:"The import must be one JSON object containing species fields."};
 const input=decoded as Record<string,unknown>;
 const values:Partial<Record<ImportField,string>>={};
 const accepted=new Set<string>(IMPORT_FIELDS.map(row=>row[0]));
 const rejected:string[]=[];
 for(const [field,label,limit] of IMPORT_FIELDS){
  const raw=input[field];
  if(raw===undefined||raw===null||raw==="")continue;
  if(field==="moistureRangeStart"||field==="moistureRangeEnd"){
   if(![1,2,3,4,5,"1","2","3","4","5"].includes(raw as string|number)){
    rejected.push(label+": expected a whole-number zone from 1 (drier area, not bone-dry) to 5 (very moist, not waterlogged).");continue;
   }
   values[field]=String(raw);continue;
  }
  if(field==="notableTraits"||field==="fieldGuideLinks"){
   if(!Array.isArray(raw)&&typeof raw!=="string"){rejected.push(label+": expected an array of strings or newline-separated text.");continue;}
   const items=Array.isArray(raw)?raw:raw.split(/\r?\n/);
   if(!items.every(item=>typeof item==="string")){rejected.push(label+": all items must be text.");continue;}
   const cleaned=items.map((item:string)=>item.trim()).filter(Boolean);
   if(field==="notableTraits"){
    if(cleaned.some((item:string)=>item.length>65)){rejected.push("Notable traits: each trait must be 65 characters or shorter.");continue;}
    const unique=[...new Set(cleaned.map((item:string)=>normalizeSpeciesTrait(item)))];
    if(unique.length>5){rejected.push("Notable traits: provide no more than five unique traits; none were imported.");continue;}
    values[field]=unique.join("\n");
   }else{
    const joined=cleaned.join("\n");
    if(joined.length>limit){rejected.push(label+": "+joined.length+" characters exceeds "+limit+"; no text was truncated.");continue;}
    values[field]=joined;
   }
   continue;
  }
  if(typeof raw==="number"&&Number.isFinite(raw)){
   if(!["humidityMin","humidityMax","moistZoneCoverage","broodAverage","broodMin","broodMax","adultSizeMm"].includes(field)){
    rejected.push(label+": expected text; nothing was imported.");continue;
   }
  }else if(typeof raw!=="string"){rejected.push(label+": expected text; nothing was imported.");continue;}
  const clean=String(raw).trim();
  if(!clean)continue;
  if(clean.length>limit){rejected.push(label+": "+clean.length+" characters exceeds "+limit+"; no text was truncated.");continue;}
  const researchError=validateSpeciesResearchField(field,clean);
  if(researchError){rejected.push(label+": "+researchError);continue;}
  const choices=options[field];
  if(choices&&!choices.includes(clean)){rejected.push(label+": unsupported choice “"+clean+"”.");continue;}
  values[field]=clean;
 }
 const start=values.moistureRangeStart,end=values.moistureRangeEnd;
 if(Boolean(start)!==Boolean(end)||(start&&end&&Number(start)>Number(end))){
  delete values.moistureRangeStart;delete values.moistureRangeEnd;
  rejected.push("Moisture range must include both endpoints, with the drier end first.");
 }
 if(values.humidityMin && values.humidityMax && Number(values.humidityMin)>Number(values.humidityMax)){
   delete values.humidityMin;delete values.humidityMax;
   rejected.push("Relative humidity lower bound exceeds upper bound.");
 }
 if(values.broodMin && values.broodMax && Number(values.broodMin)>Number(values.broodMax)){
   delete values.broodMin;delete values.broodMax;
   rejected.push("Brood minimum exceeds maximum.");
 }
 const unknown=Object.keys(input).filter(key=>!accepted.has(key));
 if(unknown.length)rejected.push("Unsupported keys: "+unknown.slice(0,10).join(", ")+(unknown.length>10?"…":"")+". Use only keys in the contract.");
 return {values,warnings:[...rejected,...warnings],error:rejected.length?"Import blocked: "+rejected.length+" validation issue(s). Fix the listed fields and paste again; nothing will be applied.":Object.keys(values).length===0?"No supported, nonempty fields were found.":null};
}

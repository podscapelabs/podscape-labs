import {flatSpeciesResearchFields,validateSpeciesResearchField} from "@/lib/species-research-fields";
import {normalizeSpeciesTrait} from "@/lib/species-traits";
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
 if(source.length>30000)return {values:{},warnings,error:"Import is too large (maximum 30,000 characters)."};
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
 for(const [field,label,limit] of IMPORT_FIELDS){
  const raw=input[field];
  if(raw===undefined||raw===null||raw==="")continue;
  if(field==="moistureRangeStart"||field==="moistureRangeEnd"){
   if(![1,2,3,4,5,"1","2","3","4","5"].includes(raw as string|number)){
    warnings.push(label+": expected a whole-number zone from 1 (drier area, not bone-dry) to 5 (very moist, not waterlogged).");continue;
   }
   values[field]=String(raw);continue;
  }
  if(field==="notableTraits"||field==="fieldGuideLinks"){
   if(!Array.isArray(raw)&&typeof raw!=="string"){warnings.push(label+": expected an array of strings or newline-separated text.");continue;}
   const items=Array.isArray(raw)?raw:raw.split(/\r?\n/);
   if(!items.every(item=>typeof item==="string")){warnings.push(label+": all items must be text.");continue;}
   const cleaned=items.map((item:string)=>item.trim()).filter(Boolean);
   if(field==="notableTraits"){
    if(cleaned.length>5)warnings.push("Notable traits: limited to the first five entries.");
    values[field]=[...new Set(cleaned.map((item:string)=>normalizeSpeciesTrait(item)))].slice(0,5).join("\n");
   }else{
    values[field]=cleaned.join("\n").slice(0,limit);
   }
   continue;
  }
  if(typeof raw==="number"&&Number.isFinite(raw)){
   if(!["humidityMin","humidityMax","moistZoneCoverage","broodAverage","broodMin","broodMax","adultSizeMm"].includes(field)){
    warnings.push(label+": expected text; skipped.");continue;
   }
  }else if(typeof raw!=="string"){warnings.push(label+": expected text; skipped.");continue;}
  const clean=String(raw).trim();
  if(!clean)continue;
  if(clean.length>limit)warnings.push(label+": truncated to "+limit+" characters.");
  const researchError=validateSpeciesResearchField(field,clean);
  if(researchError){warnings.push(label+": "+researchError);continue;}
  const choices=options[field];
  if(choices&&!choices.includes(clean)){warnings.push(label+": unsupported choice “"+clean+"”; skipped.");continue;}
  values[field]=clean.slice(0,limit);
 }
 const start=values.moistureRangeStart,end=values.moistureRangeEnd;
 if(Boolean(start)!==Boolean(end)||(start&&end&&Number(start)>Number(end))){
  delete values.moistureRangeStart;delete values.moistureRangeEnd;
  warnings.push("Moisture range skipped: both endpoints are required, with the drier end first.");
 }
 if(values.humidityMin && values.humidityMax && Number(values.humidityMin)>Number(values.humidityMax)){
   delete values.humidityMin;delete values.humidityMax;
   warnings.push("Relative humidity bounds skipped: lower bound exceeds upper bound.");
 }
 if(values.broodMin && values.broodMax && Number(values.broodMin)>Number(values.broodMax)){
   delete values.broodMin;delete values.broodMax;
   warnings.push("Brood range skipped: minimum exceeds maximum.");
 }
 const unknown=Object.keys(input).filter(key=>!accepted.has(key));
 if(unknown.length)warnings.push("Ignored unsupported keys: "+unknown.slice(0,10).join(", ")+(unknown.length>10?"…":"")+".");
 return {values,warnings,error:Object.keys(values).length===0?"No supported, nonempty fields were found.":null};
}

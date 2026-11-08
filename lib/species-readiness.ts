import type {SpeciesRecord} from "@/data/species";

/** Editorial guidance only: not a substitute for a taxonomic or husbandry review. */
export function speciesReadiness(record:SpeciesRecord){
  const missing:string[]=[];
  if(!record.commonName?.trim())missing.push("common name");
  if(!record.scientificName?.trim())missing.push("scientific name");
  if(record.identityStatus==="unassigned")missing.push("identity status");
  if(!(record.about||record.summary||"").trim())missing.push("about");
  if(!record.careLevel?.trim())missing.push("care level");
  if(!record.moistureProfile?.trim())missing.push("moisture preference");
  if(!record.image)missing.push("photo");
  return {missing,ready:missing.length===0};
}

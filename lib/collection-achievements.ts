import {achievementCatalog,type AchievementDefinition} from "@/data/achievement-catalog";
import type {SpeciesRecord} from "@/data/species";

export const GENUS_COLLECTION_SCALE=[[1,15,"First Profile"],[3,25,"Explorer"],[5,40,"Keeper"],[10,75,"Specialist"],[20,125,"Curator"]] as const;
/** Every genus in the Ledger gets the same ladder. Existing badge keys and rewards stay intact. */
export function collectionAchievementCatalog(records:Pick<SpeciesRecord,"kind"|"genus">[]):AchievementDefinition[]{
 const existing=new Set(achievementCatalog.map(badge=>badge.key));
 const genera=[...new Set(records.filter(record=>record.kind==="species").map(record=>record.genus.trim().toLowerCase()).filter(genus=>/^[a-z]+$/.test(genus)))].sort();
 const generated=genera.flatMap(genus=>GENUS_COLLECTION_SCALE.flatMap(([count,exp,title])=>{
  const key="collection_"+genus+"_"+count;
  if(existing.has(key))return[];
  const label=genus[0].toUpperCase()+genus.slice(1);
  return[{key,title:label+" "+title,description:"Collect "+count+" different "+label+" profiles.",exp,icon:"❧",href:"/ledger",status:"available" as const}];
 }));
 return [...achievementCatalog,...generated];
}

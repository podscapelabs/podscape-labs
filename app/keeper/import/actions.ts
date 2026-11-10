"use server";
import { revalidatePath } from "next/cache";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { keeperContext } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive } from "@/data/species";

export type ImportRow = {
  speciesId: string; name: string; label: string; quantity: number;
  status: string; notes: string;
};
export type ImportOutcome = {success:boolean;created:number;skipped:number;error?:string};

const allowedStatuses = new Set(["planning","establishing","stable","thriving","declining","no-longer-kept"]);
const keyFor = (row:{speciesId:string;name:string;label:string})=>
  [row.speciesId,row.name.trim().toLocaleLowerCase("en-CA"),row.label.trim().toLocaleLowerCase("en-CA")].join("\u001f");

export async function importKeeperCsvRows(input:{rows:ImportRow[]}):Promise<ImportOutcome>{
  await requireCustomerPreviewAccess();
  const empty={success:false,created:0,skipped:0};
  if(!input || !Array.isArray(input.rows) || !input.rows.length || input.rows.length>100)
    return {...empty,error:"Choose between 1 and 100 reviewed colonies per import."};
  const rows:ImportRow[]=[];
  const batchKeys=new Set<string>();
  for(const raw of input.rows){
    if(!raw || typeof raw.speciesId!=="string" || typeof raw.name!=="string" ||
      typeof raw.label!=="string" || typeof raw.notes!=="string" ||
      typeof raw.status!=="string" ||
      !raw.speciesId || raw.speciesId.length>120 || !raw.name.trim() || raw.name.trim().length>80 ||
      raw.label.trim().length>70 || raw.notes.trim().length>5000 ||
      !Number.isInteger(raw.quantity) || raw.quantity<0 || raw.quantity>99999 ||
      !allowedStatuses.has(raw.status))return {...empty,error:"Review the species, quantity, and text fields before importing."};
    const item={speciesId:raw.speciesId,name:raw.name.trim(),label:raw.label.trim(),
      notes:raw.notes.trim(),quantity:raw.quantity,status:raw.status};
    const key=keyFor(item);
    if(batchKeys.has(key))return {...empty,error:"Your selection contains duplicate species / bin name / label combinations. Review these rows before saving."};
    batchKeys.add(key);
    rows.push(item);
  }
  const {db,user}=await keeperContext();
  if(!db||!user)return {...empty,error:"Sign in to import colonies."};
  const catalog=await getSpeciesRecords();
  const eligible=new Set(catalog.filter(r=>r.kind==="species"&&isSpeciesRecordActive(r)).map(r=>r.id));
  if(rows.some(r=>!eligible.has(r.speciesId)))return {...empty,error:"Some matched species are no longer available. Refresh the importer."};

  // Never overwrite existing enclosures: identical species + bin name + label is considered a duplicate.
  const {data:existing,error:readError}=await db.from("keeper_enclosures")
    .select("species_id,name,label").eq("user_id",user.id);
  if(readError||!existing)return {...empty,error:"Unable to check existing bins. Nothing has been imported."};
  const prior=new Set(existing.map(r=>keyFor({speciesId:String(r.species_id),name:String(r.name),label:String(r.label||"")})));
  const additions=rows.filter(r=>!prior.has(keyFor(r)));
  const skipped=rows.length-additions.length;
  if(!additions.length)return {success:true,created:0,skipped};
  const speciesIds=[...new Set(additions.map(r=>r.speciesId))];

  const {data:collected,error:collectionError}=await db.from("member_species_collection")
    .select("species_id").eq("user_id",user.id).in("species_id",speciesIds);
  if(collectionError||!collected)return {...empty,error:"Unable to verify My Collection. Nothing has been imported."};
  const owned=new Set(collected.map(r=>String(r.species_id)));
  const newSpecies=speciesIds.filter(id=>!owned.has(id));
  if(newSpecies.length){
    const {error:addError}=await db.from("member_species_collection")
      .insert(newSpecies.map(species_id=>({user_id:user.id,species_id})));
    if(addError && addError.code!=="23505")
      return {...empty,error:"Could not add the imported species to My Collection. No bins were created."};
  }

  const {data:saved,error:saveError}=await db.from("keeper_enclosures").insert(additions.map(r=>({
    user_id:user.id,species_id:r.speciesId,name:r.name,label:r.label,quantity:r.quantity,
    status:r.status,notes:r.notes
  }))).select("id");
  if(saveError||!saved){
    return {...empty,error:"Bin creation failed. Some species may have been added to My Collection, but no existing bins were changed. Review My Collection before retrying."};
  }
  revalidatePath("/keeper");
  revalidatePath("/keeper/collection");
  revalidatePath("/ledger/my-collection");
  revalidatePath("/account");
  return {success:true,created:saved.length,skipped};
}

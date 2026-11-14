import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

export type ApprovedSpeciesPhoto={url:string;credit:string};

/**
 * Photos remain in a private bucket. Only explicitly consented, owner-approved
 * photos receive short-lived signed display URLs. Never expose private or
 * pending uploads on a catalogue card.
 */
export async function getApprovedSpeciesPhotos(speciesIds:string[]):Promise<Record<string,ApprovedSpeciesPhoto[]>>{
 const db=getSupabaseAdmin();
 if(!db||speciesIds.length===0)return {};
 const allowed=new Set(speciesIds);
 const {data,error}=await db.from("member_species_photos")
  .select("species_id,storage_path,credit_type,credit_name")
  .in("species_id",speciesIds)
  .eq("moderation_status","approved")
  .eq("contribution_consent",true)
  .order("created_at",{ascending:false})
  .limit(400);
 if(error||!data?.length){if(error)console.error("Could not load approved species photos",error.code);return {};}
 // Limit animations and signed URL creation: no more than three keeper photos per species.
 const chosen=new Map<string,typeof data>();
 for(const photo of data){
  if(!allowed.has(photo.species_id))continue;
  const list=chosen.get(photo.species_id)||[];
  if(list.length<3){list.push(photo);chosen.set(photo.species_id,list)}
 }
 const result:Record<string,ApprovedSpeciesPhoto[]>={};
 await Promise.all([...chosen.entries()].map(async ([speciesId,photos])=>{
  const signed=await Promise.all(photos.map(async photo=>{
   const {data:link}=await db.storage.from("member-species-photos").createSignedUrl(photo.storage_path,3600);
   if(!link?.signedUrl)return null;
   return {url:link.signedUrl,credit:photo.credit_type==="anonymous"?"Anonymous keeper":photo.credit_name||"PodScape Keeper"};
  }));
  const ready=signed.filter((photo):photo is ApprovedSpeciesPhoto=>Boolean(photo));
  if(ready.length)result[speciesId]=ready;
 }));
 return result;
}

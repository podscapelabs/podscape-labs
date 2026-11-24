"use server";
import { revalidatePath } from "next/cache";
import { customerSupabase } from "@/lib/customer-auth/server";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive } from "@/data/species";
export async function setSpeciesWished(speciesId:string,wished:boolean):Promise<{success:boolean;error?:string}>{
 await requireCustomerPreviewAccess();
 if(typeof speciesId!=="string"||!speciesId.length||speciesId.length>120||typeof wished!=="boolean")return {success:false,error:"Invalid species."};
 const db=await customerSupabase(); if(!db)return {success:false,error:"Sign in first."};
 const {data:{user}}=await db.auth.getUser(); if(!user)return {success:false,error:"Sign in first."};
 if(wished){
 const eligible=(await getSpeciesRecords()).some(r=>r.id===speciesId&&r.kind==="species"&&isSpeciesRecordActive(r)&&r.status==="published");
 if(!eligible)return {success:false,error:"Species unavailable."};
 const {data:owned,error:ownershipError}=await db.from("member_species_collection").select("species_id").eq("user_id",user.id).eq("species_id",speciesId).maybeSingle();
 if(ownershipError||owned)return {success:false,error:"Species already collected or ownership unavailable."};
 const {error}=await db.from("member_species_wishlist").insert({user_id:user.id,species_id:speciesId});
 if(error&&error.code!=="23505")return {success:false,error:"Wishlist could not be saved."};
 }else{
 const {error}=await db.from("member_species_wishlist").delete().eq("user_id",user.id).eq("species_id",speciesId);
 if(error)return {success:false,error:"Wishlist could not be updated."};
 }
 revalidatePath("/ledger","layout");return {success:true};
}

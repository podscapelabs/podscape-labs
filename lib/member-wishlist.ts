import "server-only";
import { customerSupabase } from "@/lib/customer-auth/server";
export async function getMemberWishlistIds():Promise<string[]> {
 const db=await customerSupabase(); if(!db)return [];
 const {data:{user}}=await db.auth.getUser(); if(!user)return [];
 const {data,error}=await db.from("member_species_wishlist").select("species_id").eq("user_id",user.id);
 if(error){console.error("Wishlist unavailable",error.code);return [];}
 return (data||[]).map(row=>row.species_id as string);
}

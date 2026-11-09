import "server-only";
import { getSupabaseAdmin, getWritableSupabaseAdmin } from "@/lib/supabase-admin";

export const cardCategories = ["species","environment","food","event","gameplay"] as const;
export type CardCategory = typeof cardCategories[number];
export type PodBoundCard = {
  id:string;title:string;card_number:string;set_name:string;category:CardCategory;
  status:"draft"|"published"|"archived";featured:boolean;species_record_id:string|null;
  summary:string;ability_text:string;gameplay_notes:string;biology_notes:string;rules_version:string;
  artist_name:string;core_art_path:string|null;alternate_art_path:string|null;
  core_art_alt:string;alternate_art_alt:string;created_at:string;updated_at:string;
};
export async function getPodBoundCards():Promise<PodBoundCard[]> {
  const db=getSupabaseAdmin();
  if(!db) return [];
  const {data,error}=await db.from("podbound_cards").select("*").order("updated_at",{ascending:false});
  if(error) throw new Error("Unable to load PodBound cards: "+error.message);
  return (data||[]) as PodBoundCard[];
}
export async function getPodBoundCard(id:string):Promise<PodBoundCard|null>{
  const db=getSupabaseAdmin();
  if(!db) return null;
  const {data,error}=await db.from("podbound_cards").select("*").eq("id",id).maybeSingle();
  if(error) throw new Error(error.message);
  return data as PodBoundCard|null;
}
export async function getPodBoundArtworkUrl(path:string|null){
  if(!path)return null;
  const db=getSupabaseAdmin();
  if(!db)return null;
  const {data,error}=await db.storage.from("podbound-art").createSignedUrl(path,3600);
  if(error)return null;
  return data.signedUrl;
}
export function requireCardDatabase(){
  const db=getWritableSupabaseAdmin();
  if(!db) throw new Error("Card Desk needs its Supabase connection.");
  return db;
}

import "server-only";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Photo={id:string;species_id:string;storage_path:string;credit_type:string;credit_name:string;moderation_status:string;user_id:string;created_at:string};
export type GalleryPhoto={id:string;url:string;credit:string;status:string;mine:boolean};
export async function getSpeciesPhotoGallery(speciesId:string):Promise<GalleryPhoto[]>{
  const db=getSupabaseAdmin();
  if(!db)return [];
  const customer=await customerSupabase();
  const user=customer?(await customer.auth.getUser()).data.user:null;
  // These are deliberately separate queries; private photos are never exposed to unrelated members.
  const [publicResult,mineResult]=await Promise.all([
    db.from("member_species_photos").select("id,species_id,storage_path,credit_type,credit_name,moderation_status,user_id,created_at").eq("species_id",speciesId).eq("moderation_status","approved").order("created_at",{ascending:false}).limit(24),
    user?db.from("member_species_photos").select("id,species_id,storage_path,credit_type,credit_name,moderation_status,user_id,created_at").eq("species_id",speciesId).eq("user_id",user.id).order("created_at",{ascending:false}).limit(25):Promise.resolve({data:[]}),
  ]);
  const photos=new Map<string,Photo>();
  for(const photo of [...(publicResult.data||[]),...(mineResult.data||[])] as Photo[])photos.set(photo.id,photo);
  return (await Promise.all([...photos.values()].map(async photo=>{
    const {data}=await db.storage.from("member-species-photos").createSignedUrl(photo.storage_path,300);
    if(!data?.signedUrl)return null;
    return {id:photo.id,url:data.signedUrl,credit:photo.credit_type==="anonymous"?"Anonymous keeper":photo.credit_name||"PodScape Keeper",status:photo.moderation_status,mine:photo.user_id===user?.id};
  }))).filter((photo):photo is GalleryPhoto=>Boolean(photo));
}

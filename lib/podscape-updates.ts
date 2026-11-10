import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

export const updateCategories=[
 {id:"leaf_ledger",label:"Leaf Ledger",icon:"leaf",kind:"species"},
 {id:"whats_improved",label:"What's Improved",icon:"creative",kind:"updates"},
 {id:"new_features",label:"New Features",icon:"grid",kind:"features"},
 {id:"field_guide",label:"Field Guide",icon:"book",kind:"guides"},
 {id:"shop_vendors",label:"Shop & Vendors",icon:"shop",kind:"listings"},
 {id:"fun_podbound",label:"Fun Zone & PodBound",icon:"gamepad",kind:"releases"}
] as const;
export type UpdateCategory=(typeof updateCategories)[number]["id"];
export type UpdateRecord={id:string;category:UpdateCategory;title:string;summary:string;href:string;status:"draft"|"published";published_at:string|null;updated_at:string;created_at:string};
export function validDestination(href:string):boolean{
 if(!href.startsWith("/")||href.startsWith("//")||href.length>300||/[\\\s<>]/.test(href))return false;
 try{
  const url=new URL(href,"https://www.podscapelabs.com");
  return url.origin==="https://www.podscapelabs.com"&&url.pathname.startsWith("/")&&!url.username&&!url.password;
 }catch{return false;}
}
export async function getPublishedUpdates():Promise<UpdateRecord[]>{
 const db=getSupabaseAdmin();if(!db)return [];
 const {data,error}=await db.from("podscape_updates").select("id,category,title,summary,href,status,published_at,updated_at,created_at")
  .eq("status","published").order("published_at",{ascending:false}).limit(120);
 if(error){console.error("Published updates lookup failed:",error.code);return [];}
 return (data||[]) as UpdateRecord[];
}
export async function getAllUpdates():Promise<UpdateRecord[]|null>{
 const db=getSupabaseAdmin();if(!db)return null;
 const {data,error}=await db.from("podscape_updates").select("id,category,title,summary,href,status,published_at,updated_at,created_at")
  .order("updated_at",{ascending:false}).limit(200);
 return error?null:(data||[]) as UpdateRecord[];
}

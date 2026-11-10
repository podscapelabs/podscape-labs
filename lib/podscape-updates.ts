import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

import {updateCategories,type UpdateCategory} from "@/data/update-categories";
export {updateCategories};
export type {UpdateCategory};
export type UpdateRecord={id:string;category:UpdateCategory;title:string;summary:string;details:string[];href:string;status:"draft"|"published";published_at:string|null;updated_at:string;created_at:string};
export function validDestination(href:string):boolean{
 if(!href.startsWith("/")||href.startsWith("//")||href.length>300||/[\\\s<>]/.test(href))return false;
 try{
  const url=new URL(href,"https://www.podscapelabs.com");
  return url.origin==="https://www.podscapelabs.com"&&url.pathname.startsWith("/")&&!url.username&&!url.password;
 }catch{return false;}
}
export async function getPublishedUpdates():Promise<UpdateRecord[]>{
 const db=getSupabaseAdmin();if(!db)return [];
 const {data,error}=await db.from("podscape_updates").select("id,category,title,summary,details,href,status,published_at,updated_at,created_at")
  .eq("status","published").order("published_at",{ascending:false}).limit(120);
 if(error){console.error("Published updates lookup failed:",error.code);return [];}
 return (data||[]) as UpdateRecord[];
}
export async function getAllUpdates():Promise<UpdateRecord[]|null>{
 const db=getSupabaseAdmin();if(!db)return null;
 const {data,error}=await db.from("podscape_updates").select("id,category,title,summary,details,href,status,published_at,updated_at,created_at")
  .order("updated_at",{ascending:false}).limit(200);
 return error?null:(data||[]) as UpdateRecord[];
}
